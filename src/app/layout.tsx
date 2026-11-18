import type { Metadata } from "next";
import { Toaster } from "sonner";

import { auth } from "@/auth";
import { QueryProvider } from "@/lib/query/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getServerLocale } from "@/lib/i18n/server";

import "./globals.css";

const themeInitScript = `(function(){try{var raw=localStorage.getItem('quizdeck-theme');var root=document.documentElement;if(!raw){return;}var t=JSON.parse(raw);if(t&&t.mode==='custom'){if(typeof t.brand==='string')root.style.setProperty('--color-brand',t.brand);if(typeof t.brandStrong==='string')root.style.setProperty('--color-brand-strong',t.brandStrong);if(typeof t.canvas==='string')root.style.setProperty('--color-canvas',t.canvas);}}catch(e){}})();`;

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
  const locale = await getServerLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <I18nProvider initialLocale={locale}>
          <ThemeProvider>
            <QueryProvider key={session?.user?.email ?? "guest"}>
              {children}
              <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{ duration: 3500 }}
              />
              <SpeedInsights />
            </QueryProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
