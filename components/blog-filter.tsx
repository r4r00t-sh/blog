"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PostMeta, formatDate } from "@/lib/post-types";
import { getAnime } from "@/lib/anime";

type BlogFilterProps = {
  posts: PostMeta[];
};

export function BlogFilter({ posts }: BlogFilterProps) {
  const [activeTopic, setActiveTopic] = useState<string>("All");

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
      <div className="flex flex-wrap gap-2">
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
      </div>
      <div>
        <div className="touch-manipulation overflow-x-auto">
          <div className="hidden min-w-[min(100%,520px)] grid-cols-[7.5rem_minmax(0,1fr)_11.5rem] border-b border-border px-3 py-2 text-xs uppercase text-muted sm:grid md:grid-cols-[8rem_minmax(0,1fr)_12rem] md:px-4">
            <span>Date</span>
            <span>Title</span>
            <span>Topic</span>
          </div>
          <ul>
            {filteredPosts.map((post) => (
              <li
                key={post.slug}
                className="blog-index-row flex flex-col gap-2 border-b border-border px-3 py-4 text-sm transition-colors last:border-b-0 hover:bg-[var(--page-row-hover-bg)] sm:grid sm:min-w-[min(100%,520px)] sm:grid-cols-[7.5rem_minmax(0,1fr)_11.5rem] sm:items-center sm:gap-0 sm:px-4 sm:py-3 md:grid-cols-[8rem_minmax(0,1fr)_12rem]"
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
      </div>
    </div>
  );
}
