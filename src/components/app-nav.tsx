"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

export function AppNav() {
  const pathname = usePathname();
  const t = useT();
  const active = pathname === "/libraries" || pathname.startsWith("/libraries/");

  return (
    <nav className="space-y-1">
      <Link
        href="/libraries"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
          active
            ? "bg-brand-soft text-brand-strong"
            : "text-ink-soft hover:bg-white hover:text-ink",
        )}
      >
        <BookOpen className="size-4.5" strokeWidth={2.2} />
        {t("nav.libraries")}
        {active ? (
          <span className="ml-auto size-1.5 rounded-full bg-brand" />
        ) : null}
      </Link>
    </nav>
  );
}
