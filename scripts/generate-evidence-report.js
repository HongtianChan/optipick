#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { solveOptimalSamples } = require('../api/algorithm');

function toInt(v, name) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid ${name}: ${v}`);
  return n;
}

function comb(arr, k) {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  const out = [];
  const cur = [];
  function bt(start) {
    if (cur.length === k) {
      out.push([...cur]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      bt(i + 1);
      cur.pop();
    }
  }
  bt(0);
  return out;
}

function isSubset(subset, groupSet) {
  for (const x of subset) {
    if (!groupSet.has(x)) return false;
  }
  return true;
}

function evaluateCoverage(result, j, s, atLeast) {
  const jCombs = comb(result.samples, j);
  const groupSets = result.groups.map((g) => new Set(g));
  const failed = [];
  let satisfied = 0;

  for (const jComb of jCombs) {
    const sCombs = comb(jComb, s);
    let coveredCount = 0;
    for (const sComb of sCombs) {
      const covered = groupSets.some((gSet) => isSubset(sComb, gSet));
      if (covered) coveredCount++;
    }
    const required = j === s ? sCombs.length : atLeast;
    const ok = coveredCount >= required;
    if (ok) satisfied++;
    else if (failed.length < 5) {
      failed.push({
        jCombination: `[${jComb.join(', ')}]`,
        covered: coveredCount,
        required
      });
    }
  }

  const total = jCombs.length;
  return {
    total,
    satisfied,
    coveragePct: total === 0 ? 0 : (satisfied / total) * 100,
    passed: satisfied === total,
    failed
  };
}

function avg(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function parseArgs(argv) {
  const args = { runs: 5, atLeast: 1, output: null, solveMode: 'balanced' };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--m') args.m = toInt(argv[++i], 'm');
    else if (t === '--n') args.n = toInt(argv[++i], 'n');
    else if (t === '--k') args.k = toInt(argv[++i], 'k');
    else if (t === '--j') args.j = toInt(argv[++i], 'j');
    else if (t === '--s') args.s = toInt(argv[++i], 's');
    else if (t === '--at-least') args.atLeast = toInt(argv[++i], 'at-least');
    else if (t === '--solve-mode') args.solveMode = argv[++i];
    else if (t === '--runs') args.runs = toInt(argv[++i], 'runs');
    else if (t === '--output') args.output = argv[++i];
    else if (t === '--samples') {
      args.samples = argv[++i].split(',').map((x) => toInt(x.trim(), 'sample'));
    } else if (t === '--help') {
      args.help = true;
    }
  }
  return args;
}

function help() {
  return `Usage:
  node scripts/generate-evidence-report.js --m 45 --n 8 --k 6 --j 6 --s 5 [--at-least 1] [--solve-mode fast|balanced|quality] [--runs 5] [--samples "1,2,3,4,5,6,7,8"] [--output submission/sample-runs/evidence.md]
`;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(help());
    process.exit(0);
  }
  const required = ['m', 'n', 'k', 'j', 's'];
  for (const key of required) {
    if (typeof args[key] !== 'number') {
      throw new Error(`Missing --${key}\n${help()}`);
    }
  }
  if (args.runs < 1) throw new Error('--runs must be >= 1');
  if (!['fast', 'balanced', 'quality'].includes(args.solveMode)) {
    throw new Error('--solve-mode must be one of: fast, balanced, quality');
  }

  const runRows = [];
  for (let i = 1; i <= args.runs; i++) {
    const t0 = Date.now();
    const result = solveOptimalSamples(
      args.m,
      args.n,
      args.k,
      args.j,
      args.s,
      args.atLeast,
      args.samples || null,
      args.solveMode
    );
    const durationMs = Date.now() - t0;
    const check = evaluateCoverage(result, args.j, args.s, args.atLeast);

    runRows.push({
      run: i,
      method: result.method,
      groups: result.count,
      durationMs,
      check,
      result
    });
  }

  const best = [...runRows].sort((a, b) => a.groups - b.groups || a.durationMs - b.durationMs)[0];
  const groupCounts = runRows.map((r) => r.groups);
  const times = runRows.map((r) => r.durationMs);

  const timestamp = new Date().toISOString();
  const outputPath =
    args.output ||
    path.join(
      process.cwd(),
      'submission',
      'sample-runs',
      `evidence-${timestamp.replace(/[:.]/g, '-')}.md`
    );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const lines = [];
  lines.push('# Verification Evidence Report');
  lines.push('');
  lines.push(`Generated at: \`${timestamp}\``);
  lines.push('');
  lines.push('## Input');
  lines.push('');
  lines.push(`- Parameters: \`m=${args.m}, n=${args.n}, k=${args.k}, j=${args.j}, s=${args.s}, at least=${args.atLeast}\``);
  lines.push(`- Solve mode: \`${args.solveMode}\``);
  lines.push(`- Runs: \`${args.runs}\``);
  lines.push(`- Manual samples: ${args.samples ? `\`[${args.samples.join(', ')}]\`` : '`No (random each run)`'}`);
  lines.push('');
  lines.push('## Run Summary');
  lines.push('');
  lines.push('| Run | Method | Group Count | Runtime (ms) | Covered j-combinations | Coverage |');
  lines.push('|---:|---|---:|---:|---:|---:|');
  for (const row of runRows) {
    lines.push(
      `| ${row.run} | ${row.method} | ${row.groups} | ${row.durationMs} | ${row.check.satisfied}/${row.check.total} | ${row.check.coveragePct.toFixed(2)}% |`
    );
  }
  lines.push('');
  lines.push('## Correctness Evidence (Best Run)');
  lines.push('');
  lines.push(`- Best run index: \`${best.run}\``);
  lines.push(`- Selected samples: \`[${best.result.samples.join(', ')}]\``);
  lines.push(`- Coverage result: \`${best.check.satisfied}/${best.check.total}\` (${best.check.coveragePct.toFixed(2)}%)`);
  lines.push(`- Verdict: **${best.check.passed ? 'PASS' : 'FAIL'}**`);
  lines.push('');
  if (!best.check.passed) {
    lines.push('### Uncovered Examples (first 5)');
    lines.push('');
    for (const f of best.check.failed) {
      lines.push(`- j-combination ${f.jCombination}: covered ${f.covered}, required ${f.required}`);
    }
    lines.push('');
  } else {
    lines.push('- All required j-combinations satisfy the coverage constraint.');
    lines.push('');
  }

  lines.push('## Quality Evidence');
  lines.push('');
  lines.push(`- Group count (best / avg / worst): \`${Math.min(...groupCounts)} / ${avg(groupCounts).toFixed(2)} / ${Math.max(...groupCounts)}\``);
  lines.push(`- Runtime ms (best / avg / worst): \`${Math.min(...times)} / ${avg(times).toFixed(2)} / ${Math.max(...times)}\``);
  if (best.result.method === 'backtrack') {
    lines.push('- Method note: `backtrack` indicates exact optimization for this search size.');
  } else if (best.result.method === 'grasp-fast') {
    lines.push('- Method note: `grasp-fast` indicates speed-priority heuristic under time budget.');
  } else if (best.result.method === 'grasp-quality') {
    lines.push('- Method note: `grasp-quality` indicates longer heuristic search under time budget.');
  } else {
    lines.push('- Method note: `grasp` indicates near-optimal heuristic under time budget.');
  }
  lines.push('');
  lines.push('## Best Run Result Groups');
  lines.push('');
  best.result.groups.forEach((g, i) => {
    lines.push(`${i + 1}. [${g.join(', ')}]`);
  });
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`Evidence report generated: ${outputPath}`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

