# Personal Blog (Next.js 14 + Markdown)

A stripe.dev-inspired personal blog built with:

- Next.js 14 App Router
- Tailwind CSS
- Markdown posts in `content/posts`
- Static generation for all post pages

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Content Model

All blog content lives in `content/posts/*.md`.

Required frontmatter fields:

- `title`
- `date` (ISO format like `2026-03-21`)
- `author`
- `topic`
- `summary`

## Deploy to Vercel (Free Tier)

1. Create a GitHub repository and push this project:

```bash
git init
git add .
git commit -m "Initial blog"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and click **Add New... > Project**.
3. Import the GitHub repository.
4. Keep default settings (Framework preset: **Next.js**).
5. No environment variables are needed.
6. Click **Deploy**.

After deployment, Vercel gives you a public URL instantly.
