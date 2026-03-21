import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PostPageContent } from "@/components/post-page-content";
import { getOtherPostsInTopic, getPostData, getPostSlugs, getSortedPostsData } from "@/lib/posts";
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

export function generateMetadata({ params }: PostPageParams) {
  const post = getSortedPostsData().find((entry) => entry.slug === params.slug);
  if (!post) {
    return { title: "Post not found" };
  }
  return {
    title: `${post.title} | r4r00t blog`,
    description: post.summary,
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
    />
  );
}
