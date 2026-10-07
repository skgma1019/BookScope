export type SaleInfo = {
  saleability?: string;
  isEbook?: boolean;
  listPrice?: { amount: number; currencyCode: string };
  retailPrice?: { amount: number; currencyCode: string };
  buyLink?: string;
};

export type Book = {
  volumeId: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  isbn10?: string;
  isbn13?: string;
  pageCount?: number;
  categories: string[];
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
  thumbnailUrl?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
  saleInfo?: SaleInfo;
};

export type BookSearchResult = {
  items: Book[];
  totalItems: number;
  nextStartIndex: number | null;
};

export type ReadingStatus = "want_to_read" | "reading" | "completed";

