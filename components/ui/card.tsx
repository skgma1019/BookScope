import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[22px] border border-[var(--line)] bg-white shadow-[0_8px_30px_rgba(17,31,72,0.05)]", className)} {...props} />;
}

