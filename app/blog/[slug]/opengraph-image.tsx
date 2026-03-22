import { cookies } from "next/headers";
import { ImageResponse } from "next/og";
import { loadSpaceMonoFonts, truncateOgText } from "@/lib/og-fonts";
import { getOgPaletteForTheme } from "@/lib/og-theme";
import { POSTS_OG_META } from "@/lib/posts-og-meta";
import { getSiteHost } from "@/lib/site-url";
import { parseSiteUiThemeFromCookie, SITE_UI_THEME_STORAGE_KEY } from "@/lib/site-theme";

/** Edge avoids a Windows Node bug loading bundled Noto in `@vercel/og` (Invalid URL / file: paths). */
export const runtime = "edge";
export const alt = "Post preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: { slug: string };
};

export default async function Image({ params }: Props) {
  const post = POSTS_OG_META.find((p) => p.slug === params.slug);
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const cookieTheme = parseSiteUiThemeFromCookie(cookies().get(SITE_UI_THEME_STORAGE_KEY)?.value);
  const palette = getOgPaletteForTheme(cookieTheme);
  const fonts = await loadSpaceMonoFonts();

  const title = truncateOgText(post.title, 120);
  const summary = truncateOgText(post.summary, 260);
  const siteHost = getSiteHost();
  const siteHostFontSize = siteHost.length > 34 ? 15 : siteHost.length > 26 ? 18 : siteHost.length > 22 ? 20 : 24;

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
            width: 120,
            backgroundColor: palette.accent,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              fontSize: title.length > 80 ? 44 : 56,
              fontWeight: 700,
              color: palette.title,
              lineHeight: 1.08,
              letterSpacing: -0.5,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: palette.summary,
              lineHeight: 1.45,
              maxHeight: 200,
              overflow: "hidden",
            }}
          >
            {summary}
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
          <div style={{ fontSize: 24, fontWeight: 700, color: palette.footer }}>{post.author}</div>
          <div
            style={{
              fontSize: siteHostFontSize,
              fontWeight: 700,
              color: palette.title,
              textAlign: "right",
              maxWidth: 560,
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
