/**
 * Canonical site origin for metadata and OG URLs.
 * Set `NEXT_PUBLIC_SITE_URL` in production (e.g. `https://yourdomain.com`) so `og:image` and
 * `metadataBase` are never `localhost`. Vercel also sets `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL` at build/runtime.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return normalizeOrigin(production);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return normalizeOrigin(vercel);
  }
  return "http://localhost:3000";
}

function normalizeOrigin(hostOrUrl: string): string {
  const trimmed = hostOrUrl.replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/\//, "")}`;
}

/** Hostname (+ port if non-default) for OG/footer labels, e.g. `r4r00t-blog.vercel.app`. */
export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return "localhost";
  }
}
