import "server-only";
import type { Book, BookSearchResult } from "@/types/book";

type GoogleVolume = {
  id: string;
  volumeInfo?: {
    title?: string; subtitle?: string; authors?: string[]; publisher?: string;
    publishedDate?: string; description?: string; industryIdentifiers?: { type: string; identifier: string }[];
    pageCount?: number; categories?: string[]; averageRating?: number; ratingsCount?: number;
    language?: string; imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    previewLink?: string; infoLink?: string; canonicalVolumeLink?: string;
  };
  saleInfo?: Book["saleInfo"];
};

const API = "https://www.googleapis.com/books/v1/volumes";

function normalize(volume: GoogleVolume): Book {
  const info = volume.volumeInfo ?? {};
  const identifiers = info.industryIdentifiers ?? [];
  const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  return {
    volumeId: volume.id,
    title: info.title?.trim() || "제목 정보 없음",
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    description: info.description,
    isbn10: identifiers.find((item) => item.type === "ISBN_10")?.identifier,
    isbn13: identifiers.find((item) => item.type === "ISBN_13")?.identifier,
    pageCount: info.pageCount,
    categories: info.categories ?? [],
    averageRating: info.averageRating,
    ratingsCount: info.ratingsCount,
    language: info.language,
    thumbnailUrl: thumbnail?.replace("http://", "https://"),
    previewLink: info.previewLink,
    infoLink: info.infoLink,
    canonicalVolumeLink: info.canonicalVolumeLink,
    saleInfo: volume.saleInfo,
  };
}

function apiUrl(params: Record<string, string>) {
  const url = new URL(API);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (process.env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  return url;
}

async function requestBooks(query: string, startIndex: number, maxResults: number) {
  const url = apiUrl({ q: query, startIndex: String(startIndex), maxResults: String(maxResults), country: "KR" });
  let lastResponse: Response | null = null;
  let lastData: { totalItems?: number; items?: GoogleVolume[]; error?: { message?: string } } = {};

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as typeof lastData;
    lastResponse = response;
    lastData = data;
    if (response.ok || (response.status !== 429 && response.status < 500)) return { response, data };
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
  }

  return { response: lastResponse!, data: lastData };
}

export async function searchBooks(query: string, startIndex = 0): Promise<BookSearchResult> {
  const maxResults = 20;
  let { response, data } = await requestBooks(query, startIndex, maxResults);

  // Google Books occasionally returns 503 for long Korean free-text queries,
  // while its title index returns the intended volumes. Keep general search as
  // the primary path so author and ISBN queries retain their normal behavior.
  const isIsbn = /^\d[\d-]{8,16}[\dXx]$/.test(query.replace(/\s/g, ""));
  if ((!response.ok || !data.items?.length) && !isIsbn && !query.startsWith("intitle:")) {
    ({ response, data } = await requestBooks(`intitle:${query}`, startIndex, maxResults));
  }

  if (!response.ok) throw new Error(`GOOGLE_BOOKS_SEARCH_FAILED_${response.status}`);
  const totalItems = data.totalItems ?? 0;
  const next = startIndex + maxResults;
  return { items: (data.items ?? []).map(normalize), totalItems, nextStartIndex: next < totalItems ? next : null };
}

export async function getBook(volumeId: string): Promise<Book | null> {
  const url = new URL(`${API}/${encodeURIComponent(volumeId)}`);
  if (process.env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000), next: { revalidate: 3600 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("GOOGLE_BOOKS_DETAIL_FAILED");
  return normalize((await response.json()) as GoogleVolume);
}
