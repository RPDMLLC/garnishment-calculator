# GarnishmentCalculator.com — Static Site

Zero-dependency static site generator. Every page is pre-built HTML.

## Structure
- `build.cjs` — the entire build: reads data, renders pages, writes `dist/`
- `lib/site.cjs` — page templates and site data logic
- `src/data/states.json` — all 50 states' garnishment law data
- `src/data/blogs.json` — all blog articles (title, meta, HTML content)
- `templates/base.html` — the HTML shell (head tags, placeholders)
- `public/` — files copied to the site as-is (CSS, favicon, PDFs, verification)
- `dist/` — build output (never edit; regenerated every build)

## Build
    node build.cjs
Output goes to `dist/` (~150 pages, <1 second).

## Publish a new blog article
Add an entry to `src/data/blogs.json` (slug, title, metaDescription, category,
publishDate, readTime, content as HTML string), rebuild, push. Cloudflare Pages
rebuilds and deploys automatically on push.

## Cloudflare Pages settings
- Build command: `node build.cjs`
- Output directory: `dist`
- Redirects and headers are generated into `dist/_redirects` and `dist/_headers`
