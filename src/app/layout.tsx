import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "QuizDeck — Your quiz library",
    template: "%s · QuizDeck",
  },
  description:
    "Import multiple-choice quizzes from CSV, organise them into subjects, and practise one question at a time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ duration: 3500 }}
        />
      </body>
    </html>
  );
}
