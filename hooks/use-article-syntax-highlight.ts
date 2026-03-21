"use client";

import { useEffect, useRef } from "react";
import type { Highlighter } from "shiki/bundle/web";
import {
  getStoredSiteUiTheme,
  SITE_UI_THEME_APPLIED_EVENT,
  SITE_UI_THEME_STORAGE_KEY,
  syncSiteThemeAttributeFromStorage,
} from "@/lib/site-theme";

type ShikiTheme = "github-light" | "gruvbox-light-medium" | "gruvbox-dark-medium";

function resolveShikiTheme(): ShikiTheme {
  if (typeof document === "undefined") {
    return "github-light";
  }

  const stored = getStoredSiteUiTheme();
  if (stored === "gruvbox-light") {
    return "gruvbox-light-medium";
  }
  if (stored === "gruvbox-dark") {
    return "gruvbox-dark-medium";
  }

  const attr = document.documentElement.getAttribute("data-site-theme");
  if (attr === "gruvbox-light") {
    return "gruvbox-light-medium";
  }
  if (attr === "gruvbox-dark") {
    return "gruvbox-dark-medium";
  }

  return "github-light";
}

function normalizeLang(raw: string): string {
  const r = raw.toLowerCase().trim();
  const map: Record<string, string> = {
    sh: "shellscript",
    shell: "shellscript",
    py: "python",
    yml: "yaml",
    js: "javascript",
    ts: "typescript",
    txt: "markdown",
    text: "markdown",
    plaintext: "markdown",
    makefile: "shellscript",
    make: "shellscript",
    ini: "yaml",
    dockerfile: "shellscript",
    rust: "cpp",
    rs: "cpp",
    toml: "yaml",
    diff: "markdown",
  };
  return map[r] ?? r;
}

function extractBlockSource(code: HTMLElement): string {
  const byDataLine = code.querySelectorAll("[data-line]");
  if (byDataLine.length > 0) {
    return [...byDataLine].map((l) => l.textContent ?? "").join("\n");
  }
  const byLineClass = code.querySelectorAll("span.line");
  if (byLineClass.length > 0) {
    return [...byLineClass].map((l) => l.textContent ?? "").join("\n");
  }
  return code.textContent ?? "";
}

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const { createHighlighter } = await import("shiki/bundle/web");
      return createHighlighter({
        themes: ["github-light", "gruvbox-light-medium", "gruvbox-dark-medium"],
        langs: [
          "bash",
          "c",
          "cpp",
          "css",
          "html",
          "javascript",
          "json",
          "jsx",
          "markdown",
          "python",
          "shellscript",
          "sql",
          "tsx",
          "typescript",
          "xml",
          "yaml",
        ],
      });
    })();
  }
  return highlighterPromise;
}

/** Client re-highlight marker; used by CSS to hide SSR GitHub Light until Shiki runs. */
const SHIKI_CLIENT_ATTR = "data-shiki-client";

export async function highlightArticleCodeBlocks(root: HTMLElement, signal: AbortSignal): Promise<void> {
  const figures = root.querySelectorAll<HTMLElement>("[data-rehype-pretty-code-figure]");
  if (figures.length === 0) {
    return;
  }

  syncSiteThemeAttributeFromStorage();
  if (signal.aborted) {
    return;
  }

  for (const fig of figures) {
    fig.removeAttribute(SHIKI_CLIENT_ATTR);
  }

  const highlighter = await getHighlighter();
  if (signal.aborted) {
    return;
  }

  const theme = resolveShikiTheme();
  if (signal.aborted) {
    return;
  }

  for (const figure of figures) {
    if (signal.aborted) {
      return;
    }
    const pre = figure.querySelector("pre");
    const code = pre?.querySelector("code");
    if (!pre || !code) {
      continue;
    }

    const rawLang = pre.dataset.language || code.dataset.language || "markdown";
    const lang = normalizeLang(rawLang);
    const source = extractBlockSource(code);
    if (!source.trim()) {
      continue;
    }

    let html: string;
    try {
      html = highlighter.codeToHtml(source, { lang, theme });
    } catch {
      try {
        html = highlighter.codeToHtml(source, { lang: "markdown", theme });
      } catch {
        continue;
      }
    }

    if (signal.aborted) {
      return;
    }

    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    const newPre = tpl.content.firstElementChild;
    if (!newPre || newPre.tagName !== "PRE") {
      continue;
    }

    pre.replaceWith(newPre);
    figure.setAttribute(SHIKI_CLIENT_ATTR, "");
  }
}

/**
 * Re-run Shiki when the article mounts or when `applySiteUiTheme` fires
 * `SITE_UI_THEME_APPLIED_EVENT`. No MutationObserver / seq-abort (those aborted in-flight work
 * after `await getHighlighter()` and left SSR GitHub Light HTML in place).
 */
export function useArticleSyntaxHighlight(contentKey: string) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) {
      return;
    }
    const articleRoot: HTMLElement = rootEl;

    const ac = new AbortController();
    let running = false;
    let pending = false;

    async function runHighlightPass() {
      if (running) {
        pending = true;
        return;
      }
      running = true;
      try {
        do {
          pending = false;
          if (ac.signal.aborted) {
            return;
          }
          await highlightArticleCodeBlocks(articleRoot, ac.signal);
        } while (pending && !ac.signal.aborted);
      } finally {
        running = false;
      }
    }

    function requestHighlight() {
      void runHighlightPass();
    }

    const onThemeApplied = () => {
      requestHighlight();
    };

    function onStorage(event: StorageEvent) {
      if (event.key === SITE_UI_THEME_STORAGE_KEY) {
        requestHighlight();
      }
    }

    window.addEventListener(SITE_UI_THEME_APPLIED_EVENT, onThemeApplied);
    window.addEventListener("storage", onStorage);

    /* After ThemeSelect layout + paint; avoids racing React commit. */
    const t = window.setTimeout(requestHighlight, 0);

    return () => {
      ac.abort();
      window.clearTimeout(t);
      window.removeEventListener(SITE_UI_THEME_APPLIED_EVENT, onThemeApplied);
      window.removeEventListener("storage", onStorage);
    };
  }, [contentKey]);

  return rootRef;
}
