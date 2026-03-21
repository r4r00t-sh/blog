import GithubSlugger from "github-slugger";
import type { Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export type TocNode = {
  id: string;
  text: string;
  depth: number;
  children: TocNode[];
};

function nestTocFlat(flat: { id: string; text: string; depth: number }[]): TocNode[] {
  const root: TocNode[] = [];
  const stack: TocNode[] = [];

  for (const item of flat) {
    const node: TocNode = { id: item.id, text: item.text, depth: item.depth, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }

  return root;
}

/** Headings h2–h6 from markdown; ids match `rehype-slug` on the rendered HTML. */
export function extractTocFromMarkdown(markdown: string): TocNode[] {
  const tree = remark().use(remarkGfm).parse(markdown) as Root;
  const slugger = new GithubSlugger();
  const flat: { id: string; text: string; depth: number }[] = [];

  visit(tree, "heading", (node: Heading) => {
    if (node.depth < 2) {
      return;
    }
    const text = toString(node).trim();
    if (!text) {
      return;
    }
    flat.push({ depth: node.depth, text, id: slugger.slug(text) });
  });

  return nestTocFlat(flat);
}
