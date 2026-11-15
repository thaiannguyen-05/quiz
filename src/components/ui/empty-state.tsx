import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-soft">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
