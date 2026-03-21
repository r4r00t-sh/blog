"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  SITE_UI_THEMES,
  applySiteUiTheme,
  getStoredSiteUiTheme,
  type SiteUiThemeId,
} from "@/lib/site-theme";

const triggerClass =
  "nav-floating-pill inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded border border-black/[0.08] bg-white/50 px-2 text-[10px] font-semibold uppercase leading-none tracking-wide text-black shadow-sm backdrop-blur-md backdrop-saturate-150 transition-[background-color,border-color,color] duration-200 hover:bg-white/75 hover:border-black/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b7cff] dark:border-black/[0.1] dark:bg-white/55 dark:text-black dark:shadow-sm dark:hover:border-black/15 dark:hover:bg-white/80";

const menuBaseClass =
  "absolute top-[calc(100%+4px)] z-[100] min-w-[11rem] rounded border border-border bg-background/95 py-1 text-[10px] font-semibold uppercase leading-none tracking-wide text-foreground shadow-md backdrop-blur-md";

const menuItemClass =
  "flex w-full items-center px-3 py-1.5 text-left transition-colors hover:bg-muted/25";

type ThemeSelectProps = {
  /** `end` = menu aligned to the right edge of the trigger (top-right placement) */
  menuAlign?: "start" | "end";
};

export function ThemeSelect({ menuAlign = "start" }: ThemeSelectProps) {
  const [open, setOpen] = useState(false);
  const [themeId, setThemeId] = useState<SiteUiThemeId>("default");
  const wrapRef = useRef<HTMLDivElement>(null);

  /* Layout: restore `data-site-theme` before paint so CSS and code highlighter see the real theme (hydration can clear <html> attrs). */
  useLayoutEffect(() => {
    const stored = getStoredSiteUiTheme();
    setThemeId(stored);
    applySiteUiTheme(stored);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const el = wrapRef.current;
      if (el && !el.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const currentTrigger =
    SITE_UI_THEMES.find((t) => t.id === themeId)?.triggerLabel ?? "default";

  const selectTheme = useCallback((id: SiteUiThemeId) => {
    setThemeId(id);
    applySiteUiTheme(id);
    setOpen(false);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select color theme"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="whitespace-nowrap">[{currentTrigger}]</span>
        <span aria-hidden className="text-[9px] opacity-80">
          ⬇
        </span>
      </button>
      {open ? (
        <ul
          className={`${menuBaseClass} ${menuAlign === "end" ? "right-0 left-auto" : "left-0"}`}
          role="listbox"
          aria-label="Themes"
        >
          {SITE_UI_THEMES.map((t) => (
            <li key={t.id} role="option" aria-selected={t.id === themeId}>
              <button type="button" className={menuItemClass} onClick={() => selectTheme(t.id)}>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
