/** Space Mono TTF from google/fonts (reliable fetch on Vercel / Node OG routes). */
const SPACE_MONO_REGULAR =
  "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Regular.ttf";
const SPACE_MONO_BOLD =
  "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Bold.ttf";

export type OgFontConfig = {
  name: "Space Mono";
  data: ArrayBuffer;
  style: "normal";
  weight: 400 | 700;
};

export async function loadSpaceMonoFonts(): Promise<OgFontConfig[]> {
  const [regular, bold] = await Promise.all([
    fetch(SPACE_MONO_REGULAR).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load Space Mono regular: ${res.status}`);
      }
      return res.arrayBuffer();
    }),
    fetch(SPACE_MONO_BOLD).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load Space Mono bold: ${res.status}`);
      }
      return res.arrayBuffer();
    }),
  ]);

  return [
    { name: "Space Mono", data: regular, style: "normal", weight: 400 },
    { name: "Space Mono", data: bold, style: "normal", weight: 700 },
  ];
}

export function truncateOgText(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxChars) {
    return t;
  }
  return `${t.slice(0, maxChars - 1).trimEnd()}…`;
}
