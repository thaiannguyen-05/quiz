export type ThemeMode = "default" | "custom";

export type ThemeConfig = {
  mode: ThemeMode;
  brand: string;
  brandStrong: string;
  canvas: string;
};

export const DEFAULT_THEME: ThemeConfig = {
  mode: "default",
  brand: "#D291BC",
  brandStrong: "#D291BC",
  canvas: "#FFDFD3",
};

export const THEME_STORAGE_KEY = "quizdeck-theme";

export function isHexColor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value.trim())
  );
}

export function normalizeHex(value: string): string {
  let v = value.trim();
  if (!v.startsWith("#")) v = "#" + v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v = "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  }
  return v.toUpperCase();
}

export function loadTheme(): ThemeConfig {
  if (typeof window === "undefined") return { ...DEFAULT_THEME };
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME };
    const parsed = JSON.parse(raw) as Partial<ThemeConfig> | null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_THEME };
    const mode: ThemeMode = parsed.mode === "custom" ? "custom" : "default";
    if (mode === "default") return { ...DEFAULT_THEME };
    const brand = isHexColor(parsed.brand)
      ? normalizeHex(parsed.brand)
      : DEFAULT_THEME.brand;
    const brandStrong = isHexColor(parsed.brandStrong)
      ? normalizeHex(parsed.brandStrong)
      : DEFAULT_THEME.brandStrong;
    const canvas = isHexColor(parsed.canvas)
      ? normalizeHex(parsed.canvas)
      : DEFAULT_THEME.canvas;
    return { mode: "custom", brand, brandStrong, canvas };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export function saveTheme(config: ThemeConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
}

export function applyTheme(config: ThemeConfig): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const c = config.mode === "default" ? DEFAULT_THEME : config;
  root.style.setProperty("--color-brand", c.brand);
  root.style.setProperty("--color-brand-strong", c.brandStrong);
  root.style.setProperty("--color-canvas", c.canvas);
}

export function themeColors(config: ThemeConfig): {
  brand: string;
  brandStrong: string;
  canvas: string;
} {
  const c = config.mode === "default" ? DEFAULT_THEME : config;
  return { brand: c.brand, brandStrong: c.brandStrong, canvas: c.canvas };
}