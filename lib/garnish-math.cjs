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
 * - Head-of-family exemptions (consumer debt only, opt-in via headOfHousehold):
 *   Fla. Stat. § 222.11(2) (fully exempt at/below $750/wk disposable, and above it
 *   absent a signed statutory waiver), Mo. Rev. Stat. § 525.030 (10%),
 *   Neb. Rev. Stat. § 25-1558 (15%)
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
   * @param {object} inp { gross, frequency, type, supportsOtherFamily, inArrears, headOfHousehold }
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
      } else if (inp.headOfHousehold && st.headOfHouseholdRule) {
        // Head-of-family / head-of-household exemptions. Only a handful of states
        // grant one, and the rules differ, so each state carries its own rule object
        // in states.json (headOfHouseholdRule). Verified against primary sources
        // 2026-09-01. Only applies to consumer debt — it does not limit child
        // support, tax levies, or federal student-loan withholding.
        const rule = st.headOfHouseholdRule;
        if (rule.type === 'fullExemptBelowWeekly') {
          // Fla. Stat. § 222.11(2): ALL disposable earnings of a head of family whose
          // disposable earnings are <= $750/week are exempt. Above $750/week they still
          // may not be garnished unless the debtor signed the statutory written waiver
          // (§ 222.11(2)(b)); absent that waiver nothing is garnishable, so the default
          // answer is $0 with the waiver caveat disclosed in the basis text.
          const weeklyDisposable = weeks > 0 ? disposable / weeks : disposable;
          max = 0;
          basis = weeklyDisposable <= rule.weeklyThreshold
            ? 'all disposable earnings of a head of family at or below $' + rule.weeklyThreshold +
              ' per week are exempt (' + rule.citation + ')'
            : 'disposable earnings above $' + rule.weeklyThreshold + ' per week are still exempt for a head of family ' +
              'unless you signed the separate written waiver required by ' + rule.citation +
              '; if you did sign one, federal CCPA limits (25% of disposable, or the amount above $217.50 per week) apply instead';
        } else if (rule.type === 'percent') {
          // e.g. Mo. Rev. Stat. § 525.030 (10% head of family), Neb. Rev. Stat.
          // § 25-1558 (15% head of family). The 30x-federal-minimum-wage floor
          // still applies on top of the reduced percentage.
          const hohWage = st.usesStateMinWage ? st.stateMinimumWage : FED_MIN;
          const hohFloor = st.consumerDebtMinimumWageMultiplier * hohWage * weeks;
          max = Math.min((rule.percent / 100) * disposable, disposable - hohFloor);
          basis = 'lesser of ' + rule.percent + '% of disposable earnings (head-of-family rate, ' + rule.citation +
            ') or the amount above ' + st.consumerDebtMinimumWageMultiplier + 'x the ' +
            (st.usesStateMinWage ? st.name + ' minimum wage' : 'federal minimum wage');
        }
      } else if (st.slug === 'new-york') {
        // NY CPLR 5231: nothing garnishable if disposable is below 30x the GREATER of
        // the state or federal minimum wage. NY min wage ($17) far exceeds federal.
        const nyFloor = 30 * Math.max(FED_MIN, st.stateMinimumWage) * weeks;
        max = Math.min(0.10 * gross, 0.25 * disposable, disposable - nyFloor);
        basis = 'lesser of 10% of gross wages or 25% of disposable earnings, nothing below 30x the New York minimum wage (NY CPLR 5231)';
      } else if (st.slug === 'california') {
        // CCP §706.050 as amended by SB 1477 (eff. Sept 1, 2023): the lesser of 20% of
        // disposable earnings, or 40% of the amount by which disposable exceeds 48x the
        // state (or local, if higher) minimum wage. Far more protective than the old
        // 25% / 40x formula. This calculator uses the state minimum wage as the baseline.
        const caFloor = 48 * st.stateMinimumWage * weeks;
        max = Math.min(0.20 * disposable, 0.40 * Math.max(0, disposable - caFloor));
        basis = 'lesser of 20% of disposable earnings or 40% of the amount above 48x the California minimum wage (CCP §706.050)';
      } else if (st.slug === 'illinois') {
        max = Math.min(0.15 * gross, disposable - 45 * st.stateMinimumWage * weeks);
        basis = 'lesser of 15% of gross wages or disposable earnings above 45x the Illinois minimum wage (740 ILCS 170)';
      } else if (st.slug === 'massachusetts') {
        // M.G.L. c.246 § 28: floor is 50x the GREATER of the federal or MA minimum wage
        const maWage = Math.max(FED_MIN, st.stateMinimumWage);
        max = Math.min(0.15 * gross, disposable - 50 * maWage * weeks);
        basis = 'lesser of 15% of gross wages or disposable earnings above 50x the Massachusetts minimum wage (M.G.L. c.246 § 28)';
      } else if (st.slug === 'minnesota') {
        // Minn. Stat. § 571.922 (Debt Fairness Act, 2024 c 114, eff. Oct 1, 2024;
        // amended 1Sp2025 c 4): graduated cap keyed to weekly disposable earnings
        // vs the GREATER of the MN or federal minimum wage. At or below 40x the
        // wage: fully protected. Over 40x up to 60x: 10%. Over 60x up to 80x: 15%.
        // Over 80x: 25%. Always also limited to the amount above the 40x floor.
        const mnWage = Math.max(FED_MIN, st.stateMinimumWage);
        const weeklyDisposable = disposable / weeks;
        let mnPct = 0;
        if (weeklyDisposable > 80 * mnWage) mnPct = 25;
        else if (weeklyDisposable > 60 * mnWage) mnPct = 15;
        else if (weeklyDisposable > 40 * mnWage) mnPct = 10;
        max = Math.min((mnPct / 100) * disposable, Math.max(0, disposable - 40 * mnWage * weeks));
        basis = mnPct === 0
          ? 'weekly disposable earnings at or below 40x the Minnesota minimum wage are fully protected (Minn. Stat. § 571.922)'
          : mnPct + '% of disposable earnings (Minnesota graduated income-based cap, Minn. Stat. § 571.922), limited to the amount above 40x the state minimum wage';
      } else if (st.slug === 'nevada') {
        // NRS 31.295: 18% of disposable earnings if the debtor's GROSS weekly wage is
        // $770 or less, otherwise 25%; never more than the amount by which disposable
        // earnings exceed 50x the federal minimum wage ($362.50/week).
        const weeklyGross = weeks > 0 ? gross / weeks : gross;
        const nvPct = weeklyGross <= 770 ? 0.18 : 0.25;
        max = Math.min(nvPct * disposable, disposable - 50 * FED_MIN * weeks);
        basis = (weeklyGross <= 770 ? '18' : '25') + '% of disposable earnings (Nevada NRS 31.295, gross '
          + (weeklyGross <= 770 ? 'at or below' : 'above') + ' $770/week), limited to the amount above 50x the federal minimum wage';
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
