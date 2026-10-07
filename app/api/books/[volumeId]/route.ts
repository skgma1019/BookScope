import { NextResponse } from "next/server";
import { getBook } from "@/lib/integrations/google-books";
import { volumeIdSchema } from "@/lib/schemas/book";

export async function GET(_request: Request, { params }: { params: Promise<{ volumeId: string }> }) {
  const parsed = volumeIdSchema.safeParse((await params).volumeId);
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_VOLUME_ID", message: "도서 ID를 확인해주세요." } }, { status: 400 });
  try { const book = await getBook(parsed.data); return book ? NextResponse.json(book) : NextResponse.json({ error: { code: "NOT_FOUND", message: "도서를 찾지 못했습니다." } }, { status: 404 }); }
  catch { return NextResponse.json({ error: { code: "BOOK_PROVIDER_ERROR", message: "도서 정보를 가져오지 못했습니다." } }, { status: 502 }); }
}

