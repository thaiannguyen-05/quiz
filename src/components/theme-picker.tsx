"use client";

import { useEffect, useState } from "react";
import { Palette, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  DEFAULT_THEME,
  isHexColor,
  loadTheme,
  normalizeHex,
  saveTheme,
  type ThemeConfig,
  type ThemeMode,
} from "@/lib/theme";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const safeValue = isHexColor(value) ? normalizeHex(value) : "#D291BC";
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-ink-soft">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-11 shrink-0 cursor-pointer rounded-xl border border-line-strong bg-white p-1"
          aria-label={`${label} color picker`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="font-mono text-xs"
        />
        <span
          className="size-11 shrink-0 rounded-xl border border-line-strong"
          style={{ backgroundColor: isHexColor(value) ? normalizeHex(value) : safeValue }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME);

  useEffect(() => {
    setConfig(loadTheme());
  }, []);

  const isCustom = config.mode === "custom";

  function commit(next: ThemeConfig) {
    setConfig(next);
    saveTheme(next);
    applyTheme(next);
  }

  function setMode(mode: ThemeMode) {
    if (mode === "default") {
      commit({ ...DEFAULT_THEME });
      return;
    }
    const base = config.mode === "custom" ? config : DEFAULT_THEME;
    commit({
      mode: "custom",
      brand: base.brand,
      brandStrong: base.brandStrong,
      canvas: base.canvas,
    });
  }

  function updateColor(key: "brand" | "brandStrong" | "canvas", raw: string) {
    const next: ThemeConfig = {
      mode: "custom",
      brand: config.mode === "custom" ? config.brand : DEFAULT_THEME.brand,
      brandStrong:
        config.mode === "custom" ? config.brandStrong : DEFAULT_THEME.brandStrong,
      canvas: config.mode === "custom" ? config.canvas : DEFAULT_THEME.canvas,
    };
    next[key] = raw;
    setConfig(next);
    if (isHexColor(next.brand) && isHexColor(next.brandStrong) && isHexColor(next.canvas)) {
      const normalized: ThemeConfig = {
        mode: "custom",
        brand: normalizeHex(next.brand),
        brandStrong: normalizeHex(next.brandStrong),
        canvas: normalizeHex(next.canvas),
      };
      setConfig(normalized);
      saveTheme(normalized);
      applyTheme(normalized);
    }
  }

  function reset() {
    commit({ ...DEFAULT_THEME });
  }

  const colors = isCustom
    ? { brand: config.brand, brandStrong: config.brandStrong, canvas: config.canvas }
    : { brand: DEFAULT_THEME.brand, brandStrong: DEFAULT_THEME.brandStrong, canvas: DEFAULT_THEME.canvas };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
      >
        <Palette className="size-4.5" strokeWidth={2.2} />
        <span className="flex-1 text-left">Theme</span>
        <span className="flex items-center gap-1">
          <span
            className="size-3 rounded-full border border-line-strong"
            style={{ backgroundColor: colors.brand }}
            aria-hidden="true"
          />
          <span
            className="size-3 rounded-full border border-line-strong"
            style={{ backgroundColor: colors.canvas }}
            aria-hidden="true"
          />
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Theme"
        description="Choose the default theme or customize the brand colors."
        size="sm"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("default")}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                !isCustom
                  ? "border-brand bg-brand-soft/60"
                  : "border-line hover:border-brand/40 hover:bg-brand-soft/20",
              )}
            >
              <p className="text-sm font-extrabold text-ink">Default</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                D291BC / D291BC / FFDFD3
              </p>
              <div className="mt-2 flex gap-1.5">
                {[DEFAULT_THEME.brand, DEFAULT_THEME.brandStrong, DEFAULT_THEME.canvas].map(
                  (c, i) => (
                    <span
                      key={i}
                      className="size-4 rounded-full border border-line-strong"
                      style={{ backgroundColor: c }}
                      aria-hidden="true"
                    />
                  ),
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("custom")}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                isCustom
                  ? "border-brand bg-brand-soft/60"
                  : "border-line hover:border-brand/40 hover:bg-brand-soft/20",
              )}
            >
              <p className="text-sm font-extrabold text-ink">Custom</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                Enter your own hex colors
              </p>
              <div className="mt-2 flex gap-1.5">
                {[colors.brand, colors.brandStrong, colors.canvas].map((c, i) => (
                  <span
                    key={i}
                    className="size-4 rounded-full border border-line-strong"
                    style={{ backgroundColor: isHexColor(c) ? normalizeHex(c) : "#D291BC" }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </button>
          </div>

          {isCustom ? (
            <div className="space-y-4">
              <ColorField
                label="Brand"
                value={config.brand}
                onChange={(v) => updateColor("brand", v)}
              />
              <ColorField
                label="Brand-strong"
                value={config.brandStrong}
                onChange={(v) => updateColor("brandStrong", v)}
              />
              <ColorField
                label="Canvas (background)"
                value={config.canvas}
                onChange={(v) => updateColor("canvas", v)}
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-line pt-4">
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-4" />
              Reset to default
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}