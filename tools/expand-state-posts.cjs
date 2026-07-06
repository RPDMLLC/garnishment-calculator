#!/usr/bin/env node
/**
 * Content sprint: expand all 50 "[State] Wage Garnishment Laws Explained" posts.
 * Adds, per state:
 *   1. A worked dollar example section (computed from that state's real data)
 *   2. A state-vs-federal comparison table
 *   3. A state-specific FAQ
 * Existing article content is preserved untouched; new sections are inserted.
 * Usage: node tools/expand-state-posts.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOGS = path.join(ROOT, 'src', 'data', 'blogs.json');
const STATES = path.join(ROOT, 'src', 'data', 'states.json');

const blogs = JSON.parse(fs.readFileSync(BLOGS, 'utf8'));
const states = JSON.parse(fs.readFileSync(STATES, 'utf8'));

const FED_MIN = 7.25;
const FED_FLOOR = 30 * FED_MIN; // $217.50/week

const money = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// Weekly max garnishment for consumer debt. gross/disposable in $/week.
function weeklyMax(st, gross, disposable) {
  const slug = st.slug;
  if (st.consumerDebtPercent === 0) return 0;
  const wage = st.usesStateMinWage ? st.stateMinimumWage : FED_MIN;
  const floor = st.consumerDebtMinimumWageMultiplier * wage;
  if (slug === 'new-york')  return Math.max(0, Math.min(0.10 * gross, 0.25 * disposable, disposable - FED_FLOOR));
  if (slug === 'illinois')  return Math.max(0, Math.min(0.15 * gross, disposable - 45 * st.stateMinimumWage));
  if (slug === 'massachusetts') return Math.max(0, Math.min(0.15 * gross, disposable - 50 * FED_MIN));
  return Math.max(0, Math.min((st.consumerDebtPercent / 100) * disposable, disposable - floor));
}

function protectedFloorText(st) {
  if (st.consumerDebtPercent === 0) return 'All wages (consumer-debt garnishment prohibited)';
  const wage = st.usesStateMinWage ? st.stateMinimumWage : FED_MIN;
  const floor = st.consumerDebtMinimumWageMultiplier * wage;
  const src = st.usesStateMinWage ? `${st.name} minimum wage (${money(wage)}/hr)` : `federal minimum wage (${money(wage)}/hr)`;
  return `${money(floor)} per week (${st.consumerDebtMinimumWageMultiplier}× the ${src})`;
}

function workedExampleSection(st) {
  const name = st.name;
  if (st.consumerDebtPercent === 0) {
    // Prohibition states: show the child support math instead
    const rows = [700, 1000, 1500].map((gross) => {
      const disposable = gross * 0.75;
      const cs = 0.5 * disposable;
      return `<tr><td>${money(gross)}</td><td>${money(disposable)}</td><td>$0.00</td><td>${money(cs)}</td></tr>`;
    }).join('');
    return `
<h2>How Much Can Be Garnished in ${name}? A Worked Example</h2>
<p>For consumer debts — credit cards, medical bills, personal loans — the ${name} answer is simple: <strong>nothing</strong>. ${name} law prohibits wage garnishment for consumer debts entirely, no matter how large the judgment. The only garnishments that can reach a ${name} paycheck are child support, spousal maintenance, federal student loans, and tax debts.</p>
<p>Here is what that looks like at three income levels. The table assumes roughly 25% of gross pay goes to legally required deductions (taxes, Social Security, Medicare); your actual disposable earnings will vary. The child support column shows the standard 50% cap that applies when you support another child or spouse — it can reach 60% if you do not, plus 5% more if payments are over 12 weeks behind.</p>
<table><thead><tr><th>Gross weekly pay</th><th>Estimated disposable earnings</th><th>Max consumer-debt garnishment</th><th>Max child support withholding</th></tr></thead><tbody>${rows}</tbody></table>
<p>Even though your wages are protected, money that leaves your paycheck and lands in a bank account loses that protection in many circumstances — a creditor with a judgment can pursue a bank levy instead. See <a href="/blog/wage-garnishment-vs-bank-levy-difference">wage garnishment vs. bank levy</a> for how to protect deposited funds.</p>`;
  }
  const rows = [600, 900, 1500].map((gross) => {
    const disposable = gross * 0.75;
    const max = weeklyMax(st, gross, disposable);
    const pct = disposable > 0 ? (max / disposable) * 100 : 0;
    return `<tr><td>${money(gross)}</td><td>${money(disposable)}</td><td><strong>${money(max)}</strong></td><td>${pct.toFixed(1)}%</td></tr>`;
  }).join('');
  const wage = st.usesStateMinWage ? st.stateMinimumWage : FED_MIN;
  const floor = st.consumerDebtMinimumWageMultiplier * wage;
  return `
<h2>How Much Can Be Garnished in ${st.name}? A Worked Example</h2>
<p>The math matters more than the percentages. In ${st.name}, a creditor with a judgment for consumer debt is limited by two tests, and must use whichever takes <em>less</em>: the percentage cap, and the protected floor of ${money(floor)} per week (${st.consumerDebtMinimumWageMultiplier}× the ${st.usesStateMinWage ? st.name + ' minimum wage of ' + money(wage) + '/hour' : 'federal minimum wage of ' + money(wage) + '/hour'}). Everything at or below that floor is untouchable.</p>
<p>Here is what that means at three income levels. The table assumes roughly 25% of gross pay goes to legally required deductions (federal and state taxes, Social Security, Medicare); your actual disposable earnings — the number the law actually uses — will vary with your tax situation.</p>
<table><thead><tr><th>Gross weekly pay</th><th>Estimated disposable earnings</th><th>Max weekly garnishment</th><th>Share of disposable pay</th></tr></thead><tbody>${rows}</tbody></table>
<p>Notice how the protected floor changes the picture for lower incomes${weeklyMax(st, 600, 450) === 0 ? ' — at $600 per week gross, nothing can be garnished at all in ' + st.name : ''}. To run your own paycheck through the current formula, use the <a href="/${st.slug}-wage-garnishment-calculator">${st.name} wage garnishment calculator</a>.</p>`;
}

function comparisonSection(st) {
  const debtLimit = st.consumerDebtLimitText
    || (st.consumerDebtPercent === 0
        ? 'Prohibited'
        : `${st.consumerDebtPercent}% of disposable earnings`);
  const floorTxt = protectedFloorText(st);
  const verdict = st.consumerDebtPercent === 0
    ? `${st.name} is one of only four states that bar consumer-debt wage garnishment outright — dramatically stronger protection than federal law provides.`
    : (st.usesStateMinWage || st.consumerDebtMinimumWageMultiplier > 30 || st.consumerDebtPercent < 25)
      ? `${st.name}'s rules protect more of your paycheck than the federal baseline — the higher protected floor means lower-income workers often cannot be garnished at all.`
      : `${st.name} follows the federal baseline, so the CCPA numbers above are your actual protection — there is no additional state cushion for consumer debts.`;
  return `
<h2>${st.name} vs. the Federal Baseline</h2>
<table><thead><tr><th>Rule</th><th>Federal (CCPA)</th><th>${st.name}</th></tr></thead><tbody>
<tr><td>Consumer debt limit</td><td>25% of disposable earnings</td><td>${debtLimit}</td></tr>
<tr><td>Protected weekly floor</td><td>${money(FED_FLOOR)} (30× federal minimum wage)</td><td>${floorTxt}</td></tr>
<tr><td>Child support</td><td>50–65% of disposable earnings</td><td>${st.childSupportPercentCurrent}% supporting another family / ${st.childSupportPercentSingle}% otherwise, +${st.childSupportArrearsExtra}% for arrears</td></tr>
<tr><td>Federal student loans</td><td>15% of disposable earnings</td><td>${st.studentLoanPercent}% (federal administrative rule)</td></tr>
<tr><td>Head-of-household protection</td><td>None</td><td>${st.headOfHouseholdProtection ? 'Yes — additional state protection available' : 'No additional state protection'}</td></tr>
</tbody></table>
<p>${verdict}</p>`;
}

function faqSection(st) {
  const floorTxt = st.consumerDebtPercent === 0
    ? `all of it — ${st.name} does not allow wage garnishment for consumer debts`
    : `everything at or below ${protectedFloorText(st)} — plus whatever the percentage cap leaves above that line`;
  const protections = Array.isArray(st.keyProtections) && st.keyProtections.length
    ? st.keyProtections.slice(0, 3).map(p => p.replace(/\.$/, '')).join('; ')
    : 'Social Security, veterans benefits, unemployment compensation, and workers compensation';
  return `
<h2>${st.name} Wage Garnishment FAQ</h2>
<h3>Can my wages be garnished in ${st.name} without a court judgment?</h3>
<p>Not for consumer debts. A creditor must sue you, win a judgment, and obtain a garnishment order before your employer withholds anything. The exceptions that skip the lawsuit are child support orders, federal student loans (administrative wage garnishment), and tax levies — those follow their own separate procedures.</p>
<h3>How much of my paycheck is completely safe in ${st.name}?</h3>
<p>For consumer debts: ${floorTxt}. ${st.taxLevyNote ? 'Note that tax debts play by different rules: ' + st.taxLevyNote : ''}</p>
<h3>What income can never be garnished in ${st.name}?</h3>
<p>Key protections include: ${protections}. Once protected funds are commingled in a bank account, tracing them can get complicated — keep records of exempt deposits.</p>
<h3>Can I be fired for having my wages garnished in ${st.name}?</h3>
<p>Federal law (CCPA §304) prohibits firing an employee because of a single garnishment order, no matter the state. Protection for multiple garnishments varies — if you face more than one order, review your state's rules or speak with an employment attorney before assuming you are protected.</p>`;
}

// ---- run ----
let updated = 0;
const report = [];
for (const blog of blogs) {
  const m = blog.slug.match(/^(.+)-wage-garnishment-laws-explained$/);
  if (!m) continue;
  const st = states[blog.stateSlug] || states[m[1].replace(/-/g, '')] || states[m[1]];
  if (!st) { report.push(`SKIP (no state data): ${blog.slug}`); continue; }
  if (blog.content.includes('A Worked Example')) { report.push(`SKIP (already expanded): ${blog.slug}`); continue; }

  const before = blog.content.replace(/<[^>]+>/g, ' ').split(/\s+/).length;

  const newSections = workedExampleSection(st) + comparisonSection(st);
  const faq = faqSection(st);

  // Insert worked example + comparison after the intro (first </p>)
  const firstP = blog.content.indexOf('</p>');
  if (firstP === -1) { report.push(`SKIP (no <p>): ${blog.slug}`); continue; }
  let content = blog.content.slice(0, firstP + 4) + '\n' + newSections + '\n' + blog.content.slice(firstP + 4);

  // Insert FAQ before the help box if present, else append
  const helpIdx = content.indexOf('<div style="background:#f0f4f8');
  if (helpIdx !== -1) content = content.slice(0, helpIdx) + faq + '\n' + content.slice(helpIdx);
  else content = content + faq;

  blog.content = content;
  const after = content.replace(/<[^>]+>/g, ' ').split(/\s+/).length;
  blog.readTime = '8 min read';
  updated++;
  report.push(`OK ${st.name.padEnd(15)} ${before} -> ${after} words`);
}

fs.writeFileSync(BLOGS, JSON.stringify(blogs, null, 1), 'utf8');
console.log(report.join('\n'));
console.log(`\n${updated} state posts expanded.`);
