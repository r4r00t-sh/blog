import { BlogFilter } from "@/components/blog-filter";
import { getSortedPostsData } from "@/lib/posts";

export const metadata = {
  title: "Blog | r4r00t blog",
};

export default function BlogPage() {
  const posts = getSortedPostsData();

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs text-muted">/Topics</p>
        <h1 className="text-2xl uppercase">Blog Index</h1>
        <p className="text-sm text-muted">Filter posts by topic tags in real time.</p>
      </header>
      <BlogFilter posts={posts} />
    </section>
  );
}
