#!/usr/bin/env node
/**
 * Golden-snapshot regression guard for the garnishment math.
 *
 * Locks the calculator's output for EVERY state x garnishment type x representative
 * income into tools/golden-snapshot.json. Any future code change that alters a state's
 * result makes `node tools/test-calc.cjs` go red, forcing a human to confirm the change
 * is intentional (and, if so, regenerate the snapshot).
 *
 * The snapshot was first captured 2026-07-23, after a full week of primary-source legal
 * audits (min wages, consumer caps, child-support caps, student-loan AWG floor, CA SB1477,
 * NY floor). It is the most-verified baseline the calculator has ever had.
 *
 *   node tools/snapshot.cjs --update   # regenerate after an INTENTIONAL, verified change
 *   node tools/snapshot.cjs            # check current output against the snapshot
 */
const fs = require('fs');
const path = require('path');
const GCMath = require(path.join(__dirname, '..', 'lib', 'garnish-math.cjs'));
const states = require(path.join(__dirname, '..', 'src', 'data', 'states.json'));
const SNAP_PATH = path.join(__dirname, 'golden-snapshot.json');

// Canonical matrix — shared by generate + check so they can never drift.
// Income points are chosen to exercise the protected floors (low), the mid-range where
// state formulas bite, and the high range where percentage caps bind.
function cases() {
  const out = [];
  for (const slug of Object.keys(states)) {
    for (const gross of [300, 700, 1500, 4000]) {
      out.push({ slug, gross, frequency: 'weekly', type: 'consumer' });
    }
    // child support: base case (supporting, current) and worst case (single, 12+wk arrears)
    out.push({ slug, gross: 1500, frequency: 'weekly', type: 'child_support', supportsOtherFamily: true, inArrears: false });
    out.push({ slug, gross: 1500, frequency: 'weekly', type: 'child_support', supportsOtherFamily: false, inArrears: true });
    // student loans: low (exercises the $217.50 AWG floor), mid, high
    for (const gross of [300, 700, 1500]) {
      out.push({ slug, gross, frequency: 'weekly', type: 'student_loans' });
    }
    out.push({ slug, gross: 1500, frequency: 'weekly', type: 'tax_levy' });
  }
  return out;
}

function keyOf(c) {
  return [c.slug, c.type, c.gross, c.frequency,
    c.supportsOtherFamily === undefined ? '' : c.supportsOtherFamily,
    c.inArrears === undefined ? '' : c.inArrears].join('|');
}

function compute() {
  const snap = {};
  for (const c of cases()) {
    const r = GCMath.calculate({ ...states[c.slug], slug: c.slug }, c);
    snap[keyOf(c)] = r.max;
  }
  return snap;
}

function generate() {
  const snap = compute();
  fs.writeFileSync(SNAP_PATH, JSON.stringify(snap, null, 0) + '\n');
  console.log(`Wrote ${Object.keys(snap).length} golden values to ${path.relative(process.cwd(), SNAP_PATH)}`);
}

// returns { checked, mismatches: [ {key, expected, got} ] }
function check() {
  if (!fs.existsSync(SNAP_PATH)) {
    return { checked: 0, missing: true, mismatches: [] };
  }
  const golden = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
  const current = compute();
  const mismatches = [];
  const allKeys = new Set([...Object.keys(golden), ...Object.keys(current)]);
  for (const k of allKeys) {
    const e = golden[k], g = current[k];
    if (e === undefined) { mismatches.push({ key: k, expected: '(new case)', got: g }); continue; }
    if (g === undefined) { mismatches.push({ key: k, expected: e, got: '(missing)' }); continue; }
    if (Math.abs(e - g) > 0.01) mismatches.push({ key: k, expected: e, got: g });
  }
  return { checked: Object.keys(current).length, mismatches };
}

if (require.main === module) {
  if (process.argv.includes('--update')) {
    generate();
  } else {
    const res = check();
    if (res.missing) { console.log('No snapshot found — run: node tools/snapshot.cjs --update'); process.exit(1); }
    if (res.mismatches.length) {
      console.log(`SNAPSHOT DRIFT: ${res.mismatches.length} of ${res.checked} values changed:`);
      for (const m of res.mismatches.slice(0, 40)) console.log(`  ${m.key}  expected ${m.expected}  got ${m.got}`);
      if (res.mismatches.length > 40) console.log(`  ...and ${res.mismatches.length - 40} more`);
      console.log('If this change is intentional and verified, run: node tools/snapshot.cjs --update');
      process.exit(1);
    }
    console.log(`Snapshot OK: ${res.checked} state/type/income values match.`);
  }
}

module.exports = { check, generate, cases };
