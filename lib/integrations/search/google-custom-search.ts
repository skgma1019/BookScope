import "server-only";
import type { ReviewSearchAdapter, ReviewSource, SearchQuery, SourceType } from "./adapter";

type CseItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
};

type CseResponse = {
  items?: CseItem[];
  error?: { message?: string; code?: number };
};

const REVIEW_SITES = [
  "site:yes24.com",
  "site:kyobobook.co.kr",
  "site:aladin.co.kr",
  "site:ridibooks.com",
  "site:booktalk.com.br",
  "site:naver.com",
].join(" OR ");

function inferSourceType(displayLink: string | undefined): SourceType {
  if (!displayLink) return "unknown";
  if (displayLink.includes("yes24") || displayLink.includes("kyobo") || displayLink.includes("aladin")) {
    return "reader_review";
  }
  if (displayLink.includes("naver") || displayLink.includes("media")) return "media_review";
  return "unknown";
}

export class GoogleCustomSearchAdapter implements ReviewSearchAdapter {
  readonly name = "google-custom-search";

  private readonly apiKey: string;
  private readonly cx: string;

  constructor(apiKey: string, cx: string) {
    this.apiKey = apiKey;
    this.cx = cx;
  }

  async search(query: SearchQuery): Promise<ReviewSource[]> {
    const q = [query.title, ...query.authors.slice(0, 1), "서평 리뷰"].join(" ");
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("cx", this.cx);
    url.searchParams.set("q", `${q} (${REVIEW_SITES})`);
    url.searchParams.set("num", "10");
    url.searchParams.set("lr", "lang_ko");

    let data: CseResponse;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
      data = (await res.json()) as CseResponse;
      if (!res.ok) {
        console.warn("[GoogleCustomSearch] API error", data.error?.code, data.error?.message);
        return [];
      }
    } catch (err) {
      console.warn("[GoogleCustomSearch] fetch failed", err);
      return [];
    }

    return (data.items ?? [])
      .filter((item) => item.snippet && item.snippet.trim().length > 30)
      .map((item): ReviewSource => ({
        url: item.link ?? null,
        title: item.title ?? null,
        publisher: item.displayLink ?? null,
        sourceType: inferSourceType(item.displayLink),
        snippet: item.snippet!.trim(),
      }));
  }
}

export function createGoogleCustomSearchAdapter(): GoogleCustomSearchAdapter | null {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) return null;
  return new GoogleCustomSearchAdapter(apiKey, cx);
}
