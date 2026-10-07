import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Globe2, ShoppingBag, Star } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { Card } from "@/components/ui/card";
import { LibraryControls } from "@/components/library-controls";
import { ReviewForm } from "@/components/review-form";
import { getBook } from "@/lib/integrations/google-books";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ volumeId: string }> }): Promise<Metadata> {
  const { volumeId } = await params;
  try { const book = await getBook(volumeId); return { title: book?.title ?? "도서 상세" }; } catch { return { title: "도서 상세" }; }
}

export default async function BookDetailPage({ params }: { params: Promise<{ volumeId: string }> }) {
  const { volumeId } = await params;
  const book = await getBook(volumeId);
  if (!book) notFound();
  const user = await getCurrentUser();
  let library: { status: string } | null = null;
  let review: { id: string; rating: number | null; review_text: string | null } | null = null;
  if (user) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: stored } = await supabase.from("books").select("id").eq("google_volume_id", volumeId).maybeSingle();
      if (stored) {
        const [{ data: libraryData }, { data: reviewData }] = await Promise.all([
          supabase.from("user_library").select("status").eq("book_id", stored.id).maybeSingle(),
          supabase.from("user_reviews").select("id,rating,review_text").eq("book_id", stored.id).maybeSingle(),
        ]);
        library = libraryData; review = reviewData;
      }
    }
  }
  const price = formatWon(book.saleInfo?.retailPrice?.amount, book.saleInfo?.retailPrice?.currencyCode);
  return <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
    <Link href="/search" className="font-sans text-sm font-semibold text-[var(--muted)] hover:text-[var(--navy)]">← 검색 결과로</Link>
    <section className="mt-7 grid gap-9 lg:grid-cols-[240px_1fr] lg:gap-14">
      <BookCover src={book.thumbnailUrl} title={book.title} priority className="mx-auto h-[330px] w-[220px] lg:mx-0" />
      <div className="min-w-0">
        <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[.15em] text-[var(--teal)]">{book.categories[0] ?? "Book details"}</p>
        <h1 className="text-4xl font-semibold leading-[1.2] tracking-[-.045em] text-[var(--navy)] sm:text-5xl">{book.title}</h1>
        {book.subtitle && <p className="mt-3 text-xl text-[var(--muted)]">{book.subtitle}</p>}
        <p className="mt-6 text-lg">{book.authors.length ? book.authors.join(", ") : "저자 정보 없음"}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{[book.publisher, book.publishedDate].filter(Boolean).join(" · ") || "출판 정보 없음"}</p>
        {book.averageRating != null && <p className="mt-4 flex items-center gap-2 font-sans text-sm"><Star size={17} fill="#d4a514" className="text-[#d4a514]" /><strong>{book.averageRating}</strong><span className="text-[var(--muted)]">Google Books · {book.ratingsCount?.toLocaleString("ko-KR") ?? 0}개 평가</span></p>}
        <div className="mt-8 flex flex-wrap gap-3">{user ? <LibraryControls volumeId={volumeId} currentStatus={library?.status} /> : <Link href={`/login?next=/book/${encodeURIComponent(volumeId)}`} className="inline-flex h-11 items-center rounded-full bg-[var(--teal)] px-5 font-sans text-sm font-semibold text-white">로그인하고 서재에 담기</Link>}</div>
      </div>
    </section>

    <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="p-6 sm:p-8"><SectionTitle>작품 소개</SectionTitle><div className="prose-book">{book.description ? <p>{book.description.replace(/<[^>]*>/g, "")}</p> : <p>제공된 작품 설명이 없습니다.</p>}</div></Card>
        <Card className="p-6 sm:p-8"><SectionTitle>내 평가</SectionTitle>{user ? <ReviewForm volumeId={volumeId} review={review} /> : <div className="rounded-2xl bg-[var(--paper)] p-6 text-center"><p className="text-[var(--muted)]">별점과 리뷰를 남기려면 로그인이 필요합니다.</p><Link className="mt-4 inline-block font-sans text-sm font-bold text-[var(--navy)]" href={`/login?next=/book/${encodeURIComponent(volumeId)}`}>로그인하기 →</Link></div>}</Card>
      </div>
      <aside className="space-y-6">
        <Card className="p-6"><SectionTitle>도서 정보</SectionTitle><dl className="space-y-4 text-sm">{[["ISBN-13", book.isbn13], ["ISBN-10", book.isbn10], ["페이지", book.pageCount ? `${book.pageCount}쪽` : undefined], ["언어", book.language?.toUpperCase()], ["카테고리", book.categories.join(", ") || undefined]].map(([term, value]) => <div key={term} className="grid grid-cols-[80px_1fr] gap-3"><dt className="text-[var(--muted)]">{term}</dt><dd>{value ?? "정보 없음"}</dd></div>)}</dl>{book.previewLink && <a href={book.previewLink} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center gap-2 font-sans text-sm font-bold text-[var(--navy)]">Google Books에서 미리보기 <ExternalLink size={15} /></a>}</Card>
        <Card className="overflow-hidden"><div className="bg-[var(--navy)] p-6 text-white"><ShoppingBag className="mb-4 text-[#8eaaf0]" /><h2 className="text-xl font-semibold">구매 정보</h2>{book.saleInfo?.isEbook && <p className="mt-2 font-sans text-xs text-[#b9cbf6]">전자책</p>}{price && <p className="mt-4 text-2xl font-semibold">{price}</p>}</div><div className="p-6">{book.saleInfo?.buyLink ? <a href={book.saleInfo.buyLink} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--teal)] font-sans text-sm font-bold text-white">Google에서 구매하기 <ExternalLink size={16} /></a> : <p className="text-sm leading-6 text-[var(--muted)]">현재 Google을 통한 구매 정보가 없습니다.</p>}</div></Card>
        <div className="flex gap-3 rounded-2xl bg-[#e2f2f1] p-5 text-sm leading-6 text-[#16645f]"><Globe2 className="mt-0.5 shrink-0" size={18} />판매 여부와 가격은 국가와 조회 시점에 따라 달라질 수 있습니다.</div>
      </aside>
    </div>
  </main>;
}

function SectionTitle({ children }: { children: React.ReactNode }) { return <h2 className="mb-6 border-b border-[var(--line)] pb-4 text-2xl font-semibold text-[var(--navy)]">{children}</h2>; }
