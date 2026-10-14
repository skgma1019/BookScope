import type { ReviewSearchAdapter } from "./adapter";
import { createGeminiGroundedSearchAdapter } from "./gemini-grounded";
import { createGoogleCustomSearchAdapter } from "./google-custom-search";

export type { ReviewSearchAdapter, ReviewSource, SearchQuery, SourceType } from "./adapter";
export { GoogleCustomSearchAdapter, createGoogleCustomSearchAdapter } from "./google-custom-search";
export { GeminiGroundedSearchAdapter, createGeminiGroundedSearchAdapter } from "./gemini-grounded";

export function createReviewSearchAdapter(): ReviewSearchAdapter | null {
  return createGeminiGroundedSearchAdapter() ?? createGoogleCustomSearchAdapter();
}

export function hasReviewSearchProvider(): boolean {
  return !!(process.env.GEMINI_API_KEY || (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID));
}
