import Link from "next/link";
import { formatDate, PostMeta } from "@/lib/post-types";

type PostTableProps = {
  posts: PostMeta[];
  bordered?: boolean;
};

export function PostTable({ posts, bordered = true }: PostTableProps) {
  return (
    <div className={bordered ? "overflow-x-auto border border-border" : "overflow-x-auto"}>
      <div className="grid min-w-[min(100%,520px)] grid-cols-[7.5rem_minmax(0,1fr)_11.5rem] border-b border-border px-4 py-2 text-xs uppercase text-muted md:grid-cols-[8rem_minmax(0,1fr)_12rem]">
        <span>Date</span>
        <span>Title</span>
        <span>Topic</span>
      </div>
      <ul>
        {posts.map((post) => (
          <li
            key={post.slug}
            className="latest-post-row grid min-w-[min(100%,520px)] grid-cols-[7.5rem_minmax(0,1fr)_11.5rem] border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-[var(--page-row-hover-bg)] md:grid-cols-[8rem_minmax(0,1fr)_12rem]"
          >
            <span className="text-muted">{formatDate(post.date)}</span>
            <Link
              href={`/blog/${post.slug}`}
              className="min-w-0 text-[var(--page-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {post.title}
            </Link>
            <span className="whitespace-nowrap text-muted">{post.topic}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
