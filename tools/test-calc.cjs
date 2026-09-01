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
// Other 50%-flat child-support states (verified against statute July 22): the worst
// case (single, arrears) that would be 65% federally is capped at 50% = $750.
['arizona','idaho','michigan','oregon','washington','tennessee','louisiana','new-mexico','north-carolina'].forEach(function (sl) {
  expect(sl + ' child support (single+arrears capped at 50%)',
    GCMath.calculate(S(sl), { ...base, type: 'child_support', supportsOtherFamily: false, inArrears: true }).max, 750);
});
// California was NOT a deviation — it follows the federal tiers (single+arrears = 65%)
expect('CA child support follows federal (single+arrears = 65%)',
  GCMath.calculate(S('california'), { ...base, type: 'child_support', supportsOtherFamily: false, inArrears: true }).max, 975);
expect('Low income fully protected (AL $250/wk)', GCMath.calculate(S('alabama'), { gross: 250, frequency: 'weekly', type: 'consumer' }).max, 0);
// CA CCP §706.050 (SB 1477): lesser of 20% disposable or 40% of the amount over 48x
// state min wage. At $2000 biweekly, disposable $1500 < 48x$16.90x2 ($1622.40) → $0.
expect('CA consumer $2000 biweekly (SB1477 48x floor fully protects)', GCMath.calculate(S('california'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.20 * 1500, 0.40 * Math.max(0, 1500 - 48 * states['california'].stateMinimumWage * 2))));
expect('CA consumer high income $6000 biweekly (SB1477 formula)', GCMath.calculate(S('california'), { gross: 6000, frequency: 'biweekly', type: 'consumer' }).max,
  Math.max(0, Math.min(0.20 * 4500, 0.40 * Math.max(0, 4500 - 48 * states['california'].stateMinimumWage * 2))));
// NY floor is 30x the GREATER of state/federal min wage ($17 → $510/wk), not federal $217.50.
// A NY earner at $400/wk gross (disposable $300 < $510) is fully protected.
expect('NY low income fully protected below 30x state min ($400/wk)', GCMath.calculate(S('new-york'), { gross: 400, frequency: 'weekly', type: 'consumer' }).max, 0);
expect('PA consumer (prohibited)', GCMath.calculate(S('pennsylvania'), { ...base, type: 'consumer' }).max, 0);
// NV NRS 31.295: 18% if gross <= $770/wk, else 25%; floor 50x fed ($362.50/wk).
// $2000 biweekly -> weekly gross $1000 > $770 -> 25% tier.
expect('NV consumer high earner (gross >$770/wk -> 25%)', GCMath.calculate(S('nevada'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.25 * 1500, 1500 - 50 * 7.25 * 2)));
// $700/wk gross (<= $770) -> 18% tier; disposable $525.
expect('NV consumer low earner (gross <=$770/wk -> 18%)', GCMath.calculate(S('nevada'), { gross: 700, frequency: 'weekly', type: 'consumer' }).max,
  Math.max(0, Math.min(0.18 * 525, 525 - 50 * 7.25)));
// VT 12 V.S.A. §3170 consumer: 15% of disposable / 40x fed ($290), not 25%/30x.
expect('VT consumer (15% / 40x fed - corrected)', GCMath.calculate(S('vermont'), { ...base, type: 'consumer' }).max,
  Math.max(0, Math.min(0.15 * 1500, 1500 - 40 * 7.25 * 2)));
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
// MN Debt Fairness Act (Minn. Stat. §571.922, eff. Oct 1 2024): graduated caps on
// weekly disposable vs greater of state/federal min wage ($11.41 → 40x = $456.40,
// 60x = $684.60, 80x = $912.80). Verified against revisor.mn.gov Aug 1, 2026.
const mnW = Math.max(7.25, states['minnesota'].stateMinimumWage);
expect('MN consumer fully protected at/below 40x ($600/wk gross, disposable $450)',
  GCMath.calculate(S('minnesota'), { gross: 600, frequency: 'weekly', type: 'consumer' }).max, 0);
expect('MN consumer 10% tier ($800/wk gross, disposable $600)',
  GCMath.calculate(S('minnesota'), { gross: 800, frequency: 'weekly', type: 'consumer' }).max,
  Math.min(0.10 * 600, 600 - 40 * mnW));
expect('MN consumer 15% tier ($1200/wk gross, disposable $900)',
  GCMath.calculate(S('minnesota'), { gross: 1200, frequency: 'weekly', type: 'consumer' }).max,
  Math.min(0.15 * 900, 900 - 40 * mnW));
expect('MN consumer 25% tier ($1600/wk gross, disposable $1200)',
  GCMath.calculate(S('minnesota'), { gross: 1600, frequency: 'weekly', type: 'consumer' }).max,
  Math.min(0.25 * 1200, 1200 - 40 * mnW));

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

// ---------------------------------------------------------------------------
// Head-of-family exemptions (consumer debt only). Verified 2026-09-01 against
// Fla. Stat. § 222.11(2), Mo. Rev. Stat. § 525.030, Neb. Rev. Stat. § 25-1558.
// ---------------------------------------------------------------------------
const HOH = { headOfHousehold: true };

// FL: disposable <= $750/wk is 100% exempt. $750/wk gross -> disposable $562.50.
expect('FL head of family at $750/wk gross fully exempt (§222.11(2)(a))',
  GCMath.calculate(S('florida'), { gross: 750, frequency: 'weekly', type: 'consumer', ...HOH }).max, 0);
// FL: above the $750/wk disposable line, still exempt absent a signed waiver.
expect('FL head of family high earner exempt absent written waiver (§222.11(2)(b))',
  GCMath.calculate(S('florida'), { gross: 2000, frequency: 'weekly', type: 'consumer', ...HOH }).max, 0);
// FL: unchecking the box must fall back to the plain CCPA result.
expect('FL non-head-of-family unchanged (CCPA, §222.11(2)(c))',
  GCMath.calculate(S('florida'), { gross: 750, frequency: 'weekly', type: 'consumer' }).max,
  Math.min(0.25 * 562.5, 562.5 - 30 * 7.25));
// FL: the exemption is consumer-debt only — child support must be untouched.
expect('FL head of family does NOT reduce child support',
  GCMath.calculate(S('florida'), { gross: 2000, frequency: 'weekly', type: 'child_support', ...HOH }).max,
  GCMath.calculate(S('florida'), { gross: 2000, frequency: 'weekly', type: 'child_support' }).max);
// MO: 10% head-of-family rate instead of 25%, 30x federal floor still applies.
expect('MO head of family = 10% of disposable (§525.030)',
  GCMath.calculate(S('missouri'), { gross: 1000, frequency: 'weekly', type: 'consumer', ...HOH }).max,
  Math.min(0.10 * 750, 750 - 30 * 7.25));
// NE: 15% head-of-family rate instead of 25%.
expect('NE head of family = 15% of disposable (§25-1558)',
  GCMath.calculate(S('nebraska'), { gross: 1000, frequency: 'weekly', type: 'consumer', ...HOH }).max,
  Math.min(0.15 * 750, 750 - 30 * 7.25));
// A state with no head-of-family exemption must ignore the flag entirely.
expect('GA (no head-of-family exemption) ignores the flag',
  GCMath.calculate(S('georgia'), { gross: 1000, frequency: 'weekly', type: 'consumer', ...HOH }).max,
  GCMath.calculate(S('georgia'), { gross: 1000, frequency: 'weekly', type: 'consumer' }).max);
// Iowa's flag was wrong (no head-of-family wage exemption in Iowa Code § 642.21).
expect('IA has no head-of-family exemption flag', states['iowa'].headOfHouseholdProtection, false);

// Golden-snapshot regression guard: every state x type x income value must still match
// the verified baseline. Catches any formula change that silently alters a state.
const snapshot = require('./snapshot.cjs');
const snap = snapshot.check();
if (snap.missing) {
  fail++; console.log('  FAIL snapshot: no golden-snapshot.json (run: node tools/snapshot.cjs --update)');
} else if (snap.mismatches.length) {
  fail += snap.mismatches.length;
  console.log(`  FAIL snapshot: ${snap.mismatches.length} of ${snap.checked} values drifted:`);
  for (const m of snap.mismatches.slice(0, 15)) console.log(`    ${m.key}  expected ${m.expected}  got ${m.got}`);
  console.log('    If intentional and verified, run: node tools/snapshot.cjs --update');
} else {
  console.log(`  PASS golden snapshot: ${snap.checked} state/type/income values match verified baseline`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
