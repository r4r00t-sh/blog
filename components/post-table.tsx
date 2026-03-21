import Link from "next/link";
import { formatDate, PostMeta } from "@/lib/post-types";

type PostTableProps = {
  posts: PostMeta[];
  bordered?: boolean;
};

export function PostTable({ posts, bordered = true }: PostTableProps) {
  return (
    <div className={bordered ? "border border-border" : ""}>
      <div className="grid grid-cols-[130px_1fr_120px] border-b border-border px-4 py-2 text-xs uppercase text-muted">
        <span>Date</span>
        <span>Title</span>
        <span>Topic</span>
      </div>
      <ul>
        {posts.map((post) => (
          <li
            key={post.slug}
            className="latest-post-row grid grid-cols-[130px_1fr_120px] border-b border-border px-4 py-3 text-sm last:border-b-0"
          >
            <span className="text-muted">{formatDate(post.date)}</span>
            <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-accent hover:underline">
              {post.title}
            </Link>
            <span className="text-muted">{post.topic}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
