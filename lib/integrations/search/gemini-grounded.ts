import "server-only";
import type { ReviewSearchAdapter, ReviewSource, SearchQuery, SourceType } from "./adapter";

type GroundingResponse = {
  error?: { message?: string };
  candidates?: {
    groundingMetadata?: {
      groundingChunks?: { web?: { uri?: string; title?: string } }[];
      groundingSupports?: { segment?: { text?: string }; groundingChunkIndices?: number[] }[];
    };
  }[];
};

const MEDIA_HINTS = ["news", "times", "guardian", "chosun", "hani", "khan", "joongang", "donga", "mk.co", "hankyung", "yna", "kbs", "mbc", "sbs", "review", "books.", "post"];

function inferSourceType(domain: string): SourceType {
  const d = domain.toLowerCase();
  if (d.includes("yes24") || d.includes("kyobo") || d.includes("aladin") || d.includes("goodreads") || d.includes("blog") || d.includes("youtube")) return "reader_review";
  if (MEDIA_HINTS.some((h) => d.includes(h))) return "media_review";
  return "unknown";
}

export class GeminiGroundedSearchAdapter implements ReviewSearchAdapter {
  readonly name = "gemini-grounded-search";

  constructor(private readonly apiKey: string) {}

  async search(query: SearchQuery): Promise<ReviewSource[]> {
    const author = query.authors[0] ? ` (${query.authors[0]})` : "";
    const prompt = `도서 "${query.title}"${author}에 대한 외부 서평, 언론 리뷰, 독자 리뷰를 웹에서 검색해 각 출처가 어떤 평가를 했는지 정리해줘. 검색 결과에서 확인되지 않는 내용은 쓰지 마.`;

    let data: GroundingResponse;
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }),
          signal: AbortSignal.timeout(30000),
          cache: "no-store",
        },
      );
      data = (await res.json()) as GroundingResponse;
      if (!res.ok) {
        console.warn("[GeminiGrounded] API error", res.status, data.error?.message);
        return [];
      }
    } catch (err) {
      console.warn("[GeminiGrounded] fetch failed", err);
      return [];
    }

    const meta = data.candidates?.[0]?.groundingMetadata;
    const chunks = meta?.groundingChunks ?? [];
    const supports = meta?.groundingSupports ?? [];

    const sources: ReviewSource[] = [];
    chunks.forEach((chunk, i) => {
      const uri = chunk.web?.uri;
      if (!uri) return;
      const snippet = [...new Set(supports.filter((s) => s.groundingChunkIndices?.includes(i)).map((s) => s.segment?.text?.trim()).filter((t): t is string => !!t))]
        .join(" ")
        .slice(0, 600);
      if (snippet.length <= 30) return;
      const domain = chunk.web?.title ?? null;
      sources.push({ url: uri, title: domain, publisher: domain, sourceType: inferSourceType(domain ?? ""), snippet });
    });
    return sources;
  }
}

export function createGeminiGroundedSearchAdapter(): GeminiGroundedSearchAdapter | null {
  const key = process.env.GEMINI_API_KEY;
  return key ? new GeminiGroundedSearchAdapter(key) : null;
}
