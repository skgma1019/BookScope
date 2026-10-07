import Link from "next/link";
import { ArrowRight, BookMarked, SearchCheck, Sparkles } from "lucide-react";
import { SearchForm } from "@/components/search-form";

export default function HomePage() {
  return <main>
    <section className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="absolute -left-28 top-10 size-80 rounded-full bg-[#e2f2f1] blur-3xl" /><div className="absolute -right-20 bottom-0 size-96 rounded-full bg-[#dce5fb] blur-3xl" />
      <div className="relative mx-auto flex min-h-[610px] max-w-6xl flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
        <p className="mb-5 font-sans text-sm font-bold uppercase tracking-[.2em] text-[var(--teal)]">Read wider, choose better</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.18] tracking-[-.045em] text-[var(--navy)] sm:text-7xl">다음에 읽을 책을<br />더 깊이 들여다보세요.</h1>
        <p className="mb-10 mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">책·만화·라이트노벨을 검색하고 도서 정보와 구매 링크, 나만의 독서 기록을 한곳에서 관리하세요.</p>
        <SearchForm />
        <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 font-sans text-xs text-[var(--muted)]"><span>작품명</span><span>저자명</span><span>ISBN</span></div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {[{ icon: SearchCheck, title: "정확한 도서 탐색", text: "Google Books의 실제 도서 데이터를 판본과 권별로 확인합니다." }, { icon: BookMarked, title: "나만의 서재", text: "읽고 싶은 책부터 완독한 책까지 독서 상태를 기록합니다." }, { icon: Sparkles, title: "한눈에 보는 정보", text: "도서 정보와 판매 여부를 차분한 한 화면에 정리합니다." }].map(({icon: Icon, title, text}) => <div key={title} className="rounded-[22px] border border-[var(--line)] bg-white p-7"><Icon className="mb-6 text-[var(--teal)]" /><h2 className="text-xl font-semibold text-[var(--navy)]">{title}</h2><p className="mt-3 leading-7 text-[var(--muted)]">{text}</p></div>)}
      </div>
      <Link href="/search" className="mx-auto mt-12 flex w-fit items-center gap-2 font-sans font-bold text-[var(--navy)]">도서 둘러보기 <ArrowRight size={18} /></Link>
    </section>
  </main>;
}

