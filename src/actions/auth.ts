"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { isGoogleConfigured } from "@/lib/allowlist";

function errorRedirect(error: unknown) {
  if (error instanceof AuthError) {
    redirect(`/login?error=${encodeURIComponent(error.type ?? "Unknown")}`);
  }
  throw error;
}

export async function signInWithGoogle() {
  if (!isGoogleConfigured()) {
    redirect("/login?error=Configuration");
  }

  try {
    await signIn("google", { redirectTo: "/libraries" });
  } catch (error) {
    errorRedirect(error);
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
