"use client";

import { useActionState } from "react";
import { Sparkles, BookOpen, ThumbsUp, ThumbsDown, GitMerge, Tags, Pen, Users, FileText, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { requestAnalysis, type AnalysisActionResult } from "@/app/actions/analysis";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

type AnalysisData = {
  id: string;
  summary: string | null;
  strengths: string[] | null;
  criticisms: string[] | null;
  mixed_opinions: string[] | null;
  themes: string[] | null;
  style: string | null;
  target_readers: string[] | null;
  evidence_notes: string | null;
  source_count: number;
  updated_at: string;
};

type Source = {
  url: string | null;
  title: string | null;
  publisher: string | null;
  source_type: string;
  snippet: string;
};

type Props = {
  volumeId: string;
  analysis: AnalysisData | null;
  sources: Source[];
  hasSearchProvider: boolean;
  hasGeminiKey: boolean;
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--navy)]">
        <span className="text-[var(--teal)]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted)]">해당 없음</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <li key={i} className="rounded-full bg-[var(--paper)] px-3 py-1 text-sm text-[var(--navy)]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted)]">해당 없음</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function AnalysisDisplay({ analysis, sources }: { analysis: AnalysisData; sources: Source[] }) {
  const updated = new Date(analysis.updated_at).toLocaleDateString("ko-KR");
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{analysis.source_count}개 외부 자료 기반 · Gemini 분석</span>
        <span>갱신 {updated}</span>
      </div>

      {analysis.summary && (
        <Section icon={<BookOpen size={16} />} title="종합 요약">
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </Section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Section icon={<ThumbsUp size={16} />} title="장점">
          <BulletList items={analysis.strengths ?? []} />
        </Section>
        <Section icon={<ThumbsDown size={16} />} title="비판 / 단점">
          <BulletList items={analysis.criticisms ?? []} />
        </Section>
      </div>

      {(analysis.mixed_opinions?.length ?? 0) > 0 && (
        <Section icon={<GitMerge size={16} />} title="엇갈리는 의견">
          <BulletList items={analysis.mixed_opinions!} />
        </Section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Section icon={<Tags size={16} />} title="주제">
          <TagList items={analysis.themes ?? []} />
        </Section>
        <Section icon={<Users size={16} />} title="추천 독자">
          <TagList items={analysis.target_readers ?? []} />
        </Section>
      </div>

      {analysis.style && (
        <Section icon={<Pen size={16} />} title="문체 / 스타일">
          <p className="text-sm leading-relaxed">{analysis.style}</p>
        </Section>
      )}

      {analysis.evidence_notes && (
        <Section icon={<FileText size={16} />} title="분석 근거">
          <p className="text-sm leading-relaxed text-[var(--muted)]">{analysis.evidence_notes}</p>
        </Section>
      )}

      {sources.length > 0 && (
        <Section icon={<ExternalLink size={16} />} title="참고 자료">
          <ul className="space-y-2">
            {sources.map((s, i) => (
              <li key={i} className="text-sm">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--navy)] hover:underline">
                    {s.title ?? s.publisher ?? s.url}
                  </a>
                ) : (
                  <span className="font-medium text-[var(--navy)]">{s.title ?? s.publisher ?? "출처 불명"}</span>
                )}
                {s.publisher && s.title !== s.publisher && (
                  <span className="ml-2 text-[var(--muted)]">{s.publisher}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function AnalysisTrigger({ volumeId, hasSearchProvider, hasGeminiKey }: { volumeId: string; hasSearchProvider: boolean; hasGeminiKey: boolean }) {
  const [result, action, isPending] = useActionState(
    async (_prev: AnalysisActionResult | null, formData: FormData) => requestAnalysis(formData),
    null
  );

  if (!hasGeminiKey) {
    return (
      <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-semibold">Gemini API 키가 설정되지 않았습니다.</p>
        <p className="mt-1 text-amber-700">환경 변수 <code className="rounded bg-amber-100 px-1">GEMINI_API_KEY</code>를 설정하면 AI 분석 기능을 사용할 수 있습니다.</p>
      </div>
    );
  }

  if (!hasSearchProvider) {
    return (
      <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-semibold">외부 검색 제공자가 설정되지 않았습니다.</p>
        <p className="mt-1 text-amber-700">
          <code className="rounded bg-amber-100 px-1">GEMINI_API_KEY</code>를 설정하면 외부 서평 기반 AI 분석이 가능합니다.
        </p>
      </div>
    );
  }

  if (result?.status === "insufficient_sources") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-[var(--paper)] p-5 text-sm">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-[var(--muted)]" />
        <div>
          <p className="font-semibold text-[var(--navy)]">자료 부족</p>
          <p className="mt-1 text-[var(--muted)]">신뢰할 수 있는 외부 서평 자료가 충분하지 않아 분석을 생성하지 못했습니다.</p>
        </div>
      </div>
    );
  }

  if (result?.status === "failed") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-5 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="font-semibold text-red-700">분석 실패</p>
            <p className="mt-1 text-red-600">{result.message}</p>
          </div>
        </div>
        <form action={action}>
          <input type="hidden" name="volumeId" value={volumeId} />
          <Button type="submit" variant="ghost" disabled={isPending} className="gap-2">
            다시 시도
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">외부 서평과 평론을 수집해 Gemini가 종합 분석을 제공합니다. 분석은 실제 외부 자료에만 근거합니다.</p>
      <form action={action}>
        <input type="hidden" name="volumeId" value={volumeId} />
        <Button type="submit" variant="accent" disabled={isPending} className="gap-2">
          {isPending ? <><Loader2 size={16} className="animate-spin" />분석 중…</> : <><Sparkles size={16} />AI 분석 시작</>}
        </Button>
      </form>
    </div>
  );
}

export function AiAnalysis({ volumeId, analysis, sources, hasSearchProvider, hasGeminiKey }: Props) {
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 border-b border-[var(--line)] pb-4 text-2xl font-semibold text-[var(--navy)]">
        <Sparkles size={22} className="text-[var(--teal)]" />
        AI 분석
      </h2>

      {analysis ? (
        <AnalysisDisplay analysis={analysis} sources={sources} />
      ) : (
        <AnalysisTrigger volumeId={volumeId} hasSearchProvider={hasSearchProvider} hasGeminiKey={hasGeminiKey} />
      )}
    </Card>
  );
}
