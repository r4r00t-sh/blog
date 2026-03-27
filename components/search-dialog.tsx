"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import type { PostMeta } from "@/lib/post-types";
import { formatDate } from "@/lib/post-types";

type SearchDialogProps = {
  posts: PostMeta[];
  isOpen: boolean;
  onClose: () => void;
};

export function SearchDialog({ posts, isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useRef(
    new Fuse(posts, {
      keys: [
        { name: "title", weight: 0.5 },
        { name: "summary", weight: 0.3 },
        { name: "topic", weight: 0.2 },
      ],
      threshold: 0.35,
      includeScore: true,
    })
  );

  // Update fuse index when posts change
  useEffect(() => {
    fuse.current = new Fuse(posts, {
      keys: [
        { name: "title", weight: 0.5 },
        { name: "summary", weight: 0.3 },
        { name: "topic", weight: 0.2 },
      ],
      threshold: 0.35,
      includeScore: true,
    });
  }, [posts]);

  const results = query.trim()
    ? fuse.current.search(query).map((r) => r.item)
    : posts;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close search"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search posts"
        className="relative z-[201] w-full max-w-lg border border-[var(--page-border)] bg-[var(--page-surface)] shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[var(--page-border)] px-4 py-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0 text-[var(--page-muted)]"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--page-text)] placeholder:text-[var(--page-muted)] outline-none"
          />
          <kbd className="hidden shrink-0 border border-[var(--page-border-soft)] px-1.5 py-0.5 text-[10px] text-[var(--page-muted)] sm:inline">
            ESC
          </kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[var(--page-muted)]">
              No posts found.
            </li>
          ) : (
            results.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  onClick={onClose}
                  className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-[var(--page-row-hover-bg)]"
                >
                  <span className="text-sm font-medium text-[var(--page-text-strong)]">
                    {post.title}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-[var(--page-muted)]">
                    <span>{formatDate(post.date)}</span>
                    <span>/</span>
                    <span>{post.topic}</span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
