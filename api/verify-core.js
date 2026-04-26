function combination(arr, k) {
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

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isSubset(subset, groupSet) {
  for (const x of subset) {
    if (!groupSet.has(x)) return false;
  }
  return true;
}

function normalizeSamples(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('samples must be a non-empty array');
  }
  const parsed = samples.map((x) => Number(x));
  if (parsed.some((x) => !isPositiveInteger(x))) {
    throw new Error('sample values must be positive integers');
  }
  if (new Set(parsed).size !== parsed.length) {
    throw new Error('samples must be unique');
  }
  return parsed;
}

function normalizeGroups(groups) {
  if (!Array.isArray(groups)) throw new Error('groups must be an array');
  return groups.map((g) => {
    if (!Array.isArray(g) || g.length === 0) throw new Error('each group must be a non-empty array');
    const parsed = g.map((x) => Number(x));
    if (parsed.some((x) => !isPositiveInteger(x))) {
      throw new Error('group values must be positive integers');
    }
    return parsed;
  });
}

function validateCandidate(samples, groups, k) {
  const normalizedSamples = normalizeSamples(samples);
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error('groups must be a non-empty array');
  }
  if (!isPositiveInteger(k)) {
    throw new Error('k must be a positive integer');
  }
  const sampleSet = new Set(normalizedSamples);
  for (const g of groups) {
    if (g.length !== k) throw new Error(`each group must contain exactly k=${k} values`);
    const uniq = new Set(g);
    if (uniq.size !== g.length) throw new Error('group values must be unique within each group');
    for (const x of g) {
      if (!sampleSet.has(x)) {
        throw new Error(`group value ${x} is outside selected samples`);
      }
    }
  }
}

function evaluateCoverage(samples, groups, j, s, atLeast = 1) {
  const jCombs = combination(samples, j);
  const groupSets = groups.map((g) => new Set(g));
  const failed = [];
  let satisfied = 0;

  for (const jComb of jCombs) {
    const sCombs = combination(jComb, s);
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
        jCombination: jComb,
        covered: coveredCount,
        required
      });
    }
  }

  const total = jCombs.length;
  return {
    total,
    satisfied,
    passed: satisfied === total,
    coveragePct: total === 0 ? 0 : (satisfied / total) * 100,
    failed
  };
}

function verifyCoverageOrThrow(samples, groups, k, j, s, atLeast = 1) {
  const normalizedSamples = normalizeSamples(samples);
  const normalizedGroups = normalizeGroups(groups);
  validateCandidate(normalizedSamples, normalizedGroups, k);
  const check = evaluateCoverage(normalizedSamples, normalizedGroups, j, s, atLeast);
  if (!check.passed) {
    const first = check.failed[0];
    const detail = first
      ? ` first failed j-combination [${first.jCombination.join(', ')}] covered ${first.covered}/${first.required}`
      : '';
    throw new Error(`candidate groups do not satisfy coverage: ${check.satisfied}/${check.total}.${detail}`);
  }
  return { samples: normalizedSamples, groups: normalizedGroups, check };
}

module.exports = {
  evaluateCoverage,
  normalizeGroups,
  normalizeSamples,
  validateCandidate,
  verifyCoverageOrThrow
};
