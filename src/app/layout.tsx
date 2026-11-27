import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const description =
  "SuperTutor builds a personal study plan from your goal, teaches each topic from your own course materials with citations, checks understanding with quizzes, and adapts what you study next.";

export const metadata: Metadata = {
  title: { default: "SuperTutor — personal learning assistant", template: "%s · SuperTutor" },
  description,
  metadataBase: new URL("https://supertutor.tech"),
  openGraph: {
    title: "SuperTutor — personal learning assistant",
    description,
    url: "https://supertutor.tech",
    siteName: "SuperTutor",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen antialiased`}>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">{children}</main>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              <span className="font-semibold text-ink">SuperTutor</span> · supertutor.tech
            </span>
            <nav className="flex gap-5">
              <Link href="/plan" className="hover:text-ink">Study plans</Link>
              <Link href="/tutor" className="hover:text-ink">Tutor</Link>
              <Link href="/quiz" className="hover:text-ink">Practice</Link>
              <Link href="/dashboard" className="hover:text-ink">Progress</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
