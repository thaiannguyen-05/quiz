import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AppNav } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/auth-helpers";
import { initials } from "@/lib/utils";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const displayName = user.name?.trim() || user.email;

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/80 bg-white/65 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>

        <div className="mt-8 px-2">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-faint">
            Workspace
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
              Ready for a quick round?
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              Open a subject and hit Play. Right answers flow on their own.
            </p>
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
                {user.email}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/80 bg-canvas/80 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1">
            <Link
              href="/libraries"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
            >
              Libraries
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="lg:pl-[264px]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
