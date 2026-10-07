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
  const { data: bookId, error: bookError } = await supabase.rpc("upsert_book_for_user", { book_data: book });
  if (bookError || !bookId) throw new Error("도서 정보를 저장하지 못했습니다.");
  const { error } = await supabase.from("user_library").upsert({ user_id: user.id, book_id: bookId, status: parsed.data.status }, { onConflict: "user_id,book_id" });
  if (error) throw new Error("서재에 저장하지 못했습니다.");
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

