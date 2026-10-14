import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: { default: "BookScope", template: "%s | BookScope" },
  description: "책과 만화를 검색하고, 구매 정보와 나만의 독서 기록을 한곳에서 확인하세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" data-scroll-behavior="smooth"><body><SiteHeader />{children}<footer className="mt-20 border-t border-[var(--line)] py-10"><div className="mx-auto max-w-6xl px-5 text-sm text-[var(--muted)] sm:px-8">© BookScope · 책을 여러 관점에서 바라봅니다.</div></footer></body></html>;
}
