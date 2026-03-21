"use client";

import Link from "next/link";
import { ThemeSelect } from "@/components/theme-select";

const floatingBtn =
  "nav-floating-pill inline-flex h-7 shrink-0 items-center justify-center rounded border border-black/[0.08] bg-white/50 px-2 text-[10px] font-semibold uppercase leading-none tracking-wide text-black shadow-sm backdrop-blur-md backdrop-saturate-150 transition-[background-color,border-color,color] duration-200 hover:bg-white/75 hover:border-black/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b7cff] dark:border-black/[0.1] dark:bg-white/55 dark:text-black dark:shadow-sm dark:hover:border-black/15 dark:hover:bg-white/80";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
    </svg>
  );
}

export function NavBar() {
  return (
    <header
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex w-full items-start justify-between gap-4 px-16 pt-[max(0.375rem,env(safe-area-inset-top))]"
      aria-label="Site navigation"
    >
      <nav className="pointer-events-auto flex flex-wrap items-center justify-start gap-1">
        <Link href="/" className={`${floatingBtn} w-7 px-0`} aria-label="Home">
          <HomeIcon />
        </Link>
        <Link href="/blog" className={floatingBtn}>
          [B] Blog
        </Link>
        <Link href="/about" className={floatingBtn}>
          [A] About
        </Link>
      </nav>
      <div className="pointer-events-auto shrink-0">
        <ThemeSelect menuAlign="end" />
      </div>
    </header>
  );
}
