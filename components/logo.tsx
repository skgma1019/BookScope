import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Logo() {
  return <Link href="/" className="inline-flex items-center gap-2 font-sans text-xl font-bold tracking-[-0.03em] text-[var(--navy)]"><span className="grid size-9 place-items-center rounded-xl bg-[var(--navy)] text-white"><BookOpen size={19} /></span>BookScope</Link>;
}

