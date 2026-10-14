import "server-only";

export type SourceType = "professional_review" | "media_review" | "publisher_description" | "reader_review" | "unknown";

export type ReviewSource = {
  url: string | null;
  title: string | null;
  publisher: string | null;
  sourceType: SourceType;
  snippet: string;
};

export type SearchQuery = {
  title: string;
  authors: string[];
  isbn13?: string | null;
  isbn10?: string | null;
};

export interface ReviewSearchAdapter {
  readonly name: string;
  search(query: SearchQuery): Promise<ReviewSource[]>;
}
