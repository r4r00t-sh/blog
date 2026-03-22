"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

const fabTabClass =
  "touch-manipulation border border-[var(--page-border)] bg-[var(--page-surface)] text-[var(--page-label)] shadow-lg backdrop-blur-sm transition-[color,background-color,box-shadow] hover:text-[var(--page-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function PostMetadataBlock({
  heroVisible,
  title,
  date,
  author,
  readingTime,
  topic,
  otherPostsInTopic,
  shareUrl,
  shareOpen,
  setShareOpen,
  header,
}: {
  heroVisible: boolean;
  title: string;
  date: string;
  author: string;
  readingTime: string;
  topic: string;
  otherPostsInTopic: PostMeta[];
  shareUrl: string;
  shareOpen: boolean;
  setShareOpen: (open: boolean) => void;
  header?: ReactNode;
}) {
  return (
    <>
      {header}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          heroVisible ? "max-h-0 opacity-0" : "mb-5 max-h-[200px] opacity-100"
        }`}
      >
        <h2
          id="sidebar-title"
          className="font-sans text-2xl font-extrabold leading-tight tracking-tight xl:text-[30px]"
        >
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
              <li
                key={related.slug}
                className="border-b border-[var(--page-border-soft)] pb-3 last:border-b-0 last:pb-0"
              >
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
      </div>
    </>
  );
}

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
  const titleWords = useMemo(() => title.trim().split(/\s+/).filter(Boolean), [title]);
  const [heroVisible, setHeroVisible] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileMetaOpen, setMobileMetaOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const articleRef = useArticleSyntaxHighlight(`${slug}:${contentHtml.length}`);

  const anyMobileDrawer = mobileMetaOpen || mobileTocOpen;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => {
      if (mq.matches) {
        setMobileMetaOpen(false);
        setMobileTocOpen(false);
      }
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (!anyMobileDrawer) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyMobileDrawer]);

  useEffect(() => {
    if (!anyMobileDrawer) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMetaOpen(false);
        setMobileTocOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [anyMobileDrawer]);

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

  const openMeta = () => {
    setMobileTocOpen(false);
    setMobileMetaOpen(true);
  };

  const openToc = () => {
    setMobileMetaOpen(false);
    setMobileTocOpen(true);
  };

  const metaBlockProps = {
    heroVisible,
    title,
    date,
    author,
    readingTime,
    topic,
    otherPostsInTopic,
    shareUrl,
    shareOpen,
    setShareOpen,
  };

  return (
    <article className={`${inter.variable} bg-[var(--page-surface)] text-[var(--page-text)]`}>
      <section className="relative py-8 sm:py-12 md:py-16">
        <span className="post-marker left-2 top-3 sm:left-4 sm:top-4" aria-hidden="true" />
        <span className="post-marker right-2 top-3 sm:right-4 sm:top-4" aria-hidden="true" />
        <span className="post-marker bottom-3 left-2 sm:bottom-4 sm:left-4" aria-hidden="true" />
        <span className="post-marker bottom-3 right-2 sm:bottom-4 sm:right-4" aria-hidden="true" />
        <h1
          id="hero-title"
          className="flex flex-wrap items-baseline justify-start gap-x-[0.22em] gap-y-1 text-left text-[clamp(2rem,9vw,3.75rem)] font-black uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl md:gap-y-0 lg:text-8xl xl:text-[92px]"
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

      <section className="grid grid-cols-1 gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:py-12">
        <aside className="hidden lg:sticky lg:block lg:top-[var(--nav-stack)] lg:h-fit lg:self-start">
          <PostMetadataBlock {...metaBlockProps} />
        </aside>

        <div className="grid min-w-0 grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(220px,300px)]">
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
            <aside className="hidden lg:sticky lg:block lg:top-[var(--nav-stack)] lg:h-fit lg:self-start">
              <ArticleToc nodes={toc} />
            </aside>
          ) : null}
        </div>
      </section>

      <SharePostModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        shareUrl={shareUrl}
        slug={slug}
      />

      {/* Mobile / tablet: floating edge tabs + slide-over panels (< lg) */}
      <div className="lg:hidden">
        {anyMobileDrawer ? (
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[1px]"
            aria-label="Close panel"
            onClick={() => {
              setMobileMetaOpen(false);
              setMobileTocOpen(false);
            }}
          />
        ) : null}

        {!mobileMetaOpen ? (
          <button
            type="button"
            aria-expanded={mobileMetaOpen}
            aria-controls="post-mobile-meta-panel"
            className={`fixed left-0 top-[32vh] z-[70] flex h-[5.5rem] w-10 items-center justify-center rounded-r-2xl border-l-0 ${fabTabClass}`}
            onClick={openMeta}
          >
            <span className="select-none text-[10px] font-bold uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
              Info
            </span>
          </button>
        ) : null}

        {toc.length > 0 && !mobileTocOpen ? (
          <button
            type="button"
            aria-expanded={mobileTocOpen}
            aria-controls="post-mobile-toc-panel"
            className={`fixed right-0 top-[32vh] z-[70] flex h-[5.5rem] w-10 items-center justify-center rounded-l-2xl border-r-0 ${fabTabClass}`}
            onClick={openToc}
          >
            <span className="select-none text-[10px] font-bold uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
              Toc
            </span>
          </button>
        ) : null}

        <div
          id="post-mobile-meta-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-mobile-meta-heading"
          className={`fixed inset-y-0 left-0 z-[80] flex w-[min(19.5rem,calc(100vw-2.5rem))] max-w-full flex-col pt-[var(--nav-stack)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-2 pr-1 transition-transform duration-300 ease-out ${
            mobileMetaOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-r-2xl border border-[var(--page-border)] bg-[var(--page-surface)] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--page-border-soft)] px-4 py-3">
              <h2
                id="post-mobile-meta-heading"
                className="text-xs font-semibold uppercase tracking-wide text-[var(--page-text-strong)]"
              >
                Details
              </h2>
              <button
                type="button"
                onClick={() => setMobileMetaOpen(false)}
                className="border border-[var(--page-chip-border)] px-2 py-1 text-[11px] text-[var(--page-muted)] transition-colors hover:border-[var(--page-hover-border)] hover:text-[var(--page-text)]"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <PostMetadataBlock
                {...metaBlockProps}
                header={
                  <p className="mb-3 text-[11px] text-[var(--page-muted)] lg:hidden">
                    Metadata, related posts, and share.
                  </p>
                }
              />
            </div>
          </div>
        </div>

        {toc.length > 0 ? (
          <div
            id="post-mobile-toc-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-mobile-toc-heading"
            className={`fixed inset-y-0 right-0 z-[80] flex w-[min(19.5rem,calc(100vw-2.5rem))] max-w-full flex-col pt-[var(--nav-stack)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-1 pr-2 transition-transform duration-300 ease-out ${
              mobileTocOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-l-2xl border border-[var(--page-border)] bg-[var(--page-surface)] shadow-2xl">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--page-border-soft)] px-4 py-3">
                <h2
                  id="post-mobile-toc-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--page-text-strong)]"
                >
                  On this page
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(false)}
                  className="border border-[var(--page-chip-border)] px-2 py-1 text-[11px] text-[var(--page-muted)] transition-colors hover:border-[var(--page-hover-border)] hover:text-[var(--page-text)]"
                >
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <ArticleToc nodes={toc} onItemClick={() => setMobileTocOpen(false)} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
