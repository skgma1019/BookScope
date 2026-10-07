import type { Metadata } from "next";
import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { SearchForm } from "@/components/search-form";
import { searchBooks } from "@/lib/integrations/google-books";
import { bookSearchSchema } from "@/lib/schemas/book";

export const metadata: Metadata = { title: "도서 검색" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = bookSearchSchema.safeParse({ q: params.q, startIndex: params.startIndex ?? 0 });
  let result = null; let error = "";
  if (parsed.success) {
    try { result = await searchBooks(parsed.data.q, parsed.data.startIndex); } catch { error = "도서 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요."; }
  }
  const query = typeof params.q === "string" ? params.q : "";
  return <main className="mx-auto min-h-[65vh] max-w-6xl px-5 py-12 sm:px-8">
    <div className="mb-12"><p className="mb-3 font-sans text-xs font-bold uppercase tracking-[.18em] text-[var(--teal)]">Book search</p><h1 className="mb-7 text-4xl font-semibold tracking-[-.035em] text-[var(--navy)]">어떤 책을 찾고 있나요?</h1><SearchForm defaultValue={query} compact /></div>
    {!query && <Empty title="검색어를 입력해주세요" text="작품명, 저자명 또는 ISBN으로 찾을 수 있어요." />}
    {query && !parsed.success && <Empty title="검색어를 확인해주세요" text="200자 이내의 검색어를 입력해주세요." />}
    {error && <Empty title="검색 중 문제가 생겼습니다" text={error} />}
    {result && result.items.length === 0 && <Empty title="검색 결과가 없습니다" text="다른 제목이나 저자명, ISBN으로 다시 검색해보세요." />}
    {result && result.items.length > 0 && <>
      <div className="mb-6 flex items-end justify-between"><div><p className="text-[var(--muted)]"><strong className="text-[var(--ink)]">‘{parsed.success ? parsed.data.q : query}’</strong> 검색 결과</p><p className="mt-1 font-sans text-xs text-[var(--muted)]">유사한 판본과 권별 도서를 각각 표시합니다.</p></div><span className="font-sans text-sm text-[var(--muted)]">약 {result.totalItems.toLocaleString("ko-KR")}건</span></div>
      <div className="grid gap-4 md:grid-cols-2">{result.items.map((book) => <BookCard key={book.volumeId} book={book} />)}</div>
      <div className="mt-10 flex justify-center gap-3">{parsed.success && parsed.data.startIndex > 0 && <PageLink q={parsed.data.q} start={Math.max(0, parsed.data.startIndex - 20)}>이전</PageLink>}{result.nextStartIndex !== null && parsed.success && <PageLink q={parsed.data.q} start={result.nextStartIndex}>다음 결과</PageLink>}</div>
    </>}
  </main>;
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-[24px] border border-dashed border-[#c4c0bb] bg-white px-6 py-20 text-center"><h2 className="text-2xl font-semibold text-[var(--navy)]">{title}</h2><p className="mt-3 text-[var(--muted)]">{text}</p></div>; }
function PageLink({ q, start, children }: { q: string; start: number; children: React.ReactNode }) { return <Link className="rounded-full border border-[var(--line)] bg-white px-6 py-3 font-sans text-sm font-bold text-[var(--navy)] hover:border-[var(--navy)]" href={`/search?q=${encodeURIComponent(q)}&startIndex=${start}`}>{children}</Link>; }

