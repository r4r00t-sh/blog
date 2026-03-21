export const SITE_UI_THEME_STORAGE_KEY = "site-ui-theme";

/** Dispatched on `window` after `applySiteUiTheme` so blog code blocks can re-run Shiki. */
export const SITE_UI_THEME_APPLIED_EVENT = "site-ui-theme-applied";

export type SiteUiThemeId = "default" | "gruvbox-light" | "gruvbox-dark";

export const SITE_UI_THEMES: { id: SiteUiThemeId; label: string; triggerLabel: string }[] = [
  { id: "default", label: "default", triggerLabel: "default" },
  { id: "gruvbox-light", label: "gruvbox light", triggerLabel: "gruvbox" },
  { id: "gruvbox-dark", label: "gruvbox dark", triggerLabel: "dark" },
];

const STORED_IDS = new Set<SiteUiThemeId>(["default", "gruvbox-light", "gruvbox-dark"]);

/** Server: map `site-ui-theme` cookie value to a known UI id. */
export function parseSiteUiThemeFromCookie(raw: string | undefined | null): SiteUiThemeId | undefined {
  if (raw === "gruvbox-light" || raw === "gruvbox-dark") {
    return raw;
  }
  return undefined;
}

function setSiteThemeCookieClient(id: SiteUiThemeId) {
  const k = SITE_UI_THEME_STORAGE_KEY;
  if (id === "default") {
    document.cookie = `${k}=; Path=/; Max-Age=0; SameSite=Lax`;
  } else {
    document.cookie = `${k}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
}

export function getStoredSiteUiTheme(): SiteUiThemeId {
  if (typeof window === "undefined") {
    return "default";
  }
  try {
    const raw = localStorage.getItem(SITE_UI_THEME_STORAGE_KEY);
    if (raw && STORED_IDS.has(raw as SiteUiThemeId)) {
      return raw as SiteUiThemeId;
    }
  } catch {
    /* ignore */
  }
  return "default";
}

export function applySiteUiTheme(id: SiteUiThemeId) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (id === "default") {
    root.removeAttribute("data-site-theme");
  } else {
    root.setAttribute("data-site-theme", id);
  }
  try {
    localStorage.setItem(SITE_UI_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }

  setSiteThemeCookieClient(id);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SITE_UI_THEME_APPLIED_EVENT));
  }
}

/** Re-apply `<html data-site-theme>` from localStorage without writing storage (hydration / race recovery). */
export function syncSiteThemeAttributeFromStorage() {
  if (typeof document === "undefined") {
    return;
  }
  const id = getStoredSiteUiTheme();
  const root = document.documentElement;
  if (id === "default") {
    root.removeAttribute("data-site-theme");
  } else {
    root.setAttribute("data-site-theme", id);
  }
  setSiteThemeCookieClient(id);
}
