"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Layers, LogOut, Sparkles } from "lucide-react";

import { AppNav } from "@/components/app-nav";
import { LanguagePicker } from "@/components/language-picker";
import { LateNightReminder } from "@/components/late-night-reminder";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemePicker } from "@/components/theme-picker";
import { initials } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

const STORAGE_KEY = "sidebar-collapsed";

export function AppShell({
  displayName,
  email,
  children,
}: {
  displayName: string;
  email: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, mounted]);

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside
        suppressHydrationWarning
        className={`fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/80 bg-white/65 px-4 py-6 backdrop-blur-xl transition-transform duration-200 lg:flex ${
          collapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="grid size-8 place-items-center rounded-xl text-ink-faint transition hover:bg-white hover:text-ink"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        <div className="mt-8 px-2">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-faint">
            {t("nav.workspace")}
          </p>
        </div>
        <div className="mt-2">
          <AppNav />
        </div>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-brand/10 bg-gradient-to-br from-brand-soft to-[#f7f4ff] p-4">
            <span className="grid size-8 place-items-center rounded-xl bg-white text-brand shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <p className="mt-2.5 text-xs font-bold leading-snug text-ink">
              {t("layout.readyTitle")}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              {t("layout.readyBody")}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white/80 p-2.5">
            <ThemePicker />
            <div className="mt-2 border-t border-line pt-2">
              <LanguagePicker />
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/80 p-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-extrabold text-brand-strong">
              {initials(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-ink-faint">
                {email}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Expand button when collapsed */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="fixed left-3 top-5 z-40 hidden grid size-9 place-items-center rounded-xl border border-line bg-white/90 text-ink-soft shadow-sm backdrop-blur-xl transition hover:text-ink lg:grid"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}

      <header className="sticky top-0 z-30 border-b border-white/80 bg-canvas/80 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1">
            <Link
              href="/libraries"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
            >
              {t("nav.libraries")}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <LateNightReminder />

      <main
        suppressHydrationWarning
        className={`transition-[padding] duration-200 ${
          collapsed ? "lg:pl-0" : "lg:pl-[264px]"
        }`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
