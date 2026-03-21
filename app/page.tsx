import { Inter } from "next/font/google";
import { FeaturedPostCard } from "@/components/featured-post-card";
import { HomeAnimations } from "@/components/home-animations";
import { PostTable } from "@/components/post-table";
import { getSortedPostsData } from "@/lib/posts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-home-inter",
});

const HERO_TAGLINE = "Spellbook for system internals, malware research, and kernel sorcery.";

export default function Home() {
  const posts = getSortedPostsData();
  const [featuredPost, ...remainingPosts] = posts;

  return (
    <section className={`${inter.variable} bg-[var(--page-surface)] py-8 text-[var(--page-text)] md:py-10`}>
      <HomeAnimations />
      <div className="relative pb-8 md:pb-10">
        <span className="post-marker hero-marker left-4 top-4" aria-hidden="true" />
        <span className="post-marker hero-marker right-4 top-4" aria-hidden="true" />
        <span className="post-marker hero-marker bottom-4 left-4" aria-hidden="true" />
        <span className="post-marker hero-marker bottom-4 right-4" aria-hidden="true" />

        <div className="pt-7 pb-4 md:pt-11 md:pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-10 lg:gap-14 xl:gap-16">
            <h1 className="flex shrink-0 flex-wrap items-baseline gap-x-3 font-sans font-black uppercase leading-[0.85] tracking-tight [font-size:clamp(3.75rem,14vw,10.5rem)]">
              {"R4R00T".split(" ").map((word, index) => (
                <span key={`${word}-${index}`} className="hero-title-word inline-block">
                  {word}
                </span>
              ))}
            </h1>
            <div
              className="h-px w-full max-w-[14rem] bg-[var(--page-border)] md:hidden"
              aria-hidden="true"
            />
            <div
              className="hidden w-px shrink-0 self-stretch bg-[var(--page-border)] md:block md:min-h-[6rem]"
              aria-hidden="true"
            />
            <div className="hero-tagline min-w-0 max-w-2xl shrink text-[clamp(1.25rem,2.8vw,2.125rem)] leading-snug text-[var(--page-tagline)] md:leading-relaxed lg:max-w-3xl lg:text-[clamp(1.35rem,3vw,2.375rem)]">
              <p className="m-0 flex flex-wrap items-baseline gap-x-[0.4em] gap-y-1">
                {HERO_TAGLINE.split(/\s+/).map((word, i) => (
                  <span key={`${word}-${i}`} className="hero-tagline-word inline-block">
                    {word}
                  </span>
                ))}
              </p>
            </div>
          </div>
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
