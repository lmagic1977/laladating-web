import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LALA Speed Dating",
  description: "Huntington Beach speed dating events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <a href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="LALA Speed Dating" className="h-11 w-auto" />
              </a>
              <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
                <a href="/" className="hover:text-white">首页</a>
                <a href="/events" className="hover:text-white">活动</a>
                <a href="/register" className="hover:text-white">报名</a>
                <a href="/admin" className="hover:text-white">后台</a>
              </nav>
              <div className="flex items-center gap-2">
                <a
                  href="/register"
                  className="rounded-full px-4 py-2 text-sm font-semibold neon-button"
                >
                  立即报名
                </a>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
          <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-white/60">
            LALA Speed Dating · Huntington Beach, CA
          </footer>
        </div>
      </body>
    </html>
  );
}
