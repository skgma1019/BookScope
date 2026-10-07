import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function SearchForm({ defaultValue = "", compact = false }: { defaultValue?: string; compact?: boolean }) {
  return <form action="/search" className={`mx-auto flex w-full gap-2 ${compact ? "max-w-3xl" : "max-w-2xl"}`}>
    <label className="sr-only" htmlFor="book-query">책 검색</label>
    <Input id="book-query" name="q" defaultValue={defaultValue} required maxLength={200} placeholder="제목, 저자 또는 ISBN으로 검색하세요" className={compact ? "h-12" : "h-14 pl-6"} />
    <Button type="submit" className={compact ? "size-12 shrink-0 px-0" : "h-14 shrink-0 px-7"}><Search size={19} /><span className="hidden sm:inline">검색</span></Button>
  </form>;
}

