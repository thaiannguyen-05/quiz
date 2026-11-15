import { normalizeEmail } from "@/lib/utils";

/**
 * The allowlist is mandatory in production. During local development an empty
 * allowlist accepts every email so testing stays easy.
 */
export function isAllowedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const raw = process.env.ALLOWED_EMAILS?.trim();

  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[auth] ALLOWED_EMAILS is empty in production; allowing all Google accounts.",
      );
    }
    return true;
  }

  const allowed = raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);

  return allowed.includes(normalized);
}

export function isGoogleConfigured() {
  return Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() &&
      process.env.AUTH_GOOGLE_SECRET?.trim(),
  );
}
