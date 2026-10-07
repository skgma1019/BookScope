import { z } from "zod";

export const bookSearchSchema = z.object({
  q: z.string().trim().min(1, "검색어를 입력해주세요.").max(200),
  startIndex: z.coerce.number().int().min(0).max(1000).default(0),
});

export const volumeIdSchema = z.string().trim().min(1).max(200);

