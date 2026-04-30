#!/usr/bin/env node
/**
 * Offline coverage-index precompute for canonical [1..n].
 *
 * Default target: all valid (n,k,j,s) combos in product constraints:
 *   7<=n<=25, 4<=k<=7, 3<=s<=7, s<=j<=k.
 *
 * Usage:
 *   node scripts/precache-coverage-indexes.js
 *   node scripts/precache-coverage-indexes.js --teacher
 *   node scripts/precache-coverage-indexes.js --write-json
 *   node scripts/precache-coverage-indexes.js --write-json --gzip
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { buildCanonicalCoverageState } = require('../api/algorithm');

const TEACHER = [
  [12, 6, 5, 5],
  [13, 6, 5, 5],
  [14, 6, 4, 4],
  [15, 6, 4, 4],
  [18, 6, 4, 4],
  [15, 6, 6, 5],
  [16, 6, 6, 5],
  [14, 6, 5, 4],
  [16, 6, 5, 4],
  [17, 6, 5, 4],
  [20, 6, 5, 4],
  [15, 6, 6, 4],
  [18, 6, 6, 4],
  [20, 6, 6, 4],
  [23, 6, 6, 4]
];

const AT_LEAST = 1;
const args = new Set(process.argv.slice(2));
const writeJson = args.has('--write-json');
const gzip = args.has('--gzip');
const teacherOnly = args.has('--teacher');
const rebuild = args.has('--rebuild');
const heavyFirst = args.has('--heavy-first');
const maxGbArg = process.argv.find((x) => x.startsWith('--max-gb='));
const maxTotalBytes = maxGbArg ? Math.floor(Number(maxGbArg.split('=')[1]) * 1024 * 1024 * 1024) : null;
const outDir = process.env.OPTIPICK_COVERAGE_DIR || path.join(__dirname, '../data/coverage');

function key(n, k, j, s) {
  return `n${n}-k${k}-j${j}-s${s}-a${AT_LEAST}`;
}

function enumerateAllCases() {
  const out = [];
  for (let n = 7; n <= 25; n++) {
    for (let k = 4; k <= Math.min(7, n); k++) {
      for (let s = 3; s <= Math.min(7, k); s++) {
        for (let j = s; j <= k; j++) {
          out.push([n, k, j, s]);
        }
      }
    }
  }
  return out;
}

function combination(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

function estimateWork(n, k, j, s) {
  // Higher means heavier in practice; slight boost for smaller s (broader coverage relation).
  const kCount = combination(n, k);
  const jCount = combination(n, j);
  const sFactor = (k - s + 1);
  return kCount * jCount * sFactor;
}

function dirSizeBytes(dir) {
  let total = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let ents = [];
    try {
      ents = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of ents) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(p);
      } else if (e.isFile()) {
        try {
          total += fs.statSync(p).size;
        } catch {
          // ignore transient file errors
        }
      }
    }
  }
  return total;
}

function writePayloadStreaming(fileBase, payload) {
  const file = gzip ? `${fileBase}.json.gz` : `${fileBase}.json`;
  const baseStream = fs.createWriteStream(file);
  const out = gzip ? zlib.createGzip({ level: 6 }) : baseStream;
  if (gzip) out.pipe(baseStream);

  const write = (s) => out.write(s);
  write('{"v":1');
  write(`,"n":${payload.n},"k":${payload.k},"j":${payload.j},"s":${payload.s},"atLeast":${payload.atLeast}`);
  write(`,"numJ":${payload.numJ}`);
  write(',"uniqueGroups":[');
  for (let i = 0; i < payload.uniqueGroups.length; i++) {
    if (i > 0) write(',');
    write(JSON.stringify(payload.uniqueGroups[i]));
  }
  write('],"uniqueCoverage":[');
  for (let i = 0; i < payload.uniqueCoverage.length; i++) {
    if (i > 0) write(',');
    write(JSON.stringify(payload.uniqueCoverage[i]));
  }
  write(']}');

  return new Promise((resolve, reject) => {
    const onError = (err) => reject(err);
    out.on('error', onError);
    baseStream.on('error', onError);
    baseStream.on('finish', () => {
      const stat = fs.statSync(file);
      resolve({ file, bytes: stat.size });
    });
    out.end();
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  let cases = teacherOnly ? TEACHER : enumerateAllCases();
  if (heavyFirst) {
    cases = cases
      .map((c) => ({ c, w: estimateWork(c[0], c[1], c[2], c[3]) }))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.c);
  }
  const manifest = {
    version: 2,
    atLeast: AT_LEAST,
    mode: teacherOnly ? 'teacher' : 'all',
    totalCases: cases.length,
    generatedAt: new Date().toISOString(),
    writeJson,
    gzip,
    heavyFirst,
    maxTotalBytes,
    cases: []
  };

  console.log(`precompute mode=${manifest.mode} cases=${cases.length} outDir=${outDir} rebuild=${rebuild} heavyFirst=${heavyFirst} maxTotalBytes=${maxTotalBytes ?? 'none'}`);
  let done = 0;
  let totalMs = 0;
  for (const [n, k, j, s] of cases) {
    if (maxTotalBytes != null) {
      const curBytes = dirSizeBytes(outDir);
      if (curBytes >= maxTotalBytes) {
        console.log(`Reached size limit: ${(curBytes / 1e9).toFixed(2)} GB >= ${(maxTotalBytes / 1e9).toFixed(2)} GB. Stopping.`);
        break;
      }
    }
    const entry = {
      key: key(n, k, j, s),
      n, k, j, s,
      numJ: null,
      nK: null,
      uniqueCount: null,
      buildMs: null
    };
    manifest.cases.push(entry);
    const fileBase = path.join(outDir, entry.key);
    const targetFile = `${fileBase}.json${gzip ? '.gz' : ''}`;
    if (writeJson && !rebuild && fs.existsSync(targetFile)) {
      const stat = fs.statSync(targetFile);
      done++;
      entry.file = path.basename(targetFile);
      entry.bytes = stat.size;
      entry.skipped = true;
      const avgMs = done > 0 ? Math.round(totalMs / Math.max(1, done)) : 0;
      const etaMs = avgMs * (cases.length - done);
      console.log(`[${done}/${cases.length}] ${entry.key} skipped existing (${(stat.size / 1e6).toFixed(1)} MB) eta~${Math.round(etaMs / 1000)}s`);
      continue;
    }

    const t0 = Date.now();
    const st = buildCanonicalCoverageState(n, k, j, s, AT_LEAST);
    const ms = Date.now() - t0;
    totalMs += ms;
    done++;
    entry.numJ = st.numJ;
    entry.nK = st.nK;
    entry.uniqueCount = st.uniqueCount;
    entry.buildMs = ms;

    const avgMs = Math.round(totalMs / done);
    const etaMs = avgMs * (cases.length - done);
    console.log(`[${done}/${cases.length}] ${entry.key} buildMs=${ms} |J|=${st.numJ} |K|=${st.nK} unique=${st.uniqueCount} eta~${Math.round(etaMs / 1000)}s`);

    if (writeJson) {
      const payload = {
        n, k, j, s, atLeast: AT_LEAST,
        numJ: st.numJ,
        uniqueGroups: st.uniqueGroups,
        uniqueCoverage: st.uniqueCoverage
      };
      const saved = await writePayloadStreaming(fileBase, payload);
      entry.file = path.basename(saved.file);
      entry.bytes = saved.bytes;
      console.log(`  wrote ${saved.file} (${(saved.bytes / 1e6).toFixed(1)} MB)`);
    }
  }

  manifest.totalBuildMs = totalMs;
  manifest.finalDirBytes = dirSizeBytes(outDir);
  const manPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manPath, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${manPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
