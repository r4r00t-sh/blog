import type { TocNode } from "@/lib/markdown-toc";

function TocBranch({ nodes, depth }: { nodes: TocNode[]; depth: number }) {
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
      {nodes.map((node) => (
        <li key={node.id} className="relative">
          <a
            href={`#${node.id}`}
            className="block font-sans text-[13px] font-medium leading-snug tracking-wide text-[var(--page-muted)] transition-colors hover:text-[var(--page-link-hover)] md:text-sm"
          >
            {node.text}
          </a>
          {node.children.length > 0 ? <TocBranch nodes={node.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

type ArticleTocProps = {
  nodes: TocNode[];
};

export function ArticleToc({ nodes }: ArticleTocProps) {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents" className="toc-panel">
      <p className="border-b border-[var(--page-border)] pb-2 text-[13px] font-semibold tracking-wide text-[var(--page-muted)] md:text-sm">
        /CONTENTS
      </p>
      <div className="mt-5 pr-1">
        <TocBranch nodes={nodes} depth={0} />
      </div>
    </nav>
  );
}
