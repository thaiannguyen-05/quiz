"use client";

import { useEffect, useState } from "react";

const BASE_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export function VersionCheck() {
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    if (BASE_BUILD_ID === "dev") return;

    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (!cancelled && data.buildId && data.buildId !== BASE_BUILD_ID) {
          setOutdated(true);
        }
      } catch {
        /* ignore */
      }
    }

    const interval = window.setInterval(check, 60_000);
    // initial check after 10s
    const timeout = window.setTimeout(check, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  if (!outdated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] max-w-sm rounded-2xl border border-brand/20 bg-white p-4 shadow-[0_24px_80px_-24px_rgba(29,26,51,0.45)]">
      <img
        src="/update-notification.png"
        alt="Cập nhật"
        className="mb-3 w-full rounded-xl object-cover"
      />
      <p className="text-sm font-bold text-ink">Có bản cập nhật mới</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Ứng dụng vừa được cập nhật. Tải lại để dùng phiên bản mới nhất.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-brand px-3 text-xs font-semibold text-white transition hover:bg-brand-strong"
      >
        Tải lại
      </button>
    </div>
  );
}
