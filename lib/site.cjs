const fs = require('fs');
const path = require('path');

const SITE_URL = (process.env.SITE_URL || 'https://garnishmentcalculator.com').replace(/\/$/, '');
const KIT_FORM_ACTION = '/api/subscribe';
const GUIDE_DOWNLOAD_PATH = process.env.GUIDE_DOWNLOAD_PATH || '/downloads/wage-garnishment-survival-guide.pdf';
const GUIDE_REDIRECT_URL = `${SITE_URL}/guide`;
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'base.html');
const BLOGS_PATH = path.join(ROOT, 'src', 'data', 'blogs.json');
const STATES_PATH = path.join(ROOT, 'src', 'data', 'states.json');
const ABOUT_PATH = path.join(ROOT, 'templates', 'about.html');
const CONTACT_PATH = path.join(ROOT, 'templates', 'contact.html');
const BRIDGE_PAGE_ROUTES = new Map([
  ['/resources/credit-repair-after-garnishment', path.join(PUBLIC_DIR, 'resources', 'credit-repair-after-garnishment.html')],
  ['/resources/government-assistance-after-debt', path.join(PUBLIC_DIR, 'resources', 'government-assistance-after-debt.html')]
]);
const BLOG_API_KEY = process.env.BLOG_API_KEY || 'gc-blog-api-2026-dm';

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const blogs = JSON.parse(fs.readFileSync(BLOGS_PATH, 'utf8'));
const stateData = JSON.parse(fs.readFileSync(STATES_PATH, 'utf8'));

const stateList = Object.values(stateData).sort((a, b) => a.name.localeCompare(b.name));
const stateMapByRouteSlug = new Map(
  stateList.map((state) => [`${state.slug}-wage-garnishment-calculator`, state])
);
const blogMap = new Map(blogs.map((blog) => [blog.slug, blog]));

const featuredStates = [
  'california',
  'florida',
  'texas',
  'new-york',
  'new-jersey',
  'illinois',
  'pennsylvania',
  'georgia',
  'ohio',
  'north-carolina',
  'michigan',
  'virginia'
].map((slug) => stateList.find((state) => state.slug === slug)).filter(Boolean);

const staticPageLastMod = new Date().toISOString().slice(0, 10);
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/states', label: 'All States' },
  { href: '/compare', label: 'Compare' },
  { href: '/blog', label: 'Blog' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' }
];

const resourceCategories = [
  {
    id: 'credit-repair-priority',
    title: 'Stop Garnishment & Repair Credit (Top Pick)',
    intro: 'If a garnishment is already hitting your paycheck, the damage to your credit report usually follows close behind. The resource below is a do-it-yourself credit repair system designed for people who want to clean up their credit fast without paying a monthly service. It is highlighted here because credit recovery is the single most common next step after a garnishment episode.',
    cards: [
      {
        name: 'Credit Repair Magic',
        description: 'A step-by-step, do-it-yourself credit repair system that walks you through disputing inaccurate items on your credit reports with the three major bureaus. Built for people who want to take action themselves rather than pay a recurring credit repair fee.',
        bestFor: 'Best for people whose credit took a hit from collections, charge-offs, or a garnishment and who want a self-guided way to rebuild their credit profile quickly.',
        href: '/resources/credit-repair-after-garnishment',
        affiliate: true
      }
    ]
  },
  {
    id: 'debt-relief',
    title: 'Debt Relief',
    intro: 'For many people, wage garnishment starts with credit card debt, personal loans, medical collections, or old charge-offs. Debt settlement and consolidation services aim to reduce balances, negotiate structured repayment, or simplify multiple unsecured debts into a more manageable plan. They are most relevant when the garnishment is tied to consumer debt rather than child support or tax enforcement.',
    cards: [
      {
        name: 'National Debt Relief',
        description: 'A well-known debt relief provider that focuses on helping consumers negotiate unsecured debt and create a structured path out of collection pressure.',
        bestFor: 'Best for people dealing with large unsecured debt balances and looking for a guided settlement approach.',
        href: '/go/national-debt-relief',
        affiliate: true
      },
      {
        name: 'Accredited Debt Relief',
        description: 'Debt relief option for consumers exploring settlement or consolidation-style support after falling behind on credit cards, loans, or other unsecured accounts.',
        bestFor: 'Best for people who want to compare another debt relief provider before choosing a program.',
        href: '/go/accredited-debt-relief',
        affiliate: true
      },
      {
        name: 'Lesko Help (Grant & Benefit Finder)',
        description: 'Membership community built around Matthew Lesko\'s research that helps people search for government grants, benefits, and assistance programs that may offset financial hardship. Useful when income is tight and the household is looking for any legitimate relief beyond a settlement program.',
        bestFor: 'Best for people under financial pressure who want to identify grant, benefit, or hardship programs they may qualify for while dealing with garnishment or debt.',
        href: '/resources/government-assistance-after-debt',
        affiliate: true
      }
    ]
  },
  {
    id: 'tax-relief',
    title: 'Tax Relief',
    intro: 'Tax levies and IRS collection actions follow different rules than ordinary consumer debt garnishments. Tax resolution services help people respond to notices, negotiate payment arrangements, request penalty relief, or evaluate whether other settlement or hardship options may apply. They can be useful when the pressure comes from the IRS or a state taxing authority.',
    cards: [
      {
        name: 'Community Tax',
        description: 'Tax resolution service focused on helping people respond to IRS problems, back-tax balances, levies, and collection notices.',
        bestFor: 'Best for people dealing with IRS levy risk, tax debt notices, or existing tax collection actions.',
        href: '/go/community-tax',
        affiliate: true
      }
    ]
  },
  {
    id: 'legal-help',
    title: 'Legal Help',
    intro: 'Legal help is appropriate when there is an active lawsuit, a default judgment, a dispute over service or identity, an exemption issue, or a need for document review. Some situations need more than general education and call for a legal professional who can evaluate deadlines, filings, objections, and enforcement procedures.',
    cards: [
      {
        name: 'Upside Legal',
        description: 'Legal help option geared toward debt collection and consumer dispute situations where a lawsuit, judgment, or creditor pressure may already be in play.',
        bestFor: 'Best for people facing debt collection disputes, creditor harassment concerns, or court-related collection issues.',
        href: '/go/upside-legal',
        affiliate: true
      },
      {
        name: 'Rocket Lawyer',
        description: 'Broad legal-service platform that can help with document review, letters, and access to legal support for certain consumer situations.',
        bestFor: 'Best for people who need general legal documents, basic attorney access, or a lower-friction legal starting point.',
        href: '/go/rocket-lawyer',
        affiliate: true
      }
    ]
  },
  {
    id: 'credit-repair',
    title: 'Credit Repair & Rebuilding',
    intro: 'After a garnishment crisis, many people shift from damage control to recovery. Credit rebuilding can include dispute support, on-time payment structure, secured or builder products, and slow re-establishment of positive history. The goal is not instant repair but steady recovery after the immediate withholding problem is addressed.',
    cards: [
      {
        name: 'The Credit People',
        description: 'Credit repair brand focused on helping consumers review credit reports, identify issues, and work through a structured rebuilding process.',
        bestFor: 'Best for people trying to clean up credit report damage after collections, defaults, or a garnishment episode.',
        href: '/go/the-credit-people',
        affiliate: true
      },
      {
        name: 'Self',
        description: 'Credit-building product designed to help users establish payment history while rebuilding credit habits over time.',
        bestFor: 'Best for people who need a disciplined, step-by-step credit rebuilding tool after financial setbacks.',
        href: '/go/self',
        affiliate: true
      }
    ]
  },
  {
    id: 'payroll-hr',
    title: 'Payroll & HR Compliance',
    intro: 'Employers receiving garnishment orders must calculate withholding correctly, respect federal and state limits, track remittance requirements, and avoid retaliation or procedural mistakes. Payroll systems can reduce compliance risk by helping businesses manage calculations, orders, and employee payroll records more consistently.',
    cards: [
      {
        name: 'Gusto',
        description: 'Payroll and HR software for businesses that need a modern system to handle payroll processing, employee records, and compliance workflows.',
        bestFor: 'Best for employers that want a more automated payroll workflow while managing wage withholding responsibilities.',
        href: '/go/gusto',
        affiliate: true
      },
      {
        name: 'Patriot Software',
        description: 'Payroll platform for small businesses looking for a practical way to manage payroll runs, employee data, and compliance tasks.',
        bestFor: 'Best for smaller employers that need a straightforward payroll tool for handling ongoing withholding obligations.',
        href: '/go/patriot-software',
        affiliate: true
      }
    ]
  },
  {
    id: 'budgeting-tools',
    title: 'Budgeting & Financial Tools',
    intro: 'Not every next step should be a paid service. Sometimes the smartest move is understanding your cash flow, comparing protected income rules, and reading through your options before making a financial decision. This section stays educational and points back to the site resources that can help you plan more carefully.',
    cards: [
      {
        name: 'Use the Calculator First',
        description: 'Start by estimating how much of your paycheck may be exposed so you have a clearer picture before calling any provider or making a settlement decision.',
        bestFor: 'Best for people who need to understand the numbers before choosing a next step.',
        href: '/',
        affiliate: false
      },
      {
        name: 'Review Your State Page',
        description: 'Check your state-specific rules, exemptions, and minimum-wage baseline so you know whether local law provides stronger protection than the federal rule.',
        bestFor: 'Best for people who need state-by-state context before deciding what to do next.',
        href: '/states',
        affiliate: false
      },
      {
        name: 'Read More Guides',
        description: 'Use the educational library to review garnishment rules, exemptions, debt topics, and employer-side compliance questions in plain English.',
        bestFor: 'Best for people who want more education before speaking with a provider.',
        href: '/blog',
        affiliate: false
      },
      {
        name: 'SparkReceipt',
        description: 'Receipt scanning and expense tracking app that helps individuals and small business owners organize financial records, track deductible expenses, and stay on top of cash flow.',
        bestFor: 'Best for people who want a simple way to track spending and receipts while managing tight budgets during or after a garnishment situation.',
        href: '/go/sparkreceipt',
        affiliate: true
      },
      {
        name: 'CalendarBudget',
        description: 'Visual budgeting tool that maps income and expenses onto a calendar so you can see exactly when money comes in and goes out throughout the month.',
        bestFor: 'Best for people who need a clear, day-by-day view of their cash flow to plan around garnishment deductions and avoid overdrafts.',
        href: '/go/calendarbudget',
        affiliate: true
      }
    ]
  }
];

// Affiliate redirect map: /go/<slug> -> external destination
const affiliateRedirects = {
  // ClickBank HopLinks (new)
  'credit-repair-magic': 'https://733f23ljn9zm2o1at6n4b-9lfq.hop.clickbank.net',
  'lesko-help': 'https://c61de5jds7uoctejfdvdqfog4f.hop.clickbank.net',
  // Live affiliate programs
  'sparkreceipt': 'https://sparkreceipt.com/?ref=robert8d',
  'calendarbudget': 'https://calendarbudget.com?via=robert33',
  // Pending affiliates (placeholder: vendor home page until tracking links are approved)
  'national-debt-relief': 'https://www.nationaldebtrelief.com/',
  'accredited-debt-relief': 'https://www.accrediteddebtrelief.com/',
  'community-tax': 'https://www.communitytax.com/',
  'upside-legal': 'https://www.upsidelegal.com/',
  'rocket-lawyer': 'https://www.rocketlawyer.com/',
  'the-credit-people': 'https://www.thecreditpeople.com/',
  'self': 'https://www.self.inc/',
  'gusto': 'https://gusto.com/',
  'patriot-software': 'https://www.patriotsoftware.com/'
};

// (Express middleware removed - static build)


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(value) {
  return String(value ?? '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength) {
  const text = stripTags(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function formatMoney(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
}

function formatDate(value) {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return escapeHtml(String(value));
  }
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function isoDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return staticPageLastMod;
  }
  return parsed.toISOString().slice(0, 10);
}

function buildCanonical(pathname) {
  if (!pathname || pathname === '/') {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}${pathname}`;
}

function safeJsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function normalizeStandaloneContent(value) {
  return String(value || '')
    .replace(/\bform-input\b/g, 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100')
    .replace(/\bbtn-submit\b/g, 'inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700')
    .replace(/\bsuccess-msg\b/g, 'hidden')
    .replace(/\bmobile-menu\b/g, 'hidden');
}

function readStandaloneContent(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const mainMatch = raw.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const selected = mainMatch && stripTags(mainMatch[1]) ? mainMatch[1] : bodyMatch ? bodyMatch[1] : raw;
  return normalizeStandaloneContent(
    selected
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--([\s\S]*?)-->/g, '')
      .replace(/\son[a-z]+=("[^"]*"|'[^']*')/gi, '')
      .replace(/Advertisement/gi, '')
      .replace(/<div data-loc="client\/src\/components\/AdPlaceholder\.tsx:36"[^>]*>\s*<div data-loc="client\/src\/components\/AdPlaceholder\.tsx:54"[^>]*>\s*<span data-loc="client\/src\/components\/AdPlaceholder\.tsx:57"[^>]*>.*?<\/span>\s*<\/div>\s*<\/div>/gis, '')
      .trim()
  );
}

const aboutContent = readStandaloneContent(ABOUT_PATH);
const contactContent = readStandaloneContent(CONTACT_PATH);

function buildOptInBlock({ headline, subtext, buttonText = 'Get the Guide', inputId, compact = false }) {
  const wrapperClass = compact
    ? 'rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm'
    : 'rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-teal-800 p-6 shadow-sm ring-1 ring-slate-800 sm:p-8';
  const headingClass = compact
    ? 'text-lg font-semibold text-slate-900'
    : 'text-2xl font-semibold text-white sm:text-3xl';
  const textClass = compact
    ? 'mt-3 text-sm leading-6 text-slate-700'
    : 'mt-4 max-w-3xl text-base leading-7 text-slate-100';
  const buttonClass = compact
    ? 'inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700'
    : 'inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto';
  const inputClass = compact
    ? 'w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100'
    : 'w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-200';
  const noteClass = compact ? 'mt-3 text-xs leading-5 text-slate-600' : 'mt-3 text-xs leading-5 text-slate-200';

  return `
    <section class="${wrapperClass}">
      <h2 class="${headingClass}">${escapeHtml(headline)}</h2>
      <p class="${textClass}">${escapeHtml(subtext)}</p>
      <form action="${escapeHtml(KIT_FORM_ACTION)}" method="post" class="mt-5 ${compact ? 'space-y-3' : 'grid gap-3 lg:grid-cols-[minmax(0,1fr),auto] lg:items-end'}">
        <div>
          <label class="sr-only" for="${escapeHtml(inputId)}">Email address</label>
          <input id="${escapeHtml(inputId)}" name="email_address" type="email" required autocomplete="email" placeholder="you@example.com" class="${inputClass}" />
        </div>
        <div style="position:absolute;left:-9999px" aria-hidden="true"><input type="text" name="company_website" tabindex="-1" autocomplete="off"></div>
        <input type="hidden" name="redirect_url" value="${escapeHtml(GUIDE_REDIRECT_URL)}" />
        <button type="submit" class="${buttonClass}">${escapeHtml(buttonText)}</button>
      </form>
      <p class="${noteClass}">By subscribing, you agree to receive educational emails. You can unsubscribe at any time.</p>
    </section>
  `;
}

function buildRecommendationCard(card) {
  const isAffiliateRedirect = card.affiliate && String(card.href || '').startsWith('/go/');
  const isBridgePage = card.affiliate && String(card.href || '').startsWith('/resources/');
  const ctaAttributes = isAffiliateRedirect
    ? ' target="_blank" rel="nofollow sponsored"'
    : '';
   const buttonClass = card.affiliate
    ? 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition'
    : 'inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100';
  const buttonStyle = card.affiliate ? ' style="background-color:#1d4ed8;"' : '';
  const label = card.affiliate ? 'Learn More' : 'Learn More';
  const helperText = card.affiliate
    ? (isBridgePage ? 'Review the bridge page before visiting the partner offer.' : 'Opens a third-party site.')
    : 'Free educational resource.';
  return `
    <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div class="flex items-start justify-between gap-4">
        <h3 class="text-xl font-semibold text-slate-900">${escapeHtml(card.name)}</h3>
        ${card.affiliate ? '<span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Partner</span>' : '<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">Educational</span>'}
      </div>
      <p class="mt-4 text-sm leading-6 text-slate-700">${escapeHtml(card.description)}</p>
      <p class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"><strong class="text-slate-900">Best for:</strong> ${escapeHtml(card.bestFor)}</p>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <a href="${card.href}" class="${buttonClass}"${buttonStyle}${ctaAttributes}>${label}</a>
        <span class="text-xs text-slate-500">${helperText}</span>
      </div>
    </article>
  `;
}

function buildPageShell({ pathname = '/', eyebrow = 'Garnishment Calculator', title, intro, content, breadcrumb = [] }) {
  const breadcrumbHtml = breadcrumb.length
    ? `<nav aria-label="Breadcrumb" class="text-sm text-slate-400"><ol class="flex flex-wrap gap-2">${breadcrumb.map((item, index) => {
        const isLast = index === breadcrumb.length - 1;
        if (isLast) {
          return `<li aria-current="page" class="font-medium text-slate-200">${escapeHtml(item.label)}</li>`;
        }
        return `<li><a class="text-teal-400 hover:underline" href="${item.href}">${escapeHtml(item.label)}</a><span class="mx-2 text-slate-500">/</span></li>`;
      }).join('')}</ol></nav>`
    : '';

  const headerNavHtml = navLinks
    .map((link) => {
      const isActive = pathname === link.href;
      return `<a href="${link.href}" class="rounded-full px-2.5 py-1.5 text-sm font-medium transition ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}">${escapeHtml(link.label)}</a>`;
    })
    .join('');

  return `
    <!-- v9 -->
    <div class="min-h-screen bg-slate-50 text-slate-900">
      <header class="bg-white border-b border-slate-200">
        <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <a href="/" class="flex items-center gap-3" style="text-decoration:none;">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg></div>
              <div>
                <span class="text-lg font-bold text-slate-900">GarnishmentCalc</span>
                <p class="text-[11px] text-slate-500 uppercase tracking-widest">State-by-State Wage Garnishment Laws</p>
              </div>
            </a>
            <nav aria-label="Primary" class="flex flex-wrap items-center gap-1">${headerNavHtml}</nav>
          </div>
        </div>
      </header>
      <div class="bg-slate-800 pb-10 pt-6">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          ${breadcrumbHtml}
          <div class="mt-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 shadow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
            <p class="text-sm font-semibold uppercase tracking-widest text-teal-400">${escapeHtml(eyebrow)}</p>
          </div>
          <h1 class="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">${escapeHtml(title)}</h1>
          ${intro ? `<p class="mt-3 max-w-3xl text-base leading-7 text-slate-300">${escapeHtml(intro)}</p>` : ''}
        </div>
      </div>
      <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section>${content}</section>
      </main>
      <footer class="border-t border-slate-200 bg-white">
        <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
            <p class="text-sm font-semibold text-amber-900"><strong>Legal Disclaimer:</strong> The information on this site is for educational purposes only and is not legal, tax, or financial advice. This site does not constitute the practice of law. Wage garnishment laws vary by state and change frequently. You should always consult with a qualified attorney or licensed professional before making financial or legal decisions related to your situation.</p>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-slate-600">
            <a href="/states" class="hover:underline">States</a>
            <a href="/blog" class="hover:underline">Blog</a>
            <a href="/about" class="hover:underline">About</a>
            <a href="/contact" class="hover:underline">Contact</a>
            <a href="/compare" class="hover:underline">Compare</a>
            <a href="/privacy-policy" class="hover:underline">Privacy Policy</a>
            <a href="/resources" class="hover:underline">Resources</a>
            <a href="/disclosure" class="hover:underline">Disclosure</a>
          </div>
          <p class="mt-4 max-w-4xl text-xs leading-6 text-slate-500">© 2026 Garnishment Calculator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `;
}

function renderTemplate({ title, description, canonical, content, jsonLd, robots = 'index,follow' }) {
  return template
    .replace(/__PAGE_TITLE__/g, escapeHtml(title))
    .replace(/__META_DESCRIPTION__/g, escapeHtml(description))
    .replace(/__CANONICAL_URL__/g, escapeHtml(canonical))
    .replace(/__OG_TITLE__/g, escapeHtml(title))
    .replace(/__OG_DESCRIPTION__/g, escapeHtml(description))
    .replace(/__OG_URL__/g, escapeHtml(canonical))
    .replace(/__ROBOTS__/g, escapeHtml(robots))
    .replace(/__JSON_LD__/g, jsonLd || '')
    .replace(/__SSR_APP__/g, content.replace(/Advertisement/gi, '').replace(/<div data-loc="client\/src\/components\/AdPlaceholder\.tsx:36"[^>]*>\s*<div data-loc="client\/src\/components\/AdPlaceholder\.tsx:54"[^>]*>\s*<span data-loc="client\/src\/components\/AdPlaceholder\.tsx:57"[^>]*>.*?<\/span>\s*<\/div>\s*<\/div>/gis, ''));
}

// Static template strips the React SPA client JS so the SSR content is not overridden
const staticTemplate = template.replace(/<script type="module"[^>]*src="\/assets\/index-[^"]+\.js"[^>]*><\/script>/g, '');

function renderStaticTemplate({ title, description, canonical, content, jsonLd, robots = 'index,follow' }) {
  return staticTemplate
    .replace(/__PAGE_TITLE__/g, escapeHtml(title))
    .replace(/__META_DESCRIPTION__/g, escapeHtml(description))
    .replace(/__CANONICAL_URL__/g, escapeHtml(canonical))
    .replace(/__OG_TITLE__/g, escapeHtml(title))
    .replace(/__OG_DESCRIPTION__/g, escapeHtml(description))
    .replace(/__OG_URL__/g, escapeHtml(canonical))
    .replace(/__ROBOTS__/g, escapeHtml(robots))
    .replace(/__JSON_LD__/g, jsonLd || '')
    .replace(/__SSR_APP__/g, content);
}

function sendHtml(res, page, statusCode = 200) {
  res.status(statusCode).type('html').send(renderTemplate(page));
}

function sendStaticHtml(res, page, statusCode = 200) {
  res.status(statusCode).type('html').send(renderStaticTemplate(page));
}

function buildHomePage() {
  const title = 'Wage Garnishment Calculator by State | Garnishment Calculator';
  const description = 'Calculate wage garnishment limits by state, review creditor rules, and browse guides covering child support, student loans, tax levies, and consumer debt.';
  const canonical = buildCanonical('/');

  const featuredCards = featuredStates.map((state) => `
    <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 class="text-xl font-semibold text-slate-900"><a class="hover:underline" href="/${state.slug}-wage-garnishment-calculator">${escapeHtml(state.name)} Wage Garnishment Calculator</a></h2>
      <p class="mt-3 text-sm leading-6 text-slate-700">${escapeHtml(truncateText(state.introContent || state.specialNotes, 180))}</p>
      <dl class="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div><dt class="font-semibold text-slate-900">Consumer debt cap</dt><dd>${escapeHtml(`${state.consumerDebtPercent}% of disposable earnings`)}</dd></div>
        <div><dt class="font-semibold text-slate-900">Student loans</dt><dd>${escapeHtml(`${state.studentLoanPercent}% administrative garnishment cap`)}</dd></div>
      </dl>
    </article>
  `).join('');

  const homepageOptIn = buildOptInBlock({
    headline: 'Get the Free Wage Garnishment Survival Guide',
    subtext: 'A step-by-step guide with state-by-state limits, your rights, and an action checklist. Created by someone who\'s been through it.',
    buttonText: 'Send Me the Guide',
    inputId: 'home-guide-email'
  });

  const content = buildPageShell({
    pathname: '/',
    eyebrow: 'Wage Garnishment Basics',
    title: 'Wage Garnishment Calculator and 50-State Law Guides',
    intro: 'Estimate garnishment exposure, review state-specific wage protection rules, and find plain-English articles that explain how consumer debt, child support, tax levies, and federal student loan garnishment work.',
    content: `
      <div class="grid gap-6 lg:grid-cols-[1.45fr,0.95fr]">
        <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-2xl font-semibold text-slate-900">What this calculator covers</h2>
          <p class="mt-4 text-base leading-7 text-slate-700">This site helps workers understand how much of their paycheck can legally be garnished, compare federal and state wage garnishment rules, and use a free calculator built on each state's limits.</p>
          <ul class="mt-5 space-y-3 text-base leading-7 text-slate-700">
            <li><strong class="text-slate-900">Consumer debt:</strong> 25% of disposable earnings or the amount above the applicable protected threshold, whichever is less.</li>
            <li><strong class="text-slate-900">Child support:</strong> 50% to 65% depending on support obligations and arrears.</li>
            <li><strong class="text-slate-900">Federal student loans:</strong> administrative garnishment up to 15% of disposable earnings.</li>
            <li><strong class="text-slate-900">Tax levies:</strong> governed by separate federal or state levy formulas.</li>
          </ul>
        </section>
        <aside class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-2xl font-semibold text-slate-900">Start with a state guide</h2>
          <p class="mt-4 text-base leading-7 text-slate-700">Browse state-specific pages to see the statutory reference, minimum wage baseline, head-of-household protection status, and special rules before opening the calculator interface.</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <a href="/states" class="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">View all states</a>
            <a href="/blog" class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100">Read the blog</a>
          </div>
        </aside>
      </div>
      <div class="mt-8">${homepageOptIn}</div>
      <section class="mt-8">
        <h2 class="text-2xl font-semibold text-slate-900">Featured state calculators</h2>
        <div class="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">${featuredCards}</div>
      </section>
    `,
    breadcrumb: [{ label: 'Home', href: '/' }]
  });

  const jsonLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Garnishment Calculator',
    url: canonical,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/blog/{search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });

  return { title, description, canonical, content, jsonLd };
}

function buildStatesPage() {
  const title = '50-State Wage Garnishment Laws and Calculators';
  const description = 'Browse all 50 state wage garnishment calculator pages, including consumer debt caps, child support rules, minimum wage references, and special protections.';
  const canonical = buildCanonical('/states');
  const cards = stateList.map((state) => `
    <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 class="text-xl font-semibold text-slate-900"><a class="hover:underline" href="/${state.slug}-wage-garnishment-calculator">${escapeHtml(state.name)} (${escapeHtml(state.abbreviation)})</a></h2>
      <p class="mt-3 text-sm leading-6 text-slate-700">${escapeHtml(truncateText(state.introContent || state.specialNotes, 165))}</p>
      <dl class="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div><dt class="font-semibold text-slate-900">Consumer debt</dt><dd>${escapeHtml(`${state.consumerDebtPercent}% / ${state.consumerDebtMinimumWageMultiplier}x minimum wage rule`)}</dd></div>
        <div><dt class="font-semibold text-slate-900">Head of household</dt><dd>${state.headOfHouseholdProtection ? 'Additional state protection available' : 'No extra state-level protection listed'}</dd></div>
      </dl>
    </article>
  `).join('');

  const content = buildPageShell({
    pathname: '/states',
    eyebrow: 'State Directory',
    title: 'State Wage Garnishment Calculator Pages',
    intro: 'Select your state to see its garnishment limits, exemptions, and a calculator based on that state&#39;s rules. Some states protect far more of your paycheck than federal law does.',
    content: `<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">${cards}</div>`,
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'States', href: '/states' }
    ]
  });

  const jsonLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: canonical,
    description
  });

  return { title, description, canonical, content, jsonLd };
}

function buildStatePage(state) {
  const pathname = `/${state.slug}-wage-garnishment-calculator`;
  const title = state.metaTitle || `${state.name} Wage Garnishment Calculator`;
  const description = state.metaDescription || truncateText(state.introContent || state.specialNotes, 155);
  const canonical = buildCanonical(pathname);
  const protectionList = Array.isArray(state.keyProtections) ? state.keyProtections : [];
  const links = [
    { label: 'All states', href: '/states' },
    { label: 'Blog guides', href: '/blog' },
    { label: 'Recommended resources', href: '/resources' }
  ];

  const nearbyStates = stateList
    .filter((item) => item.slug !== state.slug)
    .slice(0, 3)
    .map((item) => `<li><a class="text-blue-700 hover:underline" href="/${item.slug}-wage-garnishment-calculator">${escapeHtml(item.name)} wage garnishment calculator</a></li>`)
    .join('');

  const sidebarOptIn = buildOptInBlock({
    headline: 'Free Garnishment Guide',
    subtext: 'Get the free guide with state limits, your rights, and practical next steps.',
    buttonText: 'Get the Guide',
    inputId: `${state.slug}-guide-email`,
    compact: true
  });

  const content = buildPageShell({
    pathname,
    eyebrow: `${state.abbreviation} Garnishment Law`,
    title: `${state.name} Wage Garnishment Calculator`,
    intro: stripTags(state.introContent || state.specialNotes),
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'States', href: '/states' },
      { label: state.name, href: pathname }
    ],
    content: `
      <div class="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section class="space-y-6">
          ${buildCalculatorSection(state)}
          <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 class="text-2xl font-semibold text-slate-900">Key ${escapeHtml(state.name)} garnishment facts</h2>
            <div class="mt-5 overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <tbody class="divide-y divide-slate-200">
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">State abbreviation</th><td class="py-3">${escapeHtml(state.abbreviation)}</td></tr>
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">Consumer debt limit</th><td class="py-3">${escapeHtml(state.consumerDebtLimitText || (state.consumerDebtPercent === 0 ? 'Wage garnishment for consumer debts is prohibited under state law' : `${state.consumerDebtPercent}% of disposable earnings, subject to the ${state.consumerDebtMinimumWageMultiplier}x minimum wage test`))}</td></tr>
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">Child support limit</th><td class="py-3">${escapeHtml(`${state.childSupportPercentCurrent}% if supporting another family, ${state.childSupportPercentSingle}% otherwise, plus ${state.childSupportArrearsExtra}% for arrears`)}</td></tr>
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">Federal student loans</th><td class="py-3">${escapeHtml(`${state.studentLoanPercent}% administrative garnishment cap`)}</td></tr>
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">State minimum wage</th><td class="py-3">${formatMoney(state.stateMinimumWage)}</td></tr>
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">Minimum wage source used in calculator</th><td class="py-3">${state.usesStateMinWage ? `${escapeHtml(state.name)} minimum wage` : 'Federal minimum wage baseline'}</td></tr>
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">Head of household protection</th><td class="py-3">${state.headOfHouseholdProtection ? 'Yes' : 'No additional protection listed'}</td></tr>
                  <tr><th scope="row" class="py-3 pr-4 font-semibold text-slate-900">Statute reference</th><td class="py-3">${escapeHtml(state.statuteReference || 'See state statutes and applicable federal law')}</td></tr>
                </tbody>
              </table>
            </div>
          </article>
          <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 class="text-2xl font-semibold text-slate-900">Additional notes</h2>
            <p class="mt-4 text-base leading-7 text-slate-700">${escapeHtml(state.specialNotes || `${state.name} generally follows federal garnishment limits unless a more protective state rule applies.`)}</p>
            <p class="mt-4 text-base leading-7 text-slate-700"><strong class="text-slate-900">Tax levy note:</strong> ${escapeHtml(state.taxLevyNote || 'Tax levies use separate statutory withholding rules.')}</p>
          </article>
          <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 class="text-2xl font-semibold text-slate-900">Key protections and reminders</h2>
            <ul class="mt-4 space-y-3 text-base leading-7 text-slate-700">
              ${protectionList.map((item) => `<li>• ${escapeHtml(item)}</li>`).join('')}
            </ul>
          </article>
          ${buildStateWorkedExample(state)}
          ${buildStateFaq(state)}
        </section>
        <aside class="space-y-6">
          <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 class="text-xl font-semibold text-slate-900">Helpful links</h2>
            <ul class="mt-4 space-y-3 text-sm text-slate-700">
              ${links.map((link) => `<li><a class="text-blue-700 hover:underline" href="${link.href}">${escapeHtml(link.label)}</a></li>`).join('')}
            </ul>
          </section>
          ${sidebarOptIn}
          <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 class="text-xl font-semibold text-slate-900">Explore more calculators</h2>
            <ul class="mt-4 space-y-3 text-sm text-slate-700">${nearbyStates}</ul>
          </section>
        </aside>
      </div>
    `
  });

  const jsonLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: canonical,
    description,
    about: {
      '@type': 'Thing',
      name: `${state.name} wage garnishment law`
    }
  });

  return { title, description, canonical, content, jsonLd };
}

function buildBlogIndexPage() {
  const title = 'Wage Garnishment Blog and Articles';
  const description = 'Read wage garnishment guides covering state laws, debt collection defenses, exemptions, employer process, and strategies to stop or reduce garnishment.';
  const canonical = buildCanonical('/blog');
  const cards = blogs
    .slice()
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
    .map((blog) => `
      <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p class="text-sm text-slate-500">${escapeHtml(formatDate(blog.publishDate))} • ${escapeHtml(blog.category || 'Guide')} • ${escapeHtml(blog.readTime || '')}</p>
        <h2 class="mt-2 text-xl font-semibold text-slate-900"><a class="hover:underline" href="/blog/${blog.slug}">${escapeHtml(blog.title)}</a></h2>
        <p class="mt-3 text-sm leading-6 text-slate-700">${escapeHtml(blog.excerpt || truncateText(blog.content, 180))}</p>
      </article>
    `).join('');

  const content = buildPageShell({
    pathname: '/blog',
    eyebrow: 'Education Center',
    title: 'Wage Garnishment Blog',
    intro: 'Plain-English guides on wage garnishment laws, exemptions, negotiating with creditors, and rebuilding after debt — updated for 2026.',
    content: `<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">${cards}</div>`,
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' }
    ]
  });

  const jsonLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: title,
    url: canonical,
    description
  });

  return { title, description, canonical, content, jsonLd };
}

function buildBlogArticlePage(blog) {
  const pathname = `/blog/${blog.slug}`;
  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || blog.excerpt || truncateText(blog.content, 155);
  const canonical = buildCanonical(pathname);
  const articleOptIn = buildOptInBlock({
    headline: 'Dealing with wage garnishment?',
    subtext: 'Download the free survival guide — your rights, state limits, and next steps.',
    buttonText: 'Get the Free Guide',
    inputId: `blog-${blog.slug}-guide-email`
  });

  const content = buildPageShell({
    pathname,
    eyebrow: blog.category || 'Article',
    title: blog.title,
    intro: blog.excerpt || truncateText(blog.content, 220),
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: blog.title, href: pathname }
    ],
    content: `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div class="flex flex-wrap gap-3 text-sm text-slate-500">
          <span>${escapeHtml(formatDate(blog.publishDate))}</span>
          ${blog.category ? `<span>• ${escapeHtml(blog.category)}</span>` : ''}
          ${blog.readTime ? `<span>• ${escapeHtml(blog.readTime)}</span>` : ''}
        </div>
        <div class="prose prose-slate mt-6 max-w-none">${String(blog.content || '')}</div>
      </article>
      <div class="mt-8">${articleOptIn}</div>
    `
  });

  const jsonLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description,
    datePublished: isoDate(blog.publishDate),
    dateModified: isoDate(blog.publishDate),
    mainEntityOfPage: canonical,
    author: {
      '@type': 'Person',
      name: 'Bobby Perez',
      url: `${SITE_URL}/about`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Garnishment Calculator',
      url: SITE_URL
    }
  });

  return { title, description, canonical, content, jsonLd };
}

function buildAboutPage() {
  const title = 'About Garnishment Calculator';
  const description = 'Learn what Garnishment Calculator does, how state wage garnishment information is organized, and how the site helps workers understand withholding limits.';
  const canonical = buildCanonical('/about');
  const content = buildPageShell({
    pathname: '/about',
    eyebrow: 'About',
    title: 'About Garnishment Calculator',
    intro: 'This page explains the purpose of the calculator, the educational content on the site, and the role of state-by-state wage garnishment references.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' }
    ],
    content: `
      <div class="grid gap-6 lg:grid-cols-3">
        <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <h2 class="text-2xl font-semibold text-slate-900">Who We Are</h2>
          <p class="mt-4 text-base leading-7 text-slate-700">Garnishment Calculator was created to make a confusing, stressful topic easier to understand in plain English. The site was built by someone who personally experienced wage garnishment and wanted to create the resource they wish had existed at the time: clear explanations, practical tools, and state-by-state guidance without the corporate spin.</p>
          <p class="mt-4 text-base leading-7 text-slate-700">The goal is simple: help people understand what garnishment rules generally say, where state law can matter, and what kinds of next steps may be worth researching before making a decision.</p>
        </article>
        <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-xl font-semibold text-slate-900">Important note</h2>
          <p class="mt-4 text-sm leading-6 text-slate-700">This site is educational only. It does not provide legal advice, financial advice, or tax advice, and it is not a law firm or government agency.</p>
        </article>
      </div>
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-2xl font-semibold text-slate-900">Editorial Standards</h2>
          <p class="mt-4 text-base leading-7 text-slate-700">Content is researched using statutory references, government materials, court or agency guidance when available, and cross-checking across multiple sources before publication. The aim is to translate those materials into plain language without overstating certainty or replacing professional advice.</p>
          <p class="mt-4 text-base leading-7 text-slate-700">When a rule depends on case-specific facts, filing deadlines, employer procedures, or changing agency guidance, the content is written to make those limits clear rather than pretending every situation has a one-size-fits-all answer.</p>
        </article>
        <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-2xl font-semibold text-slate-900">Update Policy</h2>
          <p class="mt-4 text-base leading-7 text-slate-700">Pages are reviewed periodically and updated when laws, thresholds, formulas, or explanatory guidance change. Corrections and clarifications may also be made when readers identify issues or when source materials are revised.</p>
          <p class="mt-4 text-base leading-7 text-slate-700">Because garnishment rules can change, readers should still verify current statutes, court procedures, and agency rules before relying on any summary as a final answer.</p>
        </article>
      </div>

    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }) };
}

function buildContactPage() {
  const title = 'Contact Garnishment Calculator';
  const description = 'Contact Garnishment Calculator for general website inquiries and educational content questions.';
  const canonical = buildCanonical('/contact');
  const fallbackContact = `
    <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <h2 class="text-2xl font-semibold text-slate-900">Contact</h2>
      <p class="mt-4 text-base leading-7 text-slate-700">For general website questions, corrections, or content-related inquiries, email <a href="mailto:contact@garnishmentcalculator.com" class="text-blue-700 hover:underline">contact@garnishmentcalculator.com</a>.</p>
    </div>
  `;
  const content = buildPageShell({
    pathname: '/contact',
    eyebrow: 'Contact',
    title: 'Contact Garnishment Calculator',
    intro: 'Use this page for general website contact information and content-related inquiries.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Contact', href: '/contact' }
    ],
    content: `
      <article class="rounded-2xl bg-white p-0 shadow-sm ring-1 ring-slate-200 sm:p-0 prose prose-slate max-w-none">
        <div class="not-prose p-6 sm:p-8">
          ${contactContent || fallbackContact}
        </div>
      </article>
    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }) };
}

function buildComparePage() {
  const title = 'Compare Wage Garnishment Rules by State';
  const description = 'Compare how wage garnishment rules vary by state, debt type, protected earnings threshold, and special exemptions.';
  const canonical = buildCanonical('/compare');
  const content = buildPageShell({
    pathname: '/compare',
    eyebrow: 'Comparison Guide',
    title: 'Compare Wage Garnishment Rules',
    intro: 'State law can change how much of a paycheck is exposed, which minimum wage threshold applies, and whether added protections exist for heads of household or specific income sources.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Compare', href: '/compare' }
    ],
    content: `
      <div class="grid gap-6 lg:grid-cols-2">
        <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-2xl font-semibold text-slate-900">What changes from one state to another</h2>
          <ul class="mt-4 space-y-3 text-base leading-7 text-slate-700">
            <li>• Whether the federal minimum wage or a state minimum wage baseline protects more income.</li>
            <li>• Whether a head-of-household exemption or similar family-status protection applies.</li>
            <li>• Whether state statutes impose extra procedural requirements before employers can withhold wages.</li>
            <li>• Whether special notes apply to tax levies, child support orders, and administrative garnishment.</li>
          </ul>
        </article>
        <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-2xl font-semibold text-slate-900">Use the state pages for exact details</h2>
          <p class="mt-4 text-base leading-7 text-slate-700">Each state page summarizes the consumer debt limit, child support percentages, federal student loan cap, statutory reference, and a plain-English explanation of special protections. After the client app loads, users can run the interactive calculator with those same underlying law values.</p>
          <p class="mt-4"><a href="/states" class="font-semibold text-blue-700 hover:underline">Browse all 50 state pages</a></p>
        </article>
      </div>
    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }) };
}

function buildResourcesPage() {
  const title = 'Recommended Resources for Wage Garnishment, Debt Relief, and Payroll Compliance';
  const description = 'Browse carefully selected resources related to debt relief, tax resolution, legal help, credit rebuilding, payroll compliance, and financial recovery after wage garnishment.';
  const canonical = buildCanonical('/resources');

  const startHereCards = [
    {
      title: 'Stop garnishment and repair credit (start here)',
      text: 'Before anything else, see the top-pick do-it-yourself credit repair resource for people whose credit has been hit by collections, charge-offs, or a garnishment.',
      href: '#credit-repair-priority'
    },
    {
      title: 'Consumer debt garnishment',
      text: 'If the garnishment is tied to credit cards, personal loans, medical debt, or collections, start with debt relief resources.',
      href: '#debt-relief'
    },
    {
      title: 'IRS or tax levy concerns',
      text: 'If tax notices or levy actions are part of the problem, go directly to tax relief options.',
      href: '#tax-relief'
    },
    {
      title: 'Lawsuit or dispute issues',
      text: 'If there is a court case, exemption problem, or active dispute, legal help may be more appropriate than a settlement pitch.',
      href: '#legal-help'
    },
    {
      title: 'Rebuilding after garnishment',
      text: 'If the worst part is over and the focus is recovery, look at credit rebuilding resources.',
      href: '#credit-repair'
    },
    {
      title: 'Employer compliance',
      text: 'If you are handling a wage order as an employer or payroll administrator, start with payroll and HR compliance tools.',
      href: '#payroll-hr'
    },
    {
      title: 'General money planning',
      text: 'If you need to slow down and get organized first, use the educational budgeting and planning section.',
      href: '#budgeting-tools'
    }
  ].map((item) => `
    <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 class="text-lg font-semibold text-slate-900"><a href="${item.href}" class="hover:underline">${escapeHtml(item.title)}</a></h3>
      <p class="mt-3 text-sm leading-6 text-slate-700">${escapeHtml(item.text)}</p>
      <p class="mt-4"><a href="${item.href}" class="text-sm font-semibold text-blue-700 hover:underline">Go to section</a></p>
    </article>
  `).join('');

  const categorySections = resourceCategories.map((category) => `
    <section id="${category.id}" class="rounded-2xl bg-slate-100/70 p-1">
      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 class="text-2xl font-semibold text-slate-900">${escapeHtml(category.title)}</h2>
        <p class="mt-4 max-w-4xl text-base leading-7 text-slate-700">${escapeHtml(category.intro)}</p>
        <div class="mt-6 grid gap-5 lg:grid-cols-2 ${category.cards.length === 1 ? 'max-w-2xl' : ''}">
          ${category.cards.map((card) => buildRecommendationCard(card)).join('')}
        </div>
      </div>
    </section>
  `).join('');

  const content = buildPageShell({
    pathname: '/resources',
    eyebrow: 'Resource Center',
    title,
    intro: 'Hand-picked services and tools for people dealing with garnishment, debt, or payroll compliance. Some links are affiliate partnerships — see the disclosure below.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Resources', href: '/resources' }
    ],
    content: `
      <p class="text-sm text-slate-500 italic">Some links on this page are affiliate links. We may earn a commission at no extra cost to you. <a href="/disclosure" class="text-blue-700 hover:underline">Full disclosure</a>.</p>
      <section class="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 class="text-2xl font-semibold text-slate-900">Start Here</h2>
        <p class="mt-4 max-w-4xl text-base leading-7 text-slate-700">Choose the section that best matches your situation. The right next step depends on whether the issue is consumer debt, taxes, a lawsuit, post-garnishment recovery, or employer payroll compliance.</p>
        <div class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">${startHereCards}</div>
      </section>
      <div class="mt-8 space-y-8">${categorySections}</div>
      <section class="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 class="text-2xl font-semibold text-slate-900">Frequently asked questions</h2>
        <div class="mt-6 space-y-5">
          <article class="rounded-2xl bg-slate-50 p-5">
            <h3 class="text-lg font-semibold text-slate-900">Are these paid recommendations?</h3>
            <p class="mt-3 text-sm leading-6 text-slate-700">Some are. When a link is an affiliate link, the site may receive compensation if you choose to use the service. That does not increase your price, and it does not mean you need to use the recommendation.</p>
          </article>
          <article class="rounded-2xl bg-slate-50 p-5">
            <h3 class="text-lg font-semibold text-slate-900">Do I have to use these services?</h3>
            <p class="mt-3 text-sm leading-6 text-slate-700">No. The site is educational first. You can use the calculator, review state pages, and read guides without using any provider listed here.</p>
          </article>
          <article class="rounded-2xl bg-slate-50 p-5">
            <h3 class="text-lg font-semibold text-slate-900">How were these selected?</h3>
            <p class="mt-3 text-sm leading-6 text-slate-700">Selections were based on relevance to the problems people facing garnishment commonly have next: debt relief, tax resolution, legal help, rebuilding credit, employer payroll compliance, and basic financial recovery planning.</p>
          </article>
        </div>
      </section>
      <section class="mt-8 rounded-2xl border border-slate-200 bg-slate-100 p-6 shadow-sm">
        <p class="text-sm leading-6 text-slate-700">Footer disclaimer: Garnishment Calculator is independently operated and is not affiliated with National Debt Relief, Accredited Debt Relief, Community Tax, Upside Legal, Rocket Lawyer, The Credit People, Self, Gusto, Patriot Software, or any other provider referenced on this page. Always review the provider\'s own terms, pricing, and eligibility requirements before signing up.</p>
      </section>
    `
  });

  const jsonLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: title,
        url: canonical,
        description
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Are these paid recommendations?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Some links on the resources page are affiliate links, which means the site may receive compensation if a visitor chooses to use a recommended service. This does not increase the visitor\'s cost.'
            }
          },
          {
            '@type': 'Question',
            name: 'Do I have to use these services?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Visitors can use the calculator, browse state pages, and read educational content without using any service listed on the page.'
            }
          },
          {
            '@type': 'Question',
            name: 'How were these selected?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Recommendations are selected based on relevance to common wage garnishment needs such as debt relief, tax resolution, legal help, credit rebuilding, payroll compliance, and financial recovery.'
            }
          }
        ]
      }
    ]
  });

  return { title, description, canonical, content, jsonLd };
}

function buildGuidePage() {
  const title = 'Download the Wage Garnishment Survival Guide';
  const description = 'Thank you for subscribing. Download the wage garnishment survival guide and review your next steps.';
  const canonical = buildCanonical('/guide');
  const content = buildPageShell({
    pathname: '/guide',
    eyebrow: 'Free Guide',
    title: 'Thanks for subscribing',
    intro: 'Your free Wage Garnishment Survival Guide is ready. Use the download link below, then take the next step that matches your situation.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Guide', href: '/guide' }
    ],
    content: `
      <div class="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 class="text-2xl font-semibold text-slate-900">Download your guide</h2>
          <p class="mt-4 text-base leading-7 text-slate-700">This guide is intended to help you understand basic wage garnishment limits, your rights, and practical next steps to review.</p>
          <div class="mt-6">
            <a href="${GUIDE_DOWNLOAD_PATH}" class="inline-flex items-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800">Download the Survival Guide PDF</a>
          </div>
          <p class="mt-4 text-sm leading-6 text-slate-500">If the file does not start automatically, you can also copy this link: <span class="break-all text-slate-700">${escapeHtml(GUIDE_DOWNLOAD_PATH)}</span></p>
        </article>
        <aside class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 class="text-2xl font-semibold text-slate-900">Next steps</h2>
          <ul class="mt-5 space-y-4 text-base leading-7 text-slate-700">
            <li><a href="/" class="font-semibold text-blue-700 hover:underline">Use the calculator</a> to estimate the withholding issue you may be facing.</li>
            <li><a href="/states" class="font-semibold text-blue-700 hover:underline">Browse state pages</a> to review state-specific protections and statutory references.</li>
            <li><a href="/resources" class="font-semibold text-blue-700 hover:underline">Check the resources page</a> if you need debt relief, tax help, legal support, or employer payroll tools.</li>
          </ul>
        </aside>
      </div>
    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }) };
}

function buildDisclosurePage() {
  const title = 'Affiliate Disclosure | Garnishment Calculator';
  const description = 'Read the Garnishment Calculator affiliate disclosure, including how recommendations are selected and how affiliate compensation works.';
  const canonical = buildCanonical('/disclosure');
  const content = buildPageShell({
    pathname: '/disclosure',
    eyebrow: 'Disclosure',
    title: 'Affiliate Disclosure',
    intro: 'This page explains how affiliate links work on the site and how recommendations are chosen.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Disclosure', href: '/disclosure' }
    ],
    content: `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div class="space-y-6 text-base leading-7 text-slate-700">
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Affiliate links</h2>
            <p class="mt-3">Some links on this website are affiliate links. If you click one of those links and choose to sign up for or purchase a product or service, this site may receive a commission or referral fee.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">No added cost to you</h2>
            <p class="mt-3">Using an affiliate link does not increase your cost. Any compensation comes from the provider, not from an added fee charged to you for clicking through this site.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">How recommendations are selected</h2>
            <p class="mt-3">Recommendations are selected based on relevance to the kinds of problems people dealing with wage garnishment commonly face, including consumer debt, tax issues, legal disputes, credit rebuilding, payroll compliance, and general financial recovery. The goal is to recommend categories and services that fit the audience rather than filling pages with unrelated offers.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Independent operation</h2>
            <p class="mt-3">Garnishment Calculator is independently operated and is not owned by, controlled by, or officially affiliated with any service provider mentioned on the site unless explicitly stated otherwise.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Your choice</h2>
            <p class="mt-3">You are never required to use any recommended service. The calculator, state pages, comparison content, and blog remain available as educational resources whether or not you click an affiliate link.</p>
          </section>
        </div>
      </article>
    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }) };
}

function buildPrivacyPage() {
  const title = 'Privacy Policy | Garnishment Calculator';
  const description = 'Review the Garnishment Calculator privacy policy covering analytics, advertising, cookies, and information handling practices.';
  const canonical = buildCanonical('/privacy-policy');
  const content = buildPageShell({
    pathname: '/privacy-policy',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    intro: 'This policy describes the categories of information the site may collect, how that information is used, and how advertising and analytics services may operate on the website.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Privacy Policy', href: '/privacy-policy' }
    ],
    content: `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div class="space-y-6 text-base leading-7 text-slate-700">
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Information collected</h2>
            <p class="mt-3">The website may collect limited technical information such as IP address, browser type, device data, referral source, and usage activity for analytics, security, and site performance purposes. Interactive calculator inputs are used to generate results in the browser and may also be processed in server logs for routine operations.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">How information is used</h2>
            <p class="mt-3">Information may be used to operate the website, improve content quality, measure traffic, troubleshoot technical issues, prevent abuse, and evaluate advertising performance. The site content is educational and informational and is not legal advice.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Cookies, analytics, and advertising</h2>
            <p class="mt-3">The website may use cookies or similar technologies for analytics and advertising, including services that measure page performance, audience behavior, and ad delivery. Third-party advertising providers may use cookies to personalize or measure ads subject to their own policies.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Third-party links and services</h2>
            <p class="mt-3">Pages may link to third-party resources, articles, or tools. Those external sites operate under their own terms and privacy practices, and this website is not responsible for their content or data handling.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Policy updates</h2>
            <p class="mt-3">This privacy policy may be updated from time to time to reflect changes in website features, legal requirements, or advertising and analytics services. Continued use of the website after changes are posted constitutes acceptance of the updated policy.</p>
          </section>
        </div>
      </article>
    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }) };
}

function buildTermsPage() {
  const title = 'Terms of Service | Garnishment Calculator';
  const description = 'Review the Terms of Service for Garnishment Calculator, including disclaimers, limitations of liability, and acceptable use policies.';
  const canonical = buildCanonical('/terms');
  const content = buildPageShell({
    pathname: '/terms',
    eyebrow: 'Legal',
    title: 'Terms of Service',
    intro: 'Please read these terms carefully before using the Garnishment Calculator website. By accessing or using this site, you agree to be bound by these terms.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Terms of Service', href: '/terms' }
    ],
    content: `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div class="space-y-6 text-base leading-7 text-slate-700">
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Acceptance of Terms</h2>
            <p class="mt-3">By accessing and using garnishmentcalculator.com (the "Website"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use this website. These terms apply to all visitors, users, and others who access the Website.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Educational Purpose Only &mdash; Not Legal Advice</h2>
            <p class="mt-3">The content provided on this website, including all calculator tools, state-specific information, blog articles, and related materials, is for general educational and informational purposes only. Nothing on this website constitutes legal, financial, tax, or professional advice. Wage garnishment laws vary by state and are subject to change. You should always consult a qualified attorney or licensed professional for advice specific to your situation.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Accuracy of Information</h2>
            <p class="mt-3">While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, calculations, or related content on this website. Any reliance you place on such information is strictly at your own risk. Calculator results are estimates based on federal and state guidelines and may not reflect your exact legal situation.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Limitation of Liability</h2>
            <p class="mt-3">In no event shall Garnishment Calculator, its owners, operators, contributors, or affiliates be liable for any direct, indirect, incidental, consequential, special, or exemplary damages arising out of or in connection with your use of this website or reliance on any information provided herein. This includes, without limitation, damages for loss of profits, data, or other intangible losses, even if advised of the possibility of such damages.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Acceptable Use</h2>
            <p class="mt-3">You agree to use this website only for lawful purposes and in a manner that does not infringe upon the rights of others or restrict their use and enjoyment of the site. You may not use this website to transmit harmful code, attempt to gain unauthorized access to any part of the site, or engage in any activity that could damage, disable, or impair the website&rsquo;s functionality.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Intellectual Property</h2>
            <p class="mt-3">All content on this website, including text, graphics, logos, calculator tools, code, and design elements, is the property of Garnishment Calculator or its content suppliers and is protected by United States and international copyright laws. You may not reproduce, distribute, modify, or create derivative works from any content on this site without prior written consent.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Third-Party Links and Advertising</h2>
            <p class="mt-3">This website may contain links to third-party websites and may display advertisements served by third-party advertising networks. We do not control and are not responsible for the content, privacy policies, or practices of any third-party sites or services. The inclusion of any link or advertisement does not imply endorsement by Garnishment Calculator.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Changes to These Terms</h2>
            <p class="mt-3">We reserve the right to modify or replace these Terms of Service at any time without prior notice. Changes become effective immediately upon posting to this page. Your continued use of the website after any changes constitutes acceptance of the new terms. We encourage you to review this page periodically for updates.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Governing Law</h2>
            <p class="mt-3">These Terms of Service shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in the applicable jurisdiction.</p>
          </section>
          <section>
            <h2 class="text-2xl font-semibold text-slate-900">Contact</h2>
            <p class="mt-3">If you have any questions about these Terms of Service, please visit our <a href="/contact" class="text-blue-600 underline hover:text-blue-800">Contact page</a>.</p>
          </section>
        </div>
      </article>
    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }) };
}

function buildNotFoundPage(requestPath) {
  const title = 'Page Not Found | Garnishment Calculator';
  const description = 'The requested page could not be found. Browse the state guides, blog, or return to the homepage.';
  const canonical = buildCanonical(requestPath === '/404' ? '/404' : requestPath || '/404');
  const content = buildPageShell({
    pathname: '/404',
    eyebrow: '404',
    title: 'Page Not Found',
    intro: 'The requested page does not exist or may have moved.',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: '404', href: '/404' }
    ],
    content: `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p class="text-base leading-7 text-slate-700">Try one of the main sections below instead.</p>
        <ul class="mt-4 space-y-3 text-base text-slate-700">
          <li><a class="text-blue-700 hover:underline" href="/">Homepage</a></li>
          <li><a class="text-blue-700 hover:underline" href="/states">State calculators</a></li>
          <li><a class="text-blue-700 hover:underline" href="/blog">Blog articles</a></li>
          <li><a class="text-blue-700 hover:underline" href="/resources">Resources</a></li>
        </ul>
      </article>
    `
  });
  return { title, description, canonical, content, jsonLd: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description }), robots: 'noindex,follow' };
}

function generateSitemapXml() {
  const urls = [];

  const addUrl = (pathname, lastmod) => {
    urls.push({ pathname, lastmod: lastmod || staticPageLastMod });
  };

  addUrl('/');
  addUrl('/states');
  addUrl('/about');
  addUrl('/contact');
  addUrl('/compare');
  addUrl('/resources');
  addUrl('/guide');
  addUrl('/disclosure');
  addUrl('/privacy-policy');
  addUrl('/terms');
  addUrl('/blog');

  for (const state of stateList) {
    addUrl(`/${state.slug}-wage-garnishment-calculator`);
  }

  for (const blog of blogs) {
    addUrl(`/blog/${blog.slug}`, isoDate(blog.publishDate));
  }

  const body = urls.map((entry) => {
    return [
      '  <url>',
      `    <loc>${escapeHtml(buildCanonical(entry.pathname))}</loc>`,
      `    <lastmod>${entry.lastmod}</lastmod>`,
      '  </url>'
    ].join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}


module.exports = {
  SITE_URL,
  stateList,
  blogs,
  affiliateRedirects,
  BRIDGE_PAGE_ROUTES,
  renderTemplate,
  renderStaticTemplate,
  generateSitemapXml,
  buildHomePage,
  buildStatesPage,
  buildStatePage,
  buildBlogIndexPage,
  buildBlogArticlePage,
  buildAboutPage,
  buildContactPage,
  buildComparePage,
  buildResourcesPage,
  buildGuidePage,
  buildDisclosurePage,
  buildPrivacyPage,
  buildTermsPage,
  buildNotFoundPage
};


// ============================================================================
// Calculator widget (server-rendered form; calc.js adds interactivity)
// ============================================================================
function buildCalculatorSection(state) {
  const stateOptions = stateList
    .map((s) => `<option value="${s.slug}"${s.slug === state.slug ? ' selected' : ''}>${escapeHtml(s.name)} (${escapeHtml(s.abbreviation)})</option>`)
    .join('');
  const dataBlob = `<script type="application/json" id="gc-state-data">${JSON.stringify({
    slug: state.slug, name: state.name, abbreviation: state.abbreviation,
    consumerDebtPercent: state.consumerDebtPercent,
    consumerDebtMinimumWageMultiplier: state.consumerDebtMinimumWageMultiplier,
    stateMinimumWage: state.stateMinimumWage, usesStateMinWage: state.usesStateMinWage
  }).replace(/</g, '\\u003c')}</script>`;
  const selClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100';
  return `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 class="text-2xl font-semibold text-slate-900">${escapeHtml(state.name)} Wage Garnishment Calculator</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">Enter your income details to estimate the maximum that can legally be taken from your paycheck under ${escapeHtml(state.name)} and federal rules.</p>
        ${dataBlob}
        <form id="gc-calc-form" class="mt-5 space-y-4">
          <div>
            <label for="gc-gross" class="text-sm font-medium text-slate-900">Gross income per pay period</label>
            <input id="gc-gross" type="number" min="1" step="0.01" inputmode="decimal" placeholder="0.00" required class="mt-1 ${selClass}" />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="gc-freq" class="text-sm font-medium text-slate-900">Pay frequency</label>
              <select id="gc-freq" class="mt-1 ${selClass}">
                <option value="weekly">Weekly</option>
                <option value="biweekly" selected>Bi-weekly (every 2 weeks)</option>
                <option value="semimonthly">Twice a month</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label for="gc-state" class="text-sm font-medium text-slate-900">State</label>
              <select id="gc-state" class="mt-1 ${selClass}">${stateOptions}</select>
            </div>
          </div>
          <div>
            <label for="gc-type" class="text-sm font-medium text-slate-900">Garnishment type</label>
            <select id="gc-type" class="mt-1 ${selClass}">
              <option value="consumer" selected>Consumer debt (credit cards, medical bills, loans)</option>
              <option value="child_support">Child support</option>
              <option value="student_loans">Federal student loans</option>
              <option value="tax_levy">Tax levy (estimate)</option>
            </select>
          </div>
          <div id="gc-cs-options" style="display:none" class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 space-y-2">
            <label class="flex items-center gap-2 text-sm text-slate-700"><input id="gc-cs-family" type="checkbox" checked /> I support another spouse or child</label>
            <label class="flex items-center gap-2 text-sm text-slate-700"><input id="gc-cs-arrears" type="checkbox" /> Payments are more than 12 weeks behind</label>
          </div>
          <button type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">Calculate garnishment</button>
        </form>
        <div id="gc-result" style="display:none" class="mt-6 rounded-xl border border-teal-200 bg-teal-50/40 p-5"></div>
        <noscript><p class="mt-4 text-sm text-slate-600">The interactive calculator needs JavaScript. The worked examples below show the same math at three income levels.</p></noscript>
      </article>`;
}

function buildStateWorkedExample(state) {
  const FED_MIN = 7.25;
  const money = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const weeklyMax = (gross) => {
    const disposable = gross * 0.75;
    if (state.consumerDebtPercent === 0) return 0;
    if (state.slug === 'new-york') return Math.max(0, Math.min(0.10 * gross, 0.25 * disposable, disposable - 30 * FED_MIN));
    if (state.slug === 'illinois') return Math.max(0, Math.min(0.15 * gross, disposable - 45 * state.stateMinimumWage));
    if (state.slug === 'massachusetts') return Math.max(0, Math.min(0.15 * gross, disposable - 50 * FED_MIN));
    const wage = state.usesStateMinWage ? state.stateMinimumWage : FED_MIN;
    return Math.max(0, Math.min((state.consumerDebtPercent / 100) * disposable, disposable - state.consumerDebtMinimumWageMultiplier * wage));
  };
  const rows = [800, 1200, 2000].map((gross) => {
    const disposable = gross * 0.75;
    const max = weeklyMax(gross);
    return `<tr><td class="py-2 pr-4">${money(gross)}</td><td class="py-2 pr-4">${money(disposable)}</td><td class="py-2 pr-4 font-semibold text-slate-900">${state.consumerDebtPercent === 0 ? '$0.00 (prohibited)' : money(max)}</td></tr>`;
  }).join('');
  const intro = state.consumerDebtPercent === 0
    ? `Because ${escapeHtml(state.name)} bars consumer-debt wage garnishment, the answer for credit cards, medical bills, and personal loans is zero at every income level. Child support, taxes, and federal student loans follow the federal rules in the table above instead.`
    : `These weekly examples assume roughly 25% of gross pay goes to legally required deductions; the calculator above lets you use your own numbers and pay schedule.`;
  return `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 class="text-2xl font-semibold text-slate-900">Run the numbers: three ${escapeHtml(state.name)} paychecks</h2>
        <p class="mt-3 text-base leading-7 text-slate-700">${intro}</p>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
            <thead><tr><th class="py-2 pr-4 font-semibold text-slate-900">Gross weekly pay</th><th class="py-2 pr-4 font-semibold text-slate-900">Est. disposable</th><th class="py-2 pr-4 font-semibold text-slate-900">Max consumer-debt garnishment</th></tr></thead>
            <tbody class="divide-y divide-slate-200">${rows}</tbody>
          </table>
        </div>
        <p class="mt-4 text-sm leading-6 text-slate-600">For the full legal picture — process, exemptions, and how to respond — read the companion guide: <a class="text-blue-700 hover:underline" href="/blog/${state.slug}-wage-garnishment-laws-explained">${escapeHtml(state.name)} Wage Garnishment Laws Explained</a>.</p>
      </article>`;
}

function buildStateFaq(state) {
  const FED_MIN = 7.25;
  const money = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const wage = state.usesStateMinWage ? state.stateMinimumWage : FED_MIN;
  const floor = state.consumerDebtMinimumWageMultiplier * wage;
  const safeAnswer = state.consumerDebtPercent === 0
    ? `For consumer debts, all of it — ${escapeHtml(state.name)} does not permit wage garnishment for consumer debts. Child support, federal student loans, and tax debts follow separate federal rules.`
    : `Weekly disposable earnings at or below ${money(floor)} (${state.consumerDebtMinimumWageMultiplier}× the ${state.usesStateMinWage ? escapeHtml(state.name) + ' minimum wage' : 'federal minimum wage'}) cannot be touched for consumer debts, and the percentage cap limits what can be taken above that line.`;
  return `
      <article class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 class="text-2xl font-semibold text-slate-900">Calculator questions, answered</h2>
        <div class="mt-4 space-y-4 text-base leading-7 text-slate-700">
          <div><h3 class="font-semibold text-slate-900">What are “disposable earnings”?</h3>
          <p>Your pay after legally required deductions — federal and state taxes, Social Security, and Medicare. Voluntary deductions like health insurance or 401(k) contributions usually do NOT reduce disposable earnings for garnishment purposes. The calculator estimates deductions at 25% of gross; your paystub has the real figure.</p></div>
          <div><h3 class="font-semibold text-slate-900">How much of my paycheck is completely safe in ${escapeHtml(state.name)}?</h3>
          <p>${safeAnswer}</p></div>
          <div><h3 class="font-semibold text-slate-900">How accurate is this calculator?</h3>
          <p>It applies the current ${escapeHtml(state.name)} and federal formulas to the numbers you enter, but it estimates your deductions and cannot know case-specific court orders. Treat the result as a close estimate, and the court order as the final word. ${escapeHtml(state.taxLevyNote || '')}</p></div>
          <div><h3 class="font-semibold text-slate-900">What if I have more than one garnishment?</h3>
          <p>Federal law caps the combined total, and priority matters: child support first, then tax levies, then other debts. A second creditor generally has to wait if the first already takes the legal maximum.</p></div>
        </div>
      </article>`;
}
