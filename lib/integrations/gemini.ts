import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { ReviewSource } from "./search";

export const analysisSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  criticisms: z.array(z.string()),
  mixed_opinions: z.array(z.string()),
  themes: z.array(z.string()),
  style: z.string(),
  target_readers: z.array(z.string()),
  evidence_notes: z.string(),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

export type AnalysisInput = {
  title: string;
  authors: string[];
  description?: string | null;
  sources: ReviewSource[];
};

const SYSTEM_PROMPT = `당신은 문학 평론가입니다. 제공된 외부 서평/평론 자료만을 근거로 도서를 분석하세요.
규칙:
- 제공된 sources의 내용만 사용하세요. 사전 지식으로 내용을 채우지 마세요.
- 존재하지 않는 서평이나 출처를 만들어내지 마세요.
- 절대적인 점수나 순위는 제시하지 마세요.
- 자료가 특정 항목을 뒷받침하지 못하면 해당 배열을 비워두세요.
- 반드시 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

function buildPrompt(input: AnalysisInput): string {
  const sourceList = input.sources
    .map((s, i) => `[출처 ${i + 1}] ${s.publisher ?? "출처 불명"}\n제목: ${s.title ?? "-"}\n내용: ${s.snippet}`)
    .join("\n\n");

  return `도서 정보:
제목: ${input.title}
저자: ${input.authors.join(", ")}
${input.description ? `설명: ${input.description.slice(0, 300)}` : ""}

수집된 서평/평론 자료 (${input.sources.length}개):
${sourceList}

위 자료만을 근거로 다음 JSON 구조로 분석해주세요:
{
  "summary": "수집된 자료를 종합한 작품 개요 (2-4문장)",
  "strengths": ["자료에서 언급된 장점들"],
  "criticisms": ["자료에서 언급된 단점/비판들"],
  "mixed_opinions": ["엇갈리는 평가들"],
  "themes": ["작품의 주요 주제들"],
  "style": "문체/스타일에 대한 평가",
  "target_readers": ["추천 독자층"],
  "evidence_notes": "어떤 자료를 어떻게 활용했는지 간략 설명"
}`;
}

export async function analyzeBook(input: AnalysisInput): Promise<AnalysisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[Gemini] GEMINI_API_KEY not set");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  let raw: string;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildPrompt(input),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        // gemini-2.5 counts thinking tokens against maxOutputTokens; a 2048 cap
        // left ~80 tokens for the body and truncated the JSON mid-string.
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });
    raw = response.text ?? "";
  } catch (err) {
    console.error("[Gemini] generateContent failed", err);
    return null;
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[Gemini] no JSON in response", raw.slice(0, 200));
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("[Gemini] JSON parse failed", jsonMatch[0].slice(0, 200));
    return null;
  }

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[Gemini] schema validation failed", result.error.flatten());
    return null;
  }

  return result.data;
}
