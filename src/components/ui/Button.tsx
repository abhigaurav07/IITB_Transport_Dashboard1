import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-60";
const VARIANT: Record<Variant, string> = {
  primary: "bg-navy text-white shadow-card hover:bg-[#10284a] active:bg-[#0c2040]",
  secondary: "border border-line bg-surface text-ink hover:border-navy/40 hover:bg-navy-50",
  ghost: "text-ink-muted hover:bg-navy-50 hover:text-ink",
};
const SIZE: Record<Size, string> = { md: "h-10 px-4 text-sm", lg: "h-11 px-5 text-sm" };

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button {...rest} className={`${buttonClass(variant, size)} ${className}`} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}
