#!/usr/bin/env node
/**
 * GarnishmentCalculator.com — static site generator
 * Usage: node build.cjs
 * Output: dist/ (upload anywhere, or let Cloudflare Pages run this on push)
 *
 * Every page is written as a complete, final HTML file. No server, no process,
 * no runtime state. What you see in dist/ is exactly what visitors get.
 */
const fs = require('fs');
const path = require('path');
const site = require('./lib/site.cjs');

const ROOT = __dirname;
const DIST = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const JUNK = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    try {
      if (entry.isDirectory()) { cleanDir(p); fs.rmdirSync(p); }
      else fs.unlinkSync(p);
    } catch (err) { /* skip locked junk files (cloud sync artifacts) */ }
  }
}

// blog/article pages carry the SPA bundle stripped (same as production behavior):
// renderTemplate  -> includes the client app (calculator pages need it)
// renderStaticTemplate -> plain HTML only
const PAGES = [
  { file: 'index.html',          page: site.buildHomePage(),       mode: 'app' },
  { file: 'states.html',         page: site.buildStatesPage(),     mode: 'app' },
  { file: 'about.html',          page: site.buildAboutPage(),      mode: 'app' },
  { file: 'contact.html',        page: site.buildContactPage(),    mode: 'turnstile' },
  { file: 'compare.html',        page: site.buildComparePage(),    mode: 'app' },
  { file: 'resources.html',      page: site.buildResourcesPage(),  mode: 'static' },
  { file: 'guide.html',          page: site.buildGuidePage(),      mode: 'static' },
  { file: 'disclosure.html',     page: site.buildDisclosurePage(), mode: 'static' },
  { file: 'privacy-policy.html', page: site.buildPrivacyPage(),    mode: 'app' },
  { file: 'terms.html',          page: site.buildTermsPage(),      mode: 'app' },
  { file: '404.html',            page: site.buildNotFoundPage('/404'), mode: 'app' },
  { file: 'blog.html',           page: site.buildBlogIndexPage(),  mode: 'app' },
];

function write(relPath, content) {
  const target = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function render({ page, mode }) {
  if (mode === 'turnstile') {
    // static page + the Turnstile anti-spam widget loader
    return site.renderStaticTemplate(page)
      .replace('</body>', '  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>\n  </body>');
  }
  if (mode === 'calc') {
    // static page + the standalone calculator widget (no React bundle)
    return site.renderStaticTemplate(page)
      .replace('</body>', '  <script src="/assets/calc.js" defer></script>\n  </body>');
  }
  return mode === 'static' ? site.renderStaticTemplate(page) : site.renderTemplate(page);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (JUNK.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

// ---- build ----
const t0 = Date.now();
cleanDir(DIST);

// 1. static assets
copyDir(PUBLIC, DIST);

// 2. fixed pages
for (const entry of PAGES) write(entry.file, render(entry));

// 3. state calculator pages (50) — served static with the clean calc widget
for (const state of site.stateList) {
  write(`${state.slug}-wage-garnishment-calculator.html`,
    render({ page: site.buildStatePage(state), mode: 'calc' }));
}

// 3b. calculator bundle: shared math + UI, one file, zero dependencies
write(path.join('assets', 'calc.js'),
  fs.readFileSync(path.join(ROOT, 'lib', 'garnish-math.cjs'), 'utf8') + '\n' +
  fs.readFileSync(path.join(ROOT, 'lib', 'calc-ui.js'), 'utf8'));

// 4. blog articles (85+) — 'app' mode matches production (client app handles article routes)
for (const blog of site.blogs) {
  write(path.join('blog', `${blog.slug}.html`),
    render({ page: site.buildBlogArticlePage(blog), mode: 'app' }));
}

// 5. data file the client app fetches for the blog index (/data/blogs.json)
write(path.join('data', 'blogs.json'),
  fs.readFileSync(path.join(ROOT, 'src', 'data', 'blogs.json'), 'utf8'));

// 6. robots.txt + sitemap.xml
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.SITE_URL}/sitemap.xml\n`);
write('sitemap.xml', site.generateSitemapXml());

// 6. Cloudflare Pages redirects (affiliate links, legacy paths)
const redirects = [
  '/index.html / 301',
  '/legal /terms 301',
  ...Object.entries(site.affiliateRedirects).map(([slug, target]) => `/go/${slug} ${target} 302`),
];
write('_redirects', redirects.join('\n') + '\n');

// 7. Cloudflare Pages headers (security, without breaking anything)
write('_headers', [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: DENY',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '',
].join('\n'));

const pageCount = PAGES.length + site.stateList.length + site.blogs.length;
console.log(`Built ${pageCount} pages + sitemap + robots + redirects in ${Date.now() - t0}ms -> dist/`);
