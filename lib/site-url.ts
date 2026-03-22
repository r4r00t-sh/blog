/** Canonical site origin for metadata and OG URLs (Vercel sets VERCEL_URL). */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

/** Hostname (+ port if non-default) for OG/footer labels, e.g. `r4r00t-blog.vercel.app`. */
export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return "localhost";
  }
}
