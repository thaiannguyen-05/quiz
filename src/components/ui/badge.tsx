import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "brand" | "mint" | "coral" | "sun" | "neutral";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-strong",
  mint: "bg-mint-soft text-mint",
  coral: "bg-coral-soft text-coral",
  sun: "bg-sun-soft text-[#a66f00]",
  neutral: "bg-[#f1eff8] text-ink-soft",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
