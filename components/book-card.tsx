import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Book } from "@/types/book";
import { BookCover } from "./book-cover";
import { Card } from "./ui/card";

export function BookCard({ book }: { book: Book }) {
  return <Card className="group flex gap-5 p-4 transition hover:-translate-y-1 hover:border-[#b9cbf6] hover:shadow-[0_14px_36px_rgba(17,31,72,.09)] sm:p-5">
    <BookCover src={book.thumbnailUrl} title={book.title} className="h-40 w-27 shrink-0 sm:h-44 sm:w-30" />
    <div className="flex min-w-0 flex-1 flex-col py-1">
      <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-[.12em] text-[var(--teal)]">{book.language?.toUpperCase() || "BOOK"}</p>
      <h2 className="line-clamp-2 text-xl font-semibold leading-snug text-[var(--navy)]">{book.title}</h2>
      {book.subtitle && <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{book.subtitle}</p>}
      <p className="mt-3 line-clamp-1 text-sm">{book.authors.length ? book.authors.join(", ") : "저자 정보 없음"}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{[book.publisher, book.publishedDate].filter(Boolean).join(" · ") || "출판 정보 없음"}</p>
      <Link href={`/book/${encodeURIComponent(book.volumeId)}`} className="mt-auto inline-flex items-center gap-1 self-end pt-4 font-sans text-sm font-bold text-[var(--navy)]">상세보기 <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>
    </div>
  </Card>;
}
