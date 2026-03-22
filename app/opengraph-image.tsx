import { cookies } from "next/headers";
import { ImageResponse } from "next/og";
import { loadSpaceMonoFonts, truncateOgText } from "@/lib/og-fonts";
import { getOgPaletteForTheme } from "@/lib/og-theme";
import { getSiteHost } from "@/lib/site-url";
import { parseSiteUiThemeFromCookie, SITE_UI_THEME_STORAGE_KEY } from "@/lib/site-theme";

/** Edge avoids a Windows Node bug loading bundled Noto in `@vercel/og` (Invalid URL / file: paths). */
export const runtime = "edge";
export const alt = "R4R00T";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE = "Spellbook for system internals, malware research, and kernel sorcery.";

export default async function Image() {
  const cookieTheme = parseSiteUiThemeFromCookie(cookies().get(SITE_UI_THEME_STORAGE_KEY)?.value);
  const palette = getOgPaletteForTheme(cookieTheme);
  const fonts = await loadSpaceMonoFonts();
  const tagline = truncateOgText(TAGLINE, 200);
  const siteHost = getSiteHost();
  const siteHostFontSize = siteHost.length > 34 ? 14 : siteHost.length > 26 ? 17 : siteHost.length > 22 ? 19 : 22;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: palette.bg,
          padding: 56,
          fontFamily: '"Space Mono", monospace',
        }}
      >
        <div
          style={{
            height: 4,
            width: 160,
            backgroundColor: palette.accent,
            marginBottom: 48,
          }}
        />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 32 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: palette.title,
              letterSpacing: -2,
              lineHeight: 0.95,
            }}
          >
            R4R00T
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: palette.summary,
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            {tagline}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 32,
            paddingTop: 28,
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 400, color: palette.footer }}>r4r00t blog</div>
          <div
            style={{
              fontSize: siteHostFontSize,
              fontWeight: 700,
              color: palette.title,
              textAlign: "right",
              maxWidth: 520,
              lineHeight: 1.2,
            }}
          >
            {siteHost}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
