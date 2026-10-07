import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "./logo";
import { getCurrentUser } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(250,249,245,.92)] backdrop-blur-xl">
    <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8">
      <Logo />
      <nav className="flex items-center gap-1 font-sans text-sm font-semibold" aria-label="주요 메뉴">
        <Link className="rounded-full px-4 py-2 hover:bg-white" href="/search">도서 검색</Link>
        {user ? <>
          <Link className="rounded-full px-4 py-2 hover:bg-white" href="/library">내 서재</Link>
          <form action={signOut}><button className="flex items-center gap-1 rounded-full px-3 py-2 text-[var(--muted)] hover:bg-white" aria-label="로그아웃"><LogOut size={16} /><span className="hidden sm:inline">로그아웃</span></button></form>
        </> : <Link className="ml-2 rounded-full bg-[var(--navy)] px-5 py-2.5 text-white" href="/login">로그인</Link>}
      </nav>
    </div>
  </header>;
}

