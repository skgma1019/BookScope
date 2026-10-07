import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { removeFromLibrary, saveToLibrary } from "@/app/actions/library";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import type { ReadingStatus } from "@/types/book";

export const metadata: Metadata = { title: "내 서재" };
const filters: { value: string; label: string }[] = [{value:"",label:"전체"},{value:"want_to_read",label:"읽고 싶어요"},{value:"reading",label:"읽는 중"},{value:"completed",label:"완독"}];

type LibraryRow = { id: string; status: ReadingStatus; created_at: string; books: { google_volume_id: string; title: string; authors: string[]; thumbnail_url: string | null; publisher: string | null } | null };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login?next=/library");
  const { status = "" } = await searchParams;
  const validStatus = filters.some((item) => item.value === status) ? status : "";
  const supabase = await createSupabaseServerClient();
  let query = supabase!.from("user_library").select("id,status,created_at,books(google_volume_id,title,authors,thumbnail_url,publisher)").order("created_at", { ascending: false });
  if (validStatus) query = query.eq("status", validStatus);
  const { data, error } = await query;
  if (error) throw new Error("서재를 불러오지 못했습니다.");
  const rows = (data ?? []) as unknown as LibraryRow[];
  return <main className="mx-auto min-h-[65vh] max-w-6xl px-5 py-12 sm:px-8">
    <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[.18em] text-[var(--teal)]">My library</p><h1 className="text-4xl font-semibold tracking-[-.04em] text-[var(--navy)]">내 서재</h1><p className="mt-3 text-[var(--muted)]">읽고 싶은 책과 독서 중인 책을 한곳에서 관리하세요.</p>
    <nav className="my-9 flex gap-2 overflow-x-auto pb-1" aria-label="독서 상태 필터">{filters.map((filter) => <Link key={filter.value} href={filter.value ? `/library?status=${filter.value}` : "/library"} className={`shrink-0 rounded-full px-5 py-2.5 font-sans text-sm font-bold ${validStatus === filter.value ? "bg-[var(--navy)] text-white" : "border border-[var(--line)] bg-white text-[var(--muted)]"}`}>{filter.label}</Link>)}</nav>
    {rows.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#c4c0bb] bg-white py-20 text-center"><h2 className="text-2xl font-semibold text-[var(--navy)]">아직 담긴 책이 없습니다</h2><p className="mt-3 text-[var(--muted)]">마음에 드는 책을 찾아 서재에 추가해보세요.</p><Link href="/search" className="mt-6 inline-block rounded-full bg-[var(--navy)] px-6 py-3 font-sans text-sm font-bold text-white">책 찾으러 가기</Link></div> : <div className="grid gap-4 md:grid-cols-2">{rows.map((row) => row.books && <Card key={row.id} className="flex gap-5 p-5"><BookCover src={row.books.thumbnail_url ?? undefined} title={row.books.title} className="h-40 w-27 shrink-0" /><div className="flex min-w-0 flex-1 flex-col"><Link href={`/book/${row.books.google_volume_id}`} className="line-clamp-2 text-xl font-semibold leading-snug text-[var(--navy)] hover:underline">{row.books.title}</Link><p className="mt-2 line-clamp-1 text-sm text-[var(--muted)]">{row.books.authors?.join(", ") || "저자 정보 없음"}</p><div className="mt-auto flex flex-wrap items-end gap-2 pt-4"><form action={saveToLibrary}><input type="hidden" name="volumeId" value={row.books.google_volume_id} /><select name="status" defaultValue={row.status} className="h-10 rounded-full border border-[var(--line)] bg-white px-3 font-sans text-xs font-semibold"><option value="want_to_read">읽고 싶어요</option><option value="reading">읽는 중</option><option value="completed">완독</option></select><Button type="submit" variant="ghost" className="min-h-10 px-3 text-xs">저장</Button></form><form action={removeFromLibrary} className="ml-auto"><input type="hidden" name="libraryId" value={row.id} /><Button type="submit" variant="ghost" className="min-h-10 px-2 text-xs text-[#a3271b]">제거</Button></form></div></div></Card>)}</div>}
  </main>;
}

