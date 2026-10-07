"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBook } from "@/lib/integrations/google-books";
import { reviewInputSchema } from "@/lib/schemas/user-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveReview(formData: FormData) {
  const parsed = reviewInputSchema.safeParse({ volumeId: formData.get("volumeId"), rating: formData.get("rating"), reviewText: formData.get("reviewText") });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/book/${encodeURIComponent(parsed.data.volumeId)}`);
  const book = await getBook(parsed.data.volumeId);
  if (!book) return;
  const { data: bookId, error: bookError } = await supabase.rpc("upsert_book_for_user", { book_data: book });
  if (bookError || !bookId) throw new Error("도서 정보를 저장하지 못했습니다.");
  const { error } = await supabase.from("user_reviews").upsert({ user_id: user.id, book_id: bookId, rating: parsed.data.rating, review_text: parsed.data.reviewText || null }, { onConflict: "user_id,book_id" });
  if (error) throw new Error("평가를 저장하지 못했습니다.");
  revalidatePath(`/book/${parsed.data.volumeId}`);
}

export async function deleteReview(formData: FormData) {
  const id = String(formData.get("reviewId") ?? "");
  const volumeId = String(formData.get("volumeId") ?? "");
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const { error } = await supabase.from("user_reviews").delete().eq("id", id);
  if (error) throw new Error("평가를 삭제하지 못했습니다.");
  revalidatePath(`/book/${volumeId}`);
}

