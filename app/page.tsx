import Link from "next/link";
import { Inter } from "next/font/google";
import { FeaturedPostCard } from "@/components/featured-post-card";
import { HomeAnimations } from "@/components/home-animations";
import { PostTable } from "@/components/post-table";
import { getSortedPostsData } from "@/lib/posts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-home-inter",
});

export default function Home() {
  const posts = getSortedPostsData();
  const [featuredPost, ...remainingPosts] = posts;

  return (
    <section className={`${inter.variable} bg-[var(--page-surface)] py-12 text-[var(--page-text)]`}>
      <HomeAnimations />
      <div className="relative pb-16">
        <span className="post-marker hero-marker left-[8%] top-4" aria-hidden="true" />
        <span className="post-marker hero-marker right-[10%] top-10" aria-hidden="true" />
        <span className="post-marker hero-marker left-[22%] top-[52%]" aria-hidden="true" />
        <span className="post-marker hero-marker right-[35%] bottom-8" aria-hidden="true" />

        <h1 className="font-sans text-[72px] font-black uppercase leading-[0.9] tracking-tight md:text-[96px] xl:text-[118px]">
          {"R4R00T".split(" ").map((word, index) => (
            <span key={`${word}-${index}`} className="hero-title-word mr-4 inline-block">
              {word}
            </span>
          ))}
        </h1>
        <div className="hero-tagline mt-6 max-w-[600px] space-y-2 text-[18px] leading-relaxed text-[var(--page-tagline)] md:text-[20px]">
          <p>Spellbook for system internals, malware research, and kernel sorcery.</p>
        </div>
        <div className="flex gap-4 text-xs">
          <Link
            href="/blog"
            className="text-[var(--page-muted)] transition-colors hover:text-[var(--page-link-hover)] hover:underline"
          >
            /Latest Posts
          </Link>
          <Link
            href="/about"
            className="text-[var(--page-muted)] transition-colors hover:text-[var(--page-link-hover)] hover:underline"
          >
            /About
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4 border-b border-[#d7d3c7] pb-2">
        <p className="text-xs uppercase tracking-wide text-[#6a6658]">/ Featured Post</p>
      </div>
      {featuredPost ? <FeaturedPostCard post={featuredPost} /> : null}

      <div id="latest-posts-section" className="mt-14 space-y-3">
        <div className="mb-3 flex items-center gap-4 border-b border-[var(--page-border)] pb-2">
          <p className="text-xs uppercase tracking-wide text-[var(--page-label)]">/ Latest Posts</p>
        </div>
        <PostTable posts={remainingPosts.length ? remainingPosts : posts} bordered={false} />
      </div>
    </section>
  );
}
