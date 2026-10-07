import { NextResponse } from "next/server";
import { searchBooks } from "@/lib/integrations/google-books";
import { bookSearchSchema } from "@/lib/schemas/book";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = bookSearchSchema.safeParse({ q: url.searchParams.get("q"), startIndex: url.searchParams.get("startIndex") ?? 0 });
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_QUERY", message: "검색어를 확인해주세요." } }, { status: 400 });
  try { return NextResponse.json(await searchBooks(parsed.data.q, parsed.data.startIndex)); }
  catch { return NextResponse.json({ error: { code: "BOOK_PROVIDER_ERROR", message: "도서 정보를 가져오지 못했습니다." } }, { status: 502 }); }
}

