"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { getAnime } from "@/lib/anime";
import { useArticleSyntaxHighlight } from "@/hooks/use-article-syntax-highlight";
import type { TocNode } from "@/lib/markdown-toc";
import { formatDate, type PostMeta } from "@/lib/post-types";
import { ArticleToc } from "@/components/article-toc";
import { CopyPostUrlButton, SharePostModal, SharePostTrigger } from "@/components/share-post-modal";

type PostPageContentProps = {
  slug: string;
  title: string;
  date: string;
  author: string;
  readingTime: string;
  topic: string;
  contentHtml: string;
  toc: TocNode[];
  otherPostsInTopic: PostMeta[];
  shareUrl: string;
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export function PostPageContent({
  slug,
  title,
  date,
  author,
  readingTime,
  topic,
  contentHtml,
  toc,
  otherPostsInTopic,
  shareUrl,
}: PostPageContentProps) {
  /** Split on whitespace only — inter-word gaps come from flex `gap`, not text nodes, so a line never starts with a “space box”. */
  const titleWords = useMemo(() => title.trim().split(/\s+/).filter(Boolean), [title]);
  const [heroVisible, setHeroVisible] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const articleRef = useArticleSyntaxHighlight(`${slug}:${contentHtml.length}`);

  useEffect(() => {
    let mounted = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || !entry.target) {
            return;
          }
          void (async () => {
            const anime = await getAnime();
            if (!anime || !mounted) {
              return;
            }
            anime.animate(entry.target, {
              opacity: [0, 1],
              translateY: [8, 0],
              duration: 360,
              ease: "outQuad",
            });
          })();
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.25 },
    );

    async function animate() {
      const anime = await getAnime();
      if (!anime || !mounted) {
        return;
      }

      anime.set(".post-hero-char", { opacity: 0, translateY: 42 });
      anime.animate(".post-hero-char", {
        opacity: [0, 1],
        translateY: [42, 0],
        delay: anime.stagger(24),
        duration: 620,
        ease: "outExpo",
      });

      anime.set(".metadata-row", { opacity: 0, translateX: -10 });
      anime.animate(".metadata-row", {
        opacity: [0, 1],
        translateX: [-10, 0],
        delay: anime.stagger(55),
        duration: 420,
        ease: "outQuad",
      });

      const paragraphs = document.querySelectorAll(".article-content p, .article-content li");
      paragraphs.forEach((node) => {
        (node as HTMLElement).style.opacity = "0";
        observer.observe(node);
      });
    }
    void animate();
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const heroTitle = document.getElementById("hero-title");

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    if (heroTitle) {
      observer.observe(heroTitle);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <article
      className={`${inter.variable} bg-[var(--page-surface)] text-[var(--page-text)]`}
    >
      <section className="relative py-16">
        <span className="post-marker left-4 top-4" aria-hidden="true" />
        <span className="post-marker right-4 top-4" aria-hidden="true" />
        <span className="post-marker bottom-4 left-4" aria-hidden="true" />
        <span className="post-marker bottom-4 right-4" aria-hidden="true" />
        <h1
          id="hero-title"
          className="flex flex-wrap items-baseline justify-start gap-x-[0.22em] gap-y-0 text-left text-6xl font-black uppercase leading-[0.95] tracking-tight md:text-8xl xl:text-[92px]"
        >
          {titleWords.map((word, wordIndex) => (
            <span key={wordIndex} className="inline-flex shrink-0">
              {word.split("").map((char, charIndex) => (
                <span key={`${wordIndex}-${charIndex}`} className="post-hero-char inline-block">
                  {char}
                </span>
              ))}
            </span>
          ))}
        </h1>
      </section>

      <section className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[var(--nav-stack)] lg:h-fit lg:self-start">
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
              heroVisible ? "max-h-0 opacity-0" : "mb-5 max-h-[200px] opacity-100"
            }`}
          >
            <h2 id="sidebar-title" className="font-sans text-2xl font-extrabold leading-tight tracking-tight xl:text-[30px]">
              {title}
            </h2>
          </div>
          <p className="border-b border-[var(--page-border)] pb-2 text-xs tracking-wide text-[var(--page-muted)]">
            /METADATA
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="metadata-row flex items-start justify-between gap-4 border-b border-[var(--page-border-soft)] pb-2">
              <dt className="text-[var(--page-label)]">DATE:</dt>
              <dd>{formatDate(date)}</dd>
            </div>
            <div className="metadata-row flex items-start justify-between gap-4 border-b border-[var(--page-border-soft)] pb-2">
              <dt className="text-[var(--page-label)]">AUTHOR:</dt>
              <dd>{author}</dd>
            </div>
            <div className="metadata-row flex items-start justify-between gap-4 border-b border-[var(--page-border-soft)] pb-2">
              <dt className="text-[var(--page-label)]">READING TIME:</dt>
              <dd>{readingTime}</dd>
            </div>
            <div className="metadata-row flex items-start justify-between gap-4 border-b border-[var(--page-border-soft)] pb-2">
              <dt className="text-[var(--page-label)]">CATEGORIES:</dt>
              <dd>
                <span className="inline-block border border-[var(--page-chip-border)] px-2 py-0.5 text-xs">
                  {topic}
                </span>
              </dd>
            </div>
          </dl>

          {otherPostsInTopic.length > 0 ? (
            <div className="mt-8">
              <p className="border-b border-[var(--page-border)] pb-2 text-xs tracking-wide text-[var(--page-muted)]">
                /OTHER POSTS
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {otherPostsInTopic.map((related) => (
                  <li key={related.slug} className="border-b border-[var(--page-border-soft)] pb-3 last:border-b-0 last:pb-0">
                    <Link
                      href={`/blog/${related.slug}`}
                      className="block font-sans font-semibold leading-snug text-[var(--page-text)] hover:text-[var(--page-link-hover)]"
                    >
                      {related.title}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--page-muted)]">{formatDate(related.date)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <p className="shrink-0 text-xs leading-none text-[var(--page-label)]">SHARE:</p>
            <div className="flex items-center gap-0.5">
              <SharePostTrigger expanded={shareOpen} onClick={() => setShareOpen(true)} />
              <CopyPostUrlButton url={shareUrl} />
            </div>
            <SharePostModal
              isOpen={shareOpen}
              onClose={() => setShareOpen(false)}
              title={title}
              shareUrl={shareUrl}
              slug={slug}
            />
          </div>
        </aside>

        <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(220px,300px)]">
          <div className="min-w-0">
            <p className="border-b border-[var(--page-border)] pb-2 text-xs tracking-wide text-[var(--page-muted)]">
              /ARTICLE
            </p>
            <div
              ref={articleRef}
              className="article-content mt-6 max-w-5xl"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          {toc.length > 0 ? (
            <aside className="lg:sticky lg:top-[var(--nav-stack)] lg:h-fit lg:self-start">
              <ArticleToc nodes={toc} />
            </aside>
          ) : null}
        </div>
      </section>
    </article>
  );
}
