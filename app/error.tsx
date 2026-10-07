"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="grid min-h-[60vh] place-items-center px-5 text-center"><div><p className="font-sans text-sm font-bold uppercase tracking-[.15em] text-[#a3271b]">Something went wrong</p><h1 className="mt-4 text-3xl font-semibold text-[var(--navy)]">페이지를 불러오지 못했습니다</h1><p className="mt-3 text-[var(--muted)]">잠시 후 다시 시도해주세요.</p><Button className="mt-7" onClick={reset}>다시 시도</Button></div></main>; }

