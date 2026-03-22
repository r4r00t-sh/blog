import type { SiteUiThemeId } from "@/lib/site-theme";

/** OG image palette aligned with `app/globals.css` (`:root` = default light; gruvbox * = `data-site-theme`). */
export type OgThemePalette = {
  bg: string;
  title: string;
  summary: string;
  footer: string;
  accent: string;
  border: string;
};

export function getOgPaletteForTheme(theme: SiteUiThemeId | undefined): OgThemePalette {
  switch (theme) {
    case "gruvbox-dark":
      return {
        bg: "#282828",
        title: "#fbf1c7",
        summary: "#bdae93",
        footer: "#a89984",
        accent: "#00ff2b",
        border: "#504945",
      };
    case "gruvbox-light":
      return {
        bg: "#fbf1c7",
        title: "#282828",
        summary: "#665c54",
        footer: "#7c6f64",
        accent: "#00ffec",
        border: "#d5c4a1",
      };
    case "default":
    default:
      /* Matches `:root` in globals.css (no `data-site-theme`). */
      return {
        bg: "#f5f4ef",
        title: "#1b1b1b",
        summary: "#5f5b4f",
        footer: "#6a6658",
        accent: "#00ffec",
        border: "#d7d3c7",
      };
  }
}
