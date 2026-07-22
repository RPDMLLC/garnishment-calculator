#!/usr/bin/env node
/** Unit tests for garnishment math — fixtures captured from the production
 *  calculator July 6, 2026, plus two documented legal corrections (NY, IL). */
const path = require('path');
const GCMath = require(path.join(__dirname, '..', 'lib', 'garnish-math.cjs'));
const states = require(path.join(__dirname, '..', 'src', 'data', 'states.json'));

const S = (slug) => ({ ...states[slug], slug });
let pass = 0, fail = 0;

function expect(label, actual, expected) {
  const ok = Math.abs(actual - expected) < 0.01;
  if (ok) { pass++; console.log('  PASS', label, '=', actual); }
  else { fail++; console.log('  FAIL', label, 'expected', expected, 'got', actual); }
}

console.log('All cases: $2,000 gross, bi-weekly (disposable = $1,500)');
const base = { gross: 2000, frequency: 'biweekly' };

// Fixtures matching old production calculator
expect('FL consumer', GCMath.calculate(S('florida'), { ...base, type: 'consumer' }).max, 375);
expect('TX consumer (prohibited)', GCMath.calculate(S('texas'), { ...base, type: 'consumer' }).max, 0);
expect('FL child support (supporting other family)', GCMath.calculate(S('florida'), { ...base, type: 'child_support', supportsOtherFamily: true }).max, 750);
expect('FL student loans', GCMath.calculate(S('florida'), { ...base, type: 'student_loans' }).max, 225);
// 34 CFR 34.19: AWG is the LESSER of 15% of disposable or the amount above 30x fed min
// wage/week ($217.50). Without the floor the lib overstated for low earners.
expect('Student loans low earner $300/wk (30x floor binds, not 15%)',
  GCMath.calculate(S('florida'), { gross: 300, frequency: 'weekly', type: 'student_loans' }).max, 7.5);
expect('Student loans fully protected below floor ($250/wk)',
  GCMath.calculate(S('florida'), { gross: 250, frequency: 'weekly', type: 'student_loans' }).max, 0);
expect('Student loans in a prohibition state still apply (TX, federal overrides)',
  GCMath.calculate(S('texas'), { ...base, type: 'student_loans' }).max, 225);
expect('FL tax levy estimate', GCMath.calculate(S('florida'), { ...base, type: 'tax_levy' }).max, 300);

// Documented legal corrections (old calc was wrong)
expect('NY consumer (10% of GROSS - corrected)', GCMath.calculate(S('new-york'), { ...base, type: 'consumer' }).max, 200);
expect('IL consumer (15% gross vs 45x floor - corrected)', GCMath.calculate(S('illinois'), { ...base, type: 'consumer' }).max, Math.min(300, 1500 - 45 * states['illinois'].stateMinimumWage * 2));

// Additional coverage
expect('FL child support (not supporting, in arrears = 65%)', GCMath.calculate(S('florida'), { ...base, type: 'child_support', supportsOtherFamily: false, inArrears: true }).max, 975);
// TX Fam. Code §158.009 caps child-support withholding at 50% of disposable, flat —
// even for arrears, where the federal CCPA would otherwise allow 65%.
expect('TX child support (single + arrears, capped at 50% not 65%)',
  GCMath.calculate(S('texas'), { ...base, type: 'child_support', supportsOtherFamily: false, inArrears: true }).max, 750);
expect('TX child support (supporting, current, 50%)',
  GCMath.calculate(S('texas'), { ...base, type: 'child_support', supportsOtherFamily: true, inArrears: false }).max, 750);
expect('Low income fully protected (AL $250/wk)', GCMath.calculate(S('alabama'), { gross: 250, frequency: 'weekly', type: 'consumer' }).max, 0);
expect('CA consumer $2000 biweekly (40x state wage)', GCMath.calculate(S('california'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.25 * 1500, 1500 - 40 * states['california'].stateMinimumWage * 2)));
expect('PA consumer (prohibited)', GCMath.calculate(S('pennsylvania'), { ...base, type: 'consumer' }).max, 0);
// MA c.246 §28: floor is 50x the GREATER of federal or MA min wage ($15) = $750/wk.
// At $2000 biweekly, disposable $1500 = 50x$15x2 exactly, so nothing is garnishable.
expect('MA consumer (15% gross vs 50x $15 state min - corrected)', GCMath.calculate(S('massachusetts'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.15 * 2000, 1500 - 50 * 15 * 2)));
// MD Comm. Law §15-601.1: exempt = greater of 75% disposable or 30x state min wage ($15) = $450/wk
expect('MD consumer (30x $15 state min floor - corrected)', GCMath.calculate(S('maryland'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.25 * 1500, 1500 - 30 * 15 * 2)));
// OH follows federal CCPA ($217.50/wk floor) — no special $425 floor
expect('OH consumer (federal 25% / $217.50 - corrected)', GCMath.calculate(S('ohio'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.25 * 1500, 1500 - 30 * 7.25 * 2)));
// OR ORS 18.385: flat statutory weekly floor $400 (as of 2026-07-01)
expect('OR consumer (flat $400/wk statutory floor - corrected)', GCMath.calculate(S('oregon'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.25 * 1500, 1500 - 400 * 2)));

// Sanity: run every state, ensure no NaN / negative / over-disposable
let stateSweep = 0;
for (const slug of Object.keys(states)) {
  for (const type of ['consumer', 'child_support', 'student_loans', 'tax_levy']) {
    for (const gross of [300, 800, 2000, 6000]) {
      const r = GCMath.calculate(S(slug), { gross, frequency: 'biweekly', type });
      if (isNaN(r.max) || r.max < 0 || r.max > r.disposable + 0.01) {
        fail++; console.log('  FAIL sweep', slug, type, gross, r.max);
      } else stateSweep++;
    }
  }
}
console.log(`  PASS state sweep: ${stateSweep} combinations, all sane`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
