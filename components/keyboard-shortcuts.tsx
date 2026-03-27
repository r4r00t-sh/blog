"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SITE_UI_THEMES, getStoredSiteUiTheme, applySiteUiTheme } from "@/lib/site-theme";

type KeyboardShortcutsProps = {
  onSearchOpen: () => void;
  /** Slugs for j/k navigation on blog index */
  postSlugs?: string[];
};

export function KeyboardShortcuts({ onSearchOpen, postSlugs }: KeyboardShortcutsProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // / for search (works even in inputs to override default)
      if (e.key === "/" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onSearchOpen();
        return;
      }

      if (isInput) return;

      // t for theme cycle
      if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
        const current = getStoredSiteUiTheme();
        const ids = SITE_UI_THEMES.map((t) => t.id);
        const idx = ids.indexOf(current);
        const next = ids[(idx + 1) % ids.length];
        applySiteUiTheme(next);
        return;
      }

      // j/k navigation on blog-like pages
      if ((e.key === "j" || e.key === "k") && postSlugs && postSlugs.length > 0) {
        // Find current post index if on a post page
        const match = pathname.match(/^\/blog\/(.+)$/);
        const currentSlug = match?.[1];
        const currentIdx = currentSlug ? postSlugs.indexOf(currentSlug) : -1;

        if (e.key === "j") {
          // Next post
          const nextIdx = currentIdx < postSlugs.length - 1 ? currentIdx + 1 : 0;
          router.push(`/blog/${postSlugs[nextIdx]}`);
        } else {
          // Previous post
          const prevIdx = currentIdx > 0 ? currentIdx - 1 : postSlugs.length - 1;
          router.push(`/blog/${postSlugs[prevIdx]}`);
        }
        return;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onSearchOpen, postSlugs, pathname, router]);

  return null;
}
