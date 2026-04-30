#!/usr/bin/env node
/**
 * Compare solver group count to teacher reference table (fixed samples 1..n, m=50, atLeast=1).
 * Run: node scripts/teacher-benchmark.js
 * Quality mode may take minutes for large n.
 */
const { solveOptimalSamples } = require('../api/algorithm');
const { verifyCoverageOrThrow } = require('../api/verify-core');

const CASES = [
  [12, 6, 5, 5, 132],
  [13, 6, 5, 5, 245],
  [14, 6, 4, 4, 99],
  [15, 6, 4, 4, 130],
  [18, 6, 4, 4, 258],
  [15, 6, 6, 5, 190],
  [16, 6, 6, 5, 280],
  [14, 6, 5, 4, 40],
  [16, 6, 5, 4, 65],
  [17, 6, 5, 4, 88],
  [20, 6, 5, 4, 216],
  [15, 6, 6, 4, 22],
  [18, 6, 6, 4, 42],
  [20, 6, 6, 4, 100],
  [23, 6, 6, 4, 153],
];

const M = 50;
const AT_LEAST = 1;
const TOL_PCT = 10;

function main() {
  console.log('m=%d atLeast=%d mode=quality samples=[1..n]', M, AT_LEAST);
  console.log('n\tk\tj\ts\texp\tgot\tdiff%\t<=%d%%', TOL_PCT);
  let ok = 0;
  for (const [n, k, j, s, exp] of CASES) {
    const samples = Array.from({ length: n }, (_, i) => i + 1);
    const t0 = Date.now();
    const r = solveOptimalSamples(M, n, k, j, s, AT_LEAST, samples, 'quality');
    verifyCoverageOrThrow(r.samples, r.groups, k, j, s, AT_LEAST);
    const ms = Date.now() - t0;
    const got = r.count;
    const diffPct = ((got - exp) / exp) * 100;
    const pass = Math.abs(diffPct) <= TOL_PCT;
    if (pass) ok++;
    console.log(
      [n, k, j, s, exp, got, diffPct.toFixed(1) + '%', pass ? 'yes' : 'no', '(' + ms + 'ms)'].join('\t')
    );
  }
  console.log('within %d%%: %d / %d', TOL_PCT, ok, CASES.length);
}

main();
