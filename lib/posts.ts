import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import type { Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import type { SiteUiThemeId } from "@/lib/site-theme";
import { PostMeta } from "@/lib/post-types";

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

    return {
      slug,
      title: String(data.title),
      date: String(data.date),
      author: String(data.author),
      topic: String(data.topic),
      summary: String(data.summary),
    };
  });

  return posts.sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));
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

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: String(data.title),
    date: String(data.date),
    author: String(data.author),
    topic: String(data.topic),
    summary: String(data.summary),
    contentHtml,
    readingTime: calculateReadingTime(content),
  };
}
