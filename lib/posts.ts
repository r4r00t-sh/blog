import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import type { Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { extractTocFromMarkdown, type TocNode } from "@/lib/markdown-toc";
import type { SiteUiThemeId } from "@/lib/site-theme";
import { PostMeta, type Difficulty } from "@/lib/post-types";

const postsDirectory = path.join(process.cwd(), "content/posts");

type PrettyCodeShikiTheme = "github-light" | "gruvbox-light-medium" | "gruvbox-dark-medium";

function shikiThemeForSiteUi(siteUi: SiteUiThemeId | undefined): PrettyCodeShikiTheme {
  if (siteUi === "gruvbox-dark") {
    return "gruvbox-dark-medium";
  }
  if (siteUi === "gruvbox-light") {
    return "gruvbox-light-medium";
  }
  return "github-light";
}

export type Post = PostMeta & {
  contentHtml: string;
  readingTime: string;
  toc: TocNode[];
};

function parseDateValue(date: string): number {
  return new Date(date).getTime();
}

function calculateReadingTime(markdown: string): string {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function getPostSlugs(): string[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

/** Same topic as the current post, excluding it, newest first, capped at `limit`. */
export function getOtherPostsInTopic(currentSlug: string, topic: string, limit: number): PostMeta[] {
  return getSortedPostsData()
    .filter((post) => post.slug !== currentSlug && post.topic === topic)
    .slice(0, limit);
}

export function getSortedPostsData(): PostMeta[] {
  const slugs = getPostSlugs();

  const posts = slugs.map((slug) => {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    const meta: PostMeta = {
      slug,
      title: String(data.title),
      date: String(data.date),
      author: String(data.author),
      topic: String(data.topic),
      summary: String(data.summary),
    };

    if (data.difficulty) {
      meta.difficulty = String(data.difficulty) as Difficulty;
    }
    if (data.series) {
      meta.series = String(data.series);
      if (data.seriesPart != null) {
        meta.seriesPart = Number(data.seriesPart);
      }
    }

    return meta;
  });

  return posts.sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));
}

/** All posts in the same series, sorted by seriesPart. */
export function getSeriesPosts(seriesName: string): PostMeta[] {
  return getSortedPostsData()
    .filter((p) => p.series === seriesName)
    .sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0));
}

export async function getPostData(slug: string, siteUiTheme?: SiteUiThemeId): Promise<Post> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const prettyCodeOptions = {
    theme: shikiThemeForSiteUi(siteUiTheme),
    keepBackground: true,
    bypassInlineCode: true,
  } satisfies PrettyCodeOptions;

  const toc = extractTocFromMarkdown(content);

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processedContent.toString();

  const post: Post = {
    slug,
    title: String(data.title),
    date: String(data.date),
    author: String(data.author),
    topic: String(data.topic),
    summary: String(data.summary),
    contentHtml,
    readingTime: calculateReadingTime(content),
    toc,
  };

  if (data.difficulty) {
    post.difficulty = String(data.difficulty) as Difficulty;
  }
  if (data.series) {
    post.series = String(data.series);
    if (data.seriesPart != null) {
      post.seriesPart = Number(data.seriesPart);
    }
  }

  return post;
}
