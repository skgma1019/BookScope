import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  { variants: { variant: {
    primary: "bg-[var(--navy)] text-white shadow-sm hover:bg-[#172f73]",
    accent: "bg-[var(--teal)] text-white shadow-sm hover:bg-[#16645f]",
    outline: "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--navy)]",
    ghost: "text-[var(--muted)] hover:bg-[var(--paper-deep)] hover:text-[var(--ink)]",
    danger: "bg-[#fce9e7] text-[#a3271b] hover:bg-[#f7d7d3]",
  }, defaultVariants: { variant: "primary" } } },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;
export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
export { buttonVariants };

