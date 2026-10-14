import type { ReviewSearchAdapter } from "./adapter";
import { createGeminiGroundedSearchAdapter } from "./gemini-grounded";

export type { ReviewSearchAdapter, ReviewSource, SearchQuery, SourceType } from "./adapter";
export { GeminiGroundedSearchAdapter, createGeminiGroundedSearchAdapter } from "./gemini-grounded";

export function createReviewSearchAdapter(): ReviewSearchAdapter | null {
  return createGeminiGroundedSearchAdapter();
}

export function hasReviewSearchProvider(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
