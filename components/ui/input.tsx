import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-12 w-full rounded-full border border-[var(--line)] bg-white px-5 text-base outline-none transition placeholder:text-[#9a9690] focus:border-[var(--teal)] focus:ring-4 focus:ring-[#e2f2f1]", className)} {...props} />;
}

