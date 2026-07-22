/**
 * Garnishment math — single source of truth.
 * Used by: the browser calculator widget (inlined by build) AND node unit tests.
 * All amounts are per pay period. Disposable earnings are estimated at 75% of
 * gross (roughly 25% to legally required deductions) unless the user's real
 * disposable figure is known — every output carries that caveat.
 *
 * Legal bases:
 * - Federal CCPA, 15 U.S.C. § 1673: consumer debt lesser-of test (25% disposable
 *   vs disposable minus 30x federal minimum wage per week)
 * - State variants from states.json (percent + multiplier + which minimum wage)
 * - NY CPLR 5231: lesser of 10% of GROSS or 25% of disposable (with federal floor)
 * - IL 740 ILCS 170: lesser of 15% of GROSS or disposable minus 45x IL minimum wage
 * - MA c.246 § 28: lesser of 15% of GROSS or disposable minus 50x federal minimum wage
 * - Child support: CCPA § 1673(b) 50/60% +5% for 12+ weeks arrears
 * - Student loans: HEA administrative wage garnishment, 15% of disposable
 * - Tax levy: IRS uses Pub. 1494 exemption tables — 20% of disposable is an
 *   ESTIMATE ONLY, always presented with that disclaimer
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GCMath = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const FED_MIN = 7.25;
  const WEEKS_PER_PERIOD = { weekly: 1, biweekly: 2, semimonthly: 26 / 12, monthly: 52 / 12 };

  function round2(n) { return Math.round(n * 100) / 100; }

  /**
   * @param {object} st  state record from states.json (plus slug)
   * @param {object} inp { gross, frequency, type, supportsOtherFamily, inArrears }
   * @returns { gross, disposable, max, protectedAmount, pctOfDisposable, basis, prohibition }
   */
  function calculate(st, inp) {
    const weeks = WEEKS_PER_PERIOD[inp.frequency] || 2;
    const gross = Number(inp.gross) || 0;
    const disposable = gross * 0.75; // estimate; disclosed in UI
    let max = 0;
    let basis = '';
    let prohibition = false;

    if (inp.type === 'child_support') {
      // CCPA § 1673(b): 50% supporting another family / 60% if not, +5% for 12+ weeks
      // arrears (i.e. 55% / 65%). Values read from state data so a state can override.
      const base = inp.supportsOtherFamily === false
        ? (st.childSupportPercentSingle != null ? st.childSupportPercentSingle : 60)
        : (st.childSupportPercentCurrent != null ? st.childSupportPercentCurrent : 50);
      let pct = inp.inArrears ? base + (st.childSupportArrearsExtra != null ? st.childSupportArrearsExtra : 5) : base;
      // Some states cap child-support withholding below the federal ceiling (e.g. Texas
      // Fam. Code § 158.009 caps at 50% of disposable, flat, even for arrears).
      const cap = st.childSupportMaxPercent != null ? st.childSupportMaxPercent : 65;
      pct = Math.min(pct, cap);
      max = (pct / 100) * disposable;
      basis = st.childSupportMaxPercent != null
        ? pct + '% of disposable earnings (' + st.name + ' cap, ' + st.childSupportMaxPercent + '% max)'
        : pct + '% of disposable earnings (CCPA § 1673(b))';
    } else if (inp.type === 'student_loans') {
      // 34 CFR 34.19: the employer withholds the LESSER of 15% of disposable pay or
      // the amount by which disposable pay exceeds 30x the federal minimum wage
      // (15 U.S.C. 1673(a)(2)). The floor is what protects low earners — without it
      // this overstates garnishment for anyone grossing under roughly $342/week.
      max = Math.max(0, Math.min(0.15 * disposable, disposable - 30 * FED_MIN * weeks));
      basis = 'lesser of 15% of disposable earnings or the amount above 30x the federal minimum wage (federal administrative wage garnishment, 34 CFR 34.19)';
    } else if (inp.type === 'tax_levy') {
      max = 0.20 * disposable;
      basis = 'estimate only — IRS levies use Publication 1494 tables based on filing status and dependents';
    } else {
      // consumer debt
      if (st.consumerDebtPercent === 0) {
        max = 0;
        prohibition = true;
        basis = 'consumer-debt wage garnishment is prohibited in ' + st.name;
      } else if (st.slug === 'new-york') {
        max = Math.min(0.10 * gross, 0.25 * disposable, disposable - 30 * FED_MIN * weeks);
        basis = 'lesser of 10% of gross wages or 25% of disposable earnings (NY CPLR 5231)';
      } else if (st.slug === 'illinois') {
        max = Math.min(0.15 * gross, disposable - 45 * st.stateMinimumWage * weeks);
        basis = 'lesser of 15% of gross wages or disposable earnings above 45x the Illinois minimum wage (740 ILCS 170)';
      } else if (st.slug === 'massachusetts') {
        // M.G.L. c.246 § 28: floor is 50x the GREATER of the federal or MA minimum wage
        const maWage = Math.max(FED_MIN, st.stateMinimumWage);
        max = Math.min(0.15 * gross, disposable - 50 * maWage * weeks);
        basis = 'lesser of 15% of gross wages or disposable earnings above 50x the Massachusetts minimum wage (M.G.L. c.246 § 28)';
      } else if (st.weeklyFloorOverride != null) {
        // states whose weekly exempt floor is a flat statutory dollar amount, not a
        // minimum-wage multiple (e.g. Oregon ORS 18.385)
        const floor = st.weeklyFloorOverride * weeks;
        max = Math.min((st.consumerDebtPercent / 100) * disposable, disposable - floor);
        basis = 'lesser of ' + st.consumerDebtPercent + '% of disposable earnings or the amount above $' +
          st.weeklyFloorOverride + ' per week (' + st.name + ' statutory exemption)';
      } else {
        const wage = st.usesStateMinWage ? st.stateMinimumWage : FED_MIN;
        const floor = st.consumerDebtMinimumWageMultiplier * wage * weeks;
        max = Math.min((st.consumerDebtPercent / 100) * disposable, disposable - floor);
        basis = 'lesser of ' + st.consumerDebtPercent + '% of disposable earnings or the amount above ' +
          st.consumerDebtMinimumWageMultiplier + 'x the ' +
          (st.usesStateMinWage ? st.name + ' minimum wage' : 'federal minimum wage');
      }
      max = Math.max(0, max);
    }

    max = round2(Math.max(0, Math.min(max, disposable)));
    const protectedAmount = round2(disposable - max);
    const pctOfDisposable = disposable > 0 ? round2((max / disposable) * 100) : 0;
    return { gross: round2(gross), disposable: round2(disposable), max, protectedAmount, pctOfDisposable, basis, prohibition };
  }

  return { calculate, FED_MIN, WEEKS_PER_PERIOD };
});
