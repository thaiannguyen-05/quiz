import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { isAllowedEmail, isGoogleConfigured } from "@/lib/allowlist";
import { normalizeEmail } from "@/lib/utils";

const providers: NextAuthConfig["providers"] = isGoogleConfigured()
  ? [
      Google({
        // PKCE's code verifier cookie can be dropped on serverless hosts
        // (Vercel), which surfaces as "Invalid code verifier". Rely on the
        // state check instead, which is sufficient for Google OAuth.
        checks: ["state"],
      }),
    ]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    signIn({ user, account }) {
      const email = user.email ? normalizeEmail(user.email) : "";
      if (!email || account?.provider !== "google") return false;

      return isAllowedEmail(email);
    },
    jwt({ token, user }) {
      if (user?.email) {
        token.email = normalizeEmail(user.email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
      }
      return session;
    },
  },
});
