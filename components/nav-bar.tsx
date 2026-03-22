"use client";

import Link from "next/link";
import { ThemeSelect } from "@/components/theme-select";

const floatingBtn =
  "nav-floating-pill inline-flex h-9 min-h-[2.25rem] shrink-0 items-center justify-center rounded border border-black/[0.08] bg-white/50 px-2.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-black shadow-sm backdrop-blur-md backdrop-saturate-150 transition-[background-color,border-color,color] duration-200 hover:bg-white/75 hover:border-black/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] dark:border-black/[0.1] dark:bg-white/55 dark:text-black dark:shadow-sm dark:hover:border-black/15 dark:hover:bg-white/80 sm:h-7 sm:min-h-0 sm:px-2";

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
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex w-full max-w-[100vw] items-start justify-between gap-2 px-4 pt-[max(0.375rem,env(safe-area-inset-top))] sm:gap-3 sm:px-6 md:px-10 lg:px-16"
      aria-label="Site navigation"
    >
      <nav className="pointer-events-auto flex max-w-[min(100%,calc(100vw-5.5rem))] flex-wrap items-center justify-start gap-1 sm:max-w-none">
        <Link href="/" className={`${floatingBtn} w-9 px-0 sm:w-7`} aria-label="Home">
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
