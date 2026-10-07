import Image from "next/image";
import { BookOpen } from "lucide-react";

export function BookCover({ src, title, priority = false, className = "" }: { src?: string; title: string; priority?: boolean; className?: string }) {
  return <div className={`relative overflow-hidden rounded-md bg-[#e8e6e3] shadow-[0_8px_18px_rgba(17,31,72,.12)] ${className}`}>
    {src ? <Image src={src} alt={`${title} 표지`} fill priority={priority} sizes="(max-width: 640px) 110px, 180px" className="object-cover" /> : <div className="grid h-full place-items-center text-[#85807a]"><BookOpen size={36} /><span className="sr-only">표지 없음</span></div>}
  </div>;
}

