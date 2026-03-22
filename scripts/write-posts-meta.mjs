import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "../content/posts");
const outFile = path.join(__dirname, "../lib/posts-meta.generated.json");

function parseDateValue(date) {
  return new Date(date).getTime();
}

const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
const list = files.map((file) => {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
  const { data } = matter(raw);
  return {
    slug,
    title: String(data.title ?? ""),
    date: String(data.date ?? ""),
    author: String(data.author ?? ""),
    summary: String(data.summary ?? ""),
  };
});

list.sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));
fs.writeFileSync(outFile, `${JSON.stringify(list, null, 2)}\n`, "utf8");
console.log(`Wrote ${list.length} posts to lib/posts-meta.generated.json`);
