import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PostPageContent } from "@/components/post-page-content";
import { getOtherPostsInTopic, getPostData, getPostSlugs, getSortedPostsData } from "@/lib/posts";
import { getSiteUrl } from "@/lib/site-url";
import { parseSiteUiThemeFromCookie, SITE_UI_THEME_STORAGE_KEY } from "@/lib/site-theme";

export const dynamic = "force-dynamic";

type PostPageParams = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PostPageParams): Metadata {
  const post = getSortedPostsData().find((entry) => entry.slug === params.slug);
  if (!post) {
    return { title: "Post not found" };
  }

  const path = `/blog/${post.slug}`;
  let publishedTime: string | undefined;
  const parsed = new Date(post.date);
  if (!Number.isNaN(parsed.getTime())) {
    publishedTime = parsed.toISOString();
  }

  const base = getSiteUrl();

  return {
    metadataBase: new URL(base),
    title: `${post.title} | r4r00t blog`,
    description: post.summary,
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      url: path,
      siteName: "R4R00T",
      title: post.title,
      description: post.summary,
      ...(publishedTime ? { publishedTime } : {}),
      authors: [post.author],
      images: [
        {
          url: `${path}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Post preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function PostPage({ params }: PostPageParams) {
  const slug = params.slug;
  if (!getPostSlugs().includes(slug)) {
    notFound();
  }

  const cookieTheme = parseSiteUiThemeFromCookie(cookies().get(SITE_UI_THEME_STORAGE_KEY)?.value);
  const post = await getPostData(slug, cookieTheme);
  const otherPostsInTopic = getOtherPostsInTopic(slug, post.topic, 3);
  const shareUrl = `${getSiteUrl()}/blog/${slug}`;

  return (
    <PostPageContent
      slug={post.slug}
      title={post.title}
      date={post.date}
      author={post.author}
      readingTime={post.readingTime}
      topic={post.topic}
      contentHtml={post.contentHtml}
      toc={post.toc}
      otherPostsInTopic={otherPostsInTopic}
      shareUrl={shareUrl}
    />
  );
}
