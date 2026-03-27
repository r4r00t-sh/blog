"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PostMeta, formatDate, type Difficulty } from "@/lib/post-types";
import { getAnime } from "@/lib/anime";
import { SearchDialog } from "@/components/search-dialog";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

const difficultyColors: Record<Difficulty, string> = {
  Beginner: "text-green-700",
  Intermediate: "text-yellow-700",
  Advanced: "text-red-600",
};

type BlogFilterProps = {
  posts: PostMeta[];
};

export function BlogFilter({ posts }: BlogFilterProps) {
  const [activeTopic, setActiveTopic] = useState<string>("All");
  const [searchOpen, setSearchOpen] = useState(false);

  const topics = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((post) => post.topic))).sort()],
    [posts],
  );

  const filteredPosts = useMemo(() => {
    if (activeTopic === "All") {
      return posts;
    }
    return posts.filter((post) => post.topic === activeTopic);
  }, [activeTopic, posts]);

  const postSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);

  useEffect(() => {
    let mounted = true;
    async function animateRows() {
      const anime = await getAnime();
      if (!anime || !mounted) {
        return;
      }

      anime.set(".blog-index-row", { opacity: 0, translateY: 10 });
      anime.animate(".blog-index-row", {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: anime.stagger(50),
        duration: 420,
        ease: "outExpo",
      });
    }
    void animateRows();
    return () => {
      mounted = false;
    };
  }, [filteredPosts]);

  useEffect(() => {
    let mounted = true;
    async function animateTags() {
      const anime = await getAnime();
      if (!anime || !mounted) {
        return;
      }

      anime.set(".topic-filter-tag", { opacity: 0, scale: 0.97 });
      anime.animate(".topic-filter-tag", {
        opacity: [0, 1],
        scale: [0.97, 1],
        delay: anime.stagger(25),
        duration: 260,
        ease: "outExpo",
      });
    }
    void animateTags();
    return () => {
      mounted = false;
    };
  }, [activeTopic]);

  return (
    <div className="space-y-5">
      <KeyboardShortcuts onSearchOpen={() => setSearchOpen(true)} postSlugs={postSlugs} />

      <div className="flex flex-wrap items-center gap-2">
        {topics.map((topic) => {
          const active = topic === activeTopic;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => setActiveTopic(topic)}
              className={`topic-filter-tag border px-2 py-1 text-xs transition-colors ${
                active
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {topic}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="topic-filter-tag ml-auto flex items-center gap-1.5 border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          aria-label="Search posts"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden border border-[var(--page-border-soft)] px-1 py-0.5 text-[9px] sm:inline">/</kbd>
        </button>
      </div>
      <div>
        <div className="touch-manipulation overflow-x-auto">
          <div className="hidden min-w-[min(100%,600px)] grid-cols-[7.5rem_minmax(0,1fr)_8rem_6rem] border-b border-border px-3 py-2 text-xs uppercase text-muted sm:grid md:grid-cols-[8rem_minmax(0,1fr)_9rem_7rem] md:px-4">
            <span>Date</span>
            <span>Title</span>
            <span>Topic</span>
            <span>Level</span>
          </div>
          <ul>
            {filteredPosts.map((post) => (
              <li
                key={post.slug}
                className="blog-index-row flex flex-col gap-2 border-b border-border px-3 py-4 text-sm transition-colors last:border-b-0 hover:bg-[var(--page-row-hover-bg)] sm:grid sm:min-w-[min(100%,600px)] sm:grid-cols-[7.5rem_minmax(0,1fr)_8rem_6rem] sm:items-center sm:gap-0 sm:px-4 sm:py-3 md:grid-cols-[8rem_minmax(0,1fr)_9rem_7rem]"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="order-1 min-w-0 font-medium text-[var(--page-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:order-2 sm:font-normal"
                >
                  {post.title}
                </Link>
                <span className="order-2 text-xs text-muted sm:order-1 sm:text-sm">{formatDate(post.date)}</span>
                <span className="order-3 text-xs text-muted sm:order-3 sm:whitespace-nowrap sm:text-sm">{post.topic}</span>
                <span className="order-4 sm:order-4">
                  {post.difficulty ? (
                    <span className={`text-xs ${difficultyColors[post.difficulty]}`}>
                      {post.difficulty}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SearchDialog posts={posts} isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
