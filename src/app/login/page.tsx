import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, Sparkles } from "lucide-react";

import { signInWithGoogle } from "@/actions/auth";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { isGoogleConfigured } from "@/lib/allowlist";

export const metadata: Metadata = { title: "Sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That Google account is not on the allowlist. Ask the owner to add your email to ALLOWED_EMAILS.",
  Configuration:
    "Sign-in is not configured yet. Add your Google OAuth credentials.",
  CredentialsSignin: "That email is not allowed to sign in.",
  OAuthAccountNotLinked:
    "This email is already associated with another sign-in method.",
  OAuthCallbackError:
    "Google could not complete the sign-in. Check the OAuth redirect URI and try again.",
  Unknown: "Sign-in failed. Please try again.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.7-.06-1.36-.18-2H12v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.31Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.89a6 6 0 0 1 0-3.78V7.52H3.06a10 10 0 0 0 0 8.96l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.05c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.34 2.59C7.2 7.81 9.4 6.05 12 6.05Z"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/libraries");

  const params = await searchParams;
  const rawError = Array.isArray(params.error)
    ? params.error[0]
    : params.error;
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.Unknown)
    : null;

  const googleEnabled = isGoogleConfigured();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 top-[-10%] size-[28rem] rounded-full bg-[#d9d2ff]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-12%] size-[24rem] rounded-full bg-[#c9f2e5]/80 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_30px_100px_-40px_rgba(29,26,51,0.45)] backdrop-blur-xl md:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#3b2bc4] via-[#5b4bf5] to-[#7d6cff] p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-[#36d6ae]/20 blur-3xl" />

          <Logo href="/login" className="relative [&_span:last-child]:text-white" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white/90">
              <Sparkles className="size-3.5" />
              Your personal quiz library
            </span>
            <h1 className="mt-5 max-w-sm text-4xl font-extrabold leading-[1.08] tracking-[-0.04em]">
              Turn a CSV into a practice session in seconds.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              Import your question sets, organise them by subject, then drill
              them one card at a time — right answers flow, wrong answers wait
              for you.
            </p>

            <ul className="mt-7 space-y-3 text-sm text-white/85">
              {[
                "Blooket-friendly CSV import with a live preview",
                "Subjects, questions, and answer keys you can edit",
                "Focused practice with timers and instant feedback",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Question 07
            </p>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed">
              Which object represents the whole Matplotlib figure?
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-strong">
                Figure
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 line-through">
                Axes
              </span>
              <span className="ml-auto text-xs font-bold text-[#8bf0d5]">
                +1 correct
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-6 sm:p-10">
          <div className="md:hidden">
            <Logo href="/login" />
          </div>

          <div className="mt-8 md:mt-0">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Sign in to open your quiz library.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-coral/20 bg-coral-soft px-4 py-3 text-sm font-medium leading-relaxed text-[#8b2b3a]"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6">
            {googleEnabled ? (
              <form action={signInWithGoogle}>
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-line-strong bg-[#fbfaff] px-4 py-3 text-xs leading-relaxed text-ink-soft">
                <span className="font-bold text-ink">
                  Google sign-in is not configured.
                </span>{" "}
                Add <code className="font-mono">AUTH_GOOGLE_ID</code> and{" "}
                <code className="font-mono">AUTH_GOOGLE_SECRET</code> to{" "}
                <code className="font-mono">.env.local</code> to enable it.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
