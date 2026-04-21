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

function isSubset(subset, groupSet) {
  for (const x of subset) {
    if (!groupSet.has(x)) return false;
  }
  return true;
}

function normalizeGroups(groups) {
  if (!Array.isArray(groups)) throw new Error('groups must be an array');
  return groups.map((g) => {
    if (!Array.isArray(g) || g.length === 0) throw new Error('each group must be a non-empty array');
    const parsed = g.map((x) => Number(x));
    if (parsed.some((x) => !Number.isInteger(x) || x <= 0)) {
      throw new Error('group values must be positive integers');
    }
    return parsed;
  });
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

module.exports = { evaluateCoverage, normalizeGroups };
