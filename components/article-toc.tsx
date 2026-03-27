"use client";

import { useEffect, useState } from "react";
import type { TocNode } from "@/lib/markdown-toc";

function flattenIds(nodes: TocNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children.length > 0) {
      ids.push(...flattenIds(node.children));
    }
  }
  return ids;
}

function TocBranch({
  nodes,
  depth,
  activeId,
  onItemClick,
}: {
  nodes: TocNode[];
  depth: number;
  activeId: string | null;
  onItemClick?: () => void;
}) {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <ul
      className={
        depth === 0
          ? "toc-root space-y-2"
          : "toc-children ml-0 mt-2 space-y-1.5 border-l border-[var(--page-border-soft)] pl-3.5"
      }
      role="list"
    >
      {nodes.map((node) => {
        const isActive = node.id === activeId;
        return (
          <li key={node.id} className="relative">
            <a
              href={`#${node.id}`}
              onClick={onItemClick}
              className={`block font-sans text-[13px] font-medium leading-snug tracking-wide transition-colors duration-200 md:text-sm ${
                isActive
                  ? "text-[var(--accent)] font-semibold"
                  : "text-[var(--page-muted)] hover:text-[var(--page-link-hover)]"
              }`}
            >
              {node.text}
            </a>
            {node.children.length > 0 ? (
              <TocBranch nodes={node.children} depth={depth + 1} activeId={activeId} onItemClick={onItemClick} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

type ArticleTocProps = {
  nodes: TocNode[];
  /** e.g. close mobile drawer after choosing a section */
  onItemClick?: () => void;
};

export function ArticleToc({ nodes, onItemClick }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const ids = flattenIds(nodes);
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -65% 0px",
        threshold: 0,
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [nodes]);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents" className="toc-panel">
      <p className="border-b border-[var(--page-border)] pb-2 text-[13px] font-semibold tracking-wide text-[var(--page-muted)] md:text-sm">
        /CONTENTS
      </p>
      <div className="mt-5 pr-1">
        <TocBranch nodes={nodes} depth={0} activeId={activeId} onItemClick={onItemClick} />
      </div>
    </nav>
  );
}
