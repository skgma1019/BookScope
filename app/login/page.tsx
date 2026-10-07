import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { signInWithGoogle } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  return <main className="grid min-h-[calc(100vh-72px)] place-items-center px-5 py-16">
    <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-white p-8 text-center shadow-[0_20px_60px_rgba(17,31,72,.08)] sm:p-12">
      <span className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-[var(--navy)] text-white"><BookOpen /></span>
      <h1 className="text-4xl font-semibold tracking-[-.04em] text-[var(--navy)]">BookScope</h1>
      <p className="mb-9 mt-4 leading-7 text-[var(--muted)]">책을 여러 관점에서 확인하고<br />나만의 독서 기록을 남겨보세요.</p>
      {error && <p className="mb-4 rounded-xl bg-[#fce9e7] p-3 font-sans text-sm text-[#a3271b]">{error === "config" ? "Supabase 환경변수 설정이 필요합니다." : "로그인을 완료하지 못했습니다. 다시 시도해주세요."}</p>}
      <form action={signInWithGoogle}><button className="flex h-13 w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-white font-sans font-semibold shadow-sm transition hover:border-[#a39e98] hover:bg-[#fbfaf9]"><GoogleMark />Google로 계속하기</button></form>
      <p className="mt-7 font-sans text-xs leading-5 text-[var(--muted)]">로그인하면 내 서재와 평가를 기기 간에 안전하게 동기화할 수 있습니다.</p>
    </div>
  </main>;
}

function GoogleMark() { return <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.8 2.7-6.5Z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.3 0-4.3-1.6-5-3.7H1v2.3A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M4 10.8a5.4 5.4 0 0 1 0-3.5V5H1a9 9 0 0 0 0 8.1l3-2.3Z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.5 1.4L15 2.5A8.4 8.4 0 0 0 9 0a9 9 0 0 0-8 5l3 2.3c.7-2.1 2.7-3.7 5-3.7Z"/></svg>; }
