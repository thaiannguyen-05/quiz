import type { Metadata } from "next";
import { Toaster } from "sonner";

import { auth } from "@/auth";
import { QueryProvider } from "@/lib/query/provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "QuizDeck — Your quiz library",
    template: "%s · QuizDeck",
  },
  description:
    "Import multiple-choice quizzes from CSV, organise them into subjects, and practise one question at a time.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <QueryProvider key={session?.user?.email ?? "guest"}>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ duration: 3500 }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
