import Link from "next/link";
import { Layers } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  href = "/libraries",
  className,
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2",
        className,
      )}
      aria-label="QuizDeck home"
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#7c6cff] to-brand-strong shadow-[0_10px_20px_-8px_rgba(70,54,216,0.7)]">
        <Layers className="size-5 text-white" strokeWidth={2.4} />
      </span>
      {showWordmark ? (
        <span className="text-lg font-extrabold tracking-[-0.03em]">
          QuizDeck
        </span>
      ) : null}
    </Link>
  );
}
