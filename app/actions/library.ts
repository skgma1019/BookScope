"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBook } from "@/lib/integrations/google-books";
import { libraryInputSchema } from "@/lib/schemas/user-data";

export async function saveToLibrary(formData: FormData) {
  const parsed = libraryInputSchema.safeParse({ volumeId: formData.get("volumeId"), status: formData.get("status") });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/book/${encodeURIComponent(parsed.data.volumeId)}`);
  const book = await getBook(parsed.data.volumeId);
  if (!book) return;
  const { data: bookRecord, error: bookError } = await supabase
    .from("books")
    .upsert(
      {
        google_volume_id: book.volumeId,
        isbn10: book.isbn10 ?? null,
        isbn13: book.isbn13 ?? null,
        title: book.title,
        subtitle: book.subtitle ?? null,
        authors: book.authors,
        publisher: book.publisher ?? null,
        published_date: book.publishedDate ?? null,
        description: book.description ?? null,
        categories: book.categories,
        language: book.language ?? null,
        page_count: book.pageCount ?? null,
        thumbnail_url: book.thumbnailUrl ?? null,
        preview_link: book.previewLink ?? null,
        info_link: book.infoLink ?? null,
        canonical_volume_link: book.canonicalVolumeLink ?? null,
        google_average_rating: book.averageRating ?? null,
        google_ratings_count: book.ratingsCount ?? null,
        saleability: book.saleInfo?.saleability ?? null,
        is_ebook: book.saleInfo?.isEbook ?? null,
        buy_link: book.saleInfo?.buyLink ?? null,
        retail_price: book.saleInfo?.retailPrice?.amount ?? null,
        currency_code: book.saleInfo?.retailPrice?.currencyCode ?? null,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "google_volume_id" }
    )
    .select("id")
    .single();
  if (bookError || !bookRecord) {
    console.error("[saveToLibrary] book upsert failed", { bookError, volumeId: parsed.data.volumeId });
    throw new Error(bookError?.message || "도서 정보를 저장하지 못했습니다.");
  }
  const { error } = await supabase.from("user_library").upsert({ user_id: user.id, book_id: bookRecord.id, status: parsed.data.status }, { onConflict: "user_id,book_id" });
  if (error) {
    console.error("[saveToLibrary] user_library upsert failed", { error });
    throw new Error(error.message || "서재에 저장하지 못했습니다.");
  }
  revalidatePath(`/book/${parsed.data.volumeId}`);
  revalidatePath("/library");
}

export async function removeFromLibrary(formData: FormData) {
  const id = String(formData.get("libraryId") ?? "");
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const { error } = await supabase.from("user_library").delete().eq("id", id);
  if (error) throw new Error("서재에서 제거하지 못했습니다.");
  revalidatePath("/library");
}
