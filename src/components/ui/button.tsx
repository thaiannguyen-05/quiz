import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerGhost"
  | "soft";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_10px_24px_-12px_rgba(91,75,245,0.9)] hover:bg-brand-strong",
  secondary:
    "border border-line-strong bg-white text-ink hover:border-[#c9c2e3] hover:bg-[#fbfaff]",
  ghost: "text-ink-soft hover:bg-white hover:text-ink",
  danger: "bg-coral text-white hover:bg-[#dc485d]",
  dangerGhost: "text-coral hover:bg-coral-soft",
  soft: "bg-brand-soft text-brand-strong hover:bg-[#e4dfff]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 rounded-xl px-3 text-xs",
  md: "h-11 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-2xl px-6 text-base",
  icon: "size-9 rounded-xl",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
