import Link from "next/link";
import { formatDate, PostMeta } from "@/lib/post-types";

type PostTableProps = {
  posts: PostMeta[];
  bordered?: boolean;
};

export function PostTable({ posts, bordered = true }: PostTableProps) {
  return (
    <div
      className={`touch-manipulation ${bordered ? "overflow-x-auto border border-border" : "overflow-x-auto"}`}
    >
      <div className="hidden min-w-[min(100%,520px)] grid-cols-[7.5rem_minmax(0,1fr)_11.5rem] border-b border-border px-3 py-2 text-xs uppercase text-muted sm:grid md:grid-cols-[8rem_minmax(0,1fr)_12rem] md:px-4">
        <span>Date</span>
        <span>Title</span>
        <span>Topic</span>
      </div>
      <ul>
        {posts.map((post) => (
          <li
            key={post.slug}
            className="latest-post-row flex flex-col gap-2 border-b border-border px-3 py-4 text-sm transition-colors last:border-b-0 hover:bg-[var(--page-row-hover-bg)] sm:grid sm:min-w-[min(100%,520px)] sm:grid-cols-[7.5rem_minmax(0,1fr)_11.5rem] sm:items-center sm:gap-0 sm:px-4 sm:py-3 md:grid-cols-[8rem_minmax(0,1fr)_12rem]"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="order-1 min-w-0 font-medium text-[var(--page-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:order-2 sm:font-normal"
            >
              {post.title}
            </Link>
            <span className="order-2 text-xs text-muted sm:order-1 sm:text-sm">{formatDate(post.date)}</span>
            <span className="order-3 text-xs text-muted sm:order-3 sm:whitespace-nowrap sm:text-sm">{post.topic}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
