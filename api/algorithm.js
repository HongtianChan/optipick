// 复制算法核心代码到 api 目录（与 cli/src/algorithm.js 同步，含分层+启发式优化）
function combination(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function generateCombinations(arr, k) {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  const result = [];
  function backtrack(start, current) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

function intersectionSize(set1, set2) {
  const s1 = new Set(set1);
  return set2.filter(x => s1.has(x)).length;
}

function coversRequirement(kGroup, jCombination, j, s, atLeast = 1) {
  const intersect = intersectionSize(kGroup, jCombination);
  if (intersect < s) return false;
  if (j === s) {
    if (intersect !== j) return false;
    const sCombinations = generateCombinations(jCombination, s);
    const kSubsets = generateCombinations(kGroup.filter(x => jCombination.includes(x)), s);
    const kSubsetsSet = new Set(kSubsets.map(sub => sub.sort().join(',')));
    return sCombinations.every(sComb => {
      const key = sComb.sort().join(',');
      return kSubsetsSet.has(key);
    });
  } else {
    if (atLeast === 1) return intersect >= s;
    const sCombinations = generateCombinations(jCombination, s);
    const kSubsets = generateCombinations(kGroup.filter(x => jCombination.includes(x)), s);
    const kSubsetsSet = new Set(kSubsets.map(sub => sub.sort().join(',')));
    let covered = 0;
    for (const sComb of sCombinations) {
      const key = sComb.sort().join(',');
      if (kSubsetsSet.has(key)) {
        covered++;
        if (covered >= atLeast) return true;
      }
    }
    return false;
  }
}

function buildCoverageIndexes(allKGroups, allJCombinations, j, s, atLeast) {
  const indexes = [];
  for (const kGroup of allKGroups) {
    const list = [];
    for (let i = 0; i < allJCombinations.length; i++) {
      if (coversRequirement(kGroup, allJCombinations[i], j, s, atLeast)) list.push(i);
    }
    indexes.push(list);
  }
  return indexes;
}

function greedySetCover(nSamples, k, j, s, atLeast = 1) {
  const allKGroups = generateCombinations(nSamples, k);
  const allJCombinations = generateCombinations(nSamples, j);
  const coverageIndexes = buildCoverageIndexes(allKGroups, allJCombinations, j, s, atLeast);
  const selected = [];
  const selectedKey = new Set();
  const covered = new Set();
  while (covered.size < allJCombinations.length) {
    let bestIdx = -1;
    let bestNewCoverage = 0;
    for (let g = 0; g < allKGroups.length; g++) {
      if (selectedKey.has(allKGroups[g].join(','))) continue;
      let newCov = 0;
      for (const jIdx of coverageIndexes[g]) {
        if (!covered.has(jIdx)) newCov++;
      }
      if (newCov > bestNewCoverage) {
        bestNewCoverage = newCov;
        bestIdx = g;
      }
    }
    if (bestIdx < 0 || bestNewCoverage === 0) break;
    const bestGroup = allKGroups[bestIdx];
    selected.push(bestGroup);
    selectedKey.add(bestGroup.join(','));
    for (const jIdx of coverageIndexes[bestIdx]) covered.add(jIdx);
  }
  return selected;
}

function removeRedundantGroups(selected, allJCombinations, j, s, atLeast) {
  if (selected.length <= 1) return selected;
  const result = [...selected];
  for (let i = result.length - 1; i >= 0; i--) {
    const without = result.filter((_, idx) => idx !== i);
    const covered = new Set();
    for (const g of without) {
      for (let jIdx = 0; jIdx < allJCombinations.length; jIdx++) {
        if (coversRequirement(g, allJCombinations[jIdx], j, s, atLeast)) covered.add(jIdx);
      }
    }
    let redundant = true;
    for (let jIdx = 0; jIdx < allJCombinations.length; jIdx++) {
      if (!coversRequirement(result[i], allJCombinations[jIdx], j, s, atLeast)) continue;
      if (!covered.has(jIdx)) {
        redundant = false;
        break;
      }
    }
    if (redundant) result.splice(i, 1);
  }
  return result;
}

function backtrackSetCover(nSamples, k, j, s, atLeast = 1, maxGroups = Infinity) {
  const allJCombinations = generateCombinations(nSamples, j);
  let allKGroups = generateCombinations(nSamples, k);
  const coverageIndexes = buildCoverageIndexes(allKGroups, allJCombinations, j, s, atLeast);
  const order = allKGroups.map((_, i) => i).sort((a, b) => coverageIndexes[b].length - coverageIndexes[a].length);
  allKGroups = order.map(i => allKGroups[i]);
  const reorderedCoverage = order.map(i => coverageIndexes[i]);
  const maxSingleCover = Math.max(...reorderedCoverage.map(list => list.length), 1);
  const greedySolution = greedySetCover(nSamples, k, j, s, atLeast);
  let bestCount = Math.min(greedySolution.length, maxGroups);
  let bestSolution = greedySolution.map(g => [...g]);
  function backtrack(selected, covered, startIdx) {
    if (selected.length >= bestCount) return;
    if (covered.size === allJCombinations.length) {
      bestCount = selected.length;
      bestSolution = selected.map(g => [...g]);
      return;
    }
    if (startIdx >= allKGroups.length) return;
    const uncovered = allJCombinations.length - covered.size;
    const lb = Math.ceil(uncovered / maxSingleCover);
    if (selected.length + lb >= bestCount) return;
    backtrack(selected, covered, startIdx + 1);
    const currentGroup = allKGroups[startIdx];
    const newCovered = new Set(covered);
    for (const jIdx of reorderedCoverage[startIdx]) newCovered.add(jIdx);
    if (newCovered.size > covered.size) {
      selected.push(currentGroup);
      backtrack(selected, newCovered, startIdx + 1);
      selected.pop();
    }
  }
  backtrack([], new Set(), 0);
  return bestSolution;
}

function solveOptimalSamples(m, n, k, j, s, atLeast = 1, randomSamples = null) {
  let nSamples;
  if (randomSamples && randomSamples.length === n) {
    nSamples = randomSamples;
  } else {
    const all = Array.from({ length: m }, (_, i) => i + 1);
    const shuffled = all.sort(() => Math.random() - 0.5);
    nSamples = shuffled.slice(0, n).sort((a, b) => a - b);
  }
  const totalKGroups = combination(n, k);
  const useExact = totalKGroups <= 100;
  let result;
  if (useExact) {
    result = backtrackSetCover(nSamples, k, j, s, atLeast);
  } else {
    result = greedySetCover(nSamples, k, j, s, atLeast);
    const allJ = generateCombinations(nSamples, j);
    result = removeRedundantGroups(result, allJ, j, s, atLeast);
  }
  return {
    samples: nSamples,
    groups: result,
    count: result.length,
    method: useExact ? 'backtrack' : 'greedy'
  };
}

module.exports = { solveOptimalSamples };
