import raw from "./posts-meta.generated.json";

export type PostOgMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  summary: string;
};

/** Synced from markdown via `node scripts/write-posts-meta.mjs` (runs on predev / prebuild). */
export const POSTS_OG_META: PostOgMeta[] = raw;
