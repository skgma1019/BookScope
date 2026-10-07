import { z } from "zod";

export const readingStatusSchema = z.enum(["want_to_read", "reading", "completed"]);

export const libraryInputSchema = z.object({
  volumeId: z.string().min(1).max(200),
  status: readingStatusSchema,
});

export const reviewInputSchema = z.object({
  volumeId: z.string().min(1).max(200),
  rating: z.preprocess((value) => value === null || value === "" ? undefined : value, z.coerce.number().int().min(1).max(5).optional()),
  reviewText: z.string().trim().max(2000).optional().default(""),
}).refine((value) => value.rating != null || value.reviewText.length > 0, { message: "별점 또는 리뷰를 입력해주세요." });
