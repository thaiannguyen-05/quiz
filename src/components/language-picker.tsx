"use client";

import { Globe } from "lucide-react";

import { useI18n } from "@/components/i18n-provider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
      <Globe className="size-4.5 shrink-0" strokeWidth={2.2} />
      {!compact ? <span className="flex-1 text-left">{t("nav.language")}</span> : null}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded-xl border border-line-strong bg-white px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label={t("nav.language")}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
