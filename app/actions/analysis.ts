"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBook } from "@/lib/integrations/google-books";
import { analyzeBook } from "@/lib/integrations/gemini";
import { createReviewSearchAdapter } from "@/lib/integrations/search";
import { volumeIdSchema } from "@/lib/schemas/book";

export type AnalysisActionResult =
  | { status: "completed"; analysisId: string }
  | { status: "insufficient_sources" }
  | { status: "failed"; message: string }
  | { status: "no_search_provider" }
  | { status: "no_gemini_key" }
  | { status: "cached"; analysisId: string };

export async function requestAnalysis(formData: FormData): Promise<AnalysisActionResult> {
  const parsed = volumeIdSchema.safeParse(formData.get("volumeId"));
  if (!parsed.success) return { status: "failed", message: "잘못된 요청입니다." };
  const volumeId = parsed.data;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/book/${encodeURIComponent(volumeId)}`);

  // 1. Look up the book record
  const { data: bookRecord } = await supabase
    .from("books")
    .select("id,title,authors,description,isbn13,isbn10,google_volume_id")
    .eq("google_volume_id", volumeId)
    .maybeSingle();

  let bookId: string;
  let bookTitle: string;
  let bookAuthors: string[];
  let bookDescription: string | null;

  if (bookRecord) {
    bookId = bookRecord.id as string;
    bookTitle = bookRecord.title as string;
    bookAuthors = (bookRecord.authors ?? []) as string[];
    bookDescription = bookRecord.description as string | null;
  } else {
    const book = await getBook(volumeId);
    if (!book) return { status: "failed", message: "도서 정보를 가져오지 못했습니다." };
    const { data: upserted, error: upsertError } = await supabase
      .from("books")
      .upsert({ google_volume_id: book.volumeId, title: book.title, authors: book.authors, description: book.description ?? null, isbn13: book.isbn13 ?? null, isbn10: book.isbn10 ?? null, categories: book.categories, fetched_at: new Date().toISOString() }, { onConflict: "google_volume_id" })
      .select("id")
      .single();
    if (upsertError || !upserted) return { status: "failed", message: "도서 저장 실패" };
    bookId = upserted.id as string;
    bookTitle = book.title;
    bookAuthors = book.authors;
    bookDescription = book.description ?? null;
  }

  // 2. Return cached analysis if exists and recent (< 30 days)
  const { data: cached } = await supabase
    .from("ai_analyses")
    .select("id,updated_at")
    .eq("book_id", bookId)
    .maybeSingle();
  if (cached) {
    const age = Date.now() - new Date(cached.updated_at as string).getTime();
    if (age < 30 * 24 * 60 * 60 * 1000) {
      return { status: "cached", analysisId: cached.id as string };
    }
  }

  // 3. Gemini backs both the review search and the analysis, so a missing key
  // is reported as such rather than as a generic missing-provider error.
  if (!process.env.GEMINI_API_KEY) return { status: "no_gemini_key" };

  // 4. Check search provider
  const searchAdapter = createReviewSearchAdapter();
  if (!searchAdapter) return { status: "no_search_provider" };

  // 5. Create analysis job
  const { data: job, error: jobError } = await supabase
    .from("analysis_jobs")
    .insert({ book_id: bookId, status: "processing", started_at: new Date().toISOString() })
    .select("id")
    .single();
  if (jobError || !job) return { status: "failed", message: "분석 작업 생성 실패" };
  const jobId = job.id as string;

  try {
    // 6. Fetch external sources
    const sources = await searchAdapter.search({
      title: bookTitle,
      authors: bookAuthors,
      isbn13: bookRecord?.isbn13 as string | null | undefined,
      isbn10: bookRecord?.isbn10 as string | null | undefined,
    });

    if (sources.length < 2) {
      await supabase.from("analysis_jobs").update({ status: "insufficient_sources", finished_at: new Date().toISOString() }).eq("id", jobId);
      if (cached) {
        await supabase.from("ai_analyses").update({ job_id: jobId }).eq("book_id", bookId);
        return { status: "cached", analysisId: cached.id as string };
      }
      return { status: "insufficient_sources" };
    }

    // 7. Save sources
    const { data: savedSources } = await supabase
      .from("review_sources")
      .insert(sources.map((s) => ({
        book_id: bookId,
        url: s.url,
        title: s.title,
        publisher: s.publisher,
        source_type: s.sourceType,
        snippet: s.snippet,
      })))
      .select("id");

    // 8. Run Gemini analysis
    const result = await analyzeBook({ title: bookTitle, authors: bookAuthors, description: bookDescription, sources });
    if (!result) {
      await supabase.from("analysis_jobs").update({ status: "failed", error_message: "Gemini 분석 실패", finished_at: new Date().toISOString() }).eq("id", jobId);
      return { status: "failed", message: "AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }

    // 9. Upsert analysis
    const { data: analysis, error: analysisError } = await supabase
      .from("ai_analyses")
      .upsert({
        book_id: bookId,
        job_id: jobId,
        summary: result.summary,
        strengths: result.strengths,
        criticisms: result.criticisms,
        mixed_opinions: result.mixed_opinions,
        themes: result.themes,
        style: result.style,
        target_readers: result.target_readers,
        evidence_notes: result.evidence_notes,
        source_count: sources.length,
        model_version: "gemini-2.5-flash",
      }, { onConflict: "book_id" })
      .select("id")
      .single();

    if (analysisError || !analysis) {
      await supabase.from("analysis_jobs").update({ status: "failed", error_message: analysisError?.message ?? "저장 실패", finished_at: new Date().toISOString() }).eq("id", jobId);
      return { status: "failed", message: "분석 결과 저장 실패" };
    }

    // 10. Link sources to analysis
    if (savedSources && savedSources.length > 0) {
      await supabase.from("analysis_sources").insert(savedSources.map((s: { id: string }) => ({ analysis_id: analysis.id as string, source_id: s.id })));
    }

    await supabase.from("analysis_jobs").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", jobId);

    revalidatePath(`/book/${volumeId}`);
    return { status: "completed", analysisId: analysis.id as string };

  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    await supabase.from("analysis_jobs").update({ status: "failed", error_message: msg, finished_at: new Date().toISOString() }).eq("id", jobId).then(() => {}, () => {});
    return { status: "failed", message: msg };
  }
}
