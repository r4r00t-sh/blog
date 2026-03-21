import Link from "next/link";
import { formatDate, PostMeta } from "@/lib/post-types";

type FeaturedPostCardProps = {
  post: PostMeta;
};

export function FeaturedPostCard({ post }: FeaturedPostCardProps) {
  return (
    <article
      id="featured-post-card"
      className="grid grid-cols-1 overflow-hidden border border-[var(--page-border)] md:grid-cols-[42%_58%]"
    >
      <div className="featured-pattern relative min-h-[220px] border-b border-[color:var(--page-border)] md:border-b-0 md:border-r md:border-[color:var(--page-border)]">
        <p className="absolute left-4 top-4 text-xs text-[var(--page-label)]">[ Fig. 1 ]</p>
      </div>
      <div className="space-y-4 px-6 py-6 text-[var(--page-text-strong)]">
        <h2 className="text-3xl font-extrabold leading-tight">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-[var(--page-link-hover)] hover:underline"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-[var(--page-muted)]">{post.summary}</p>
        <div className="flex items-center gap-2 text-xs text-[var(--page-label)]">
          <span>{formatDate(post.date)}</span>
          <span>/</span>
          <span className="border border-[var(--page-chip-border)] px-2 py-0.5">{post.topic}</span>
        </div>
        <Link
          href="/blog"
          className="inline-block border border-[var(--page-chip-border)] px-3 py-1.5 text-xs text-[var(--page-chip-text)] transition-colors hover:border-[var(--page-hover-border)] hover:text-[var(--page-hover-border)]"
        >
          More posts
        </Link>
      </div>
    </article>
  );
}
