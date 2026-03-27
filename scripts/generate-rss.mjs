import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "../content/posts");
const publicDir = path.join(__dirname, "../public");

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

const siteName = "r4r00t blog";
const siteDescription =
  "System internals, malware research, and kernel work.";

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
const posts = files
  .map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
    const { data } = matter(raw);
    return {
      slug,
      title: String(data.title ?? ""),
      date: String(data.date ?? ""),
      summary: String(data.summary ?? ""),
      topic: String(data.topic ?? ""),
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const items = posts
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.topic)}</category>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`
  )
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(publicDir, "feed.xml"), rss, "utf8");
console.log(`RSS: wrote ${posts.length} items to public/feed.xml`);
