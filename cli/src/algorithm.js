// 组合数计算：nCk
function combination(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k; // 优化
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

// 生成所有组合：从 arr 中选 k 个
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

// 检查两个集合的交集大小
function intersectionSize(set1, set2) {
  const s1 = new Set(set1);
  return set2.filter(x => s1.has(x)).length;
}

// 当 k 组已为 Set 时用，避免重复 new Set（buildCoverageIndexes 内热路径）
function intersectionSizeWithSet(kGroupSet, jCombination) {
  let c = 0;
  for (const x of jCombination) if (kGroupSet.has(x)) c++;
  return c;
}
// 仅当「交集是否 >= s」时用，达到 s 即返回，少做一次 has（热路径）
function intersectionAtLeastWithSet(kGroupSet, jCombination, s) {
  let c = 0;
  for (const x of jCombination) {
    if (kGroupSet.has(x)) {
      c++;
      if (c >= s) return true;
    }
  }
  return false;
}

// 检查 k 组是否覆盖 j 组合的要求；可选传入 kGroupSet 避免重复建 Set
function coversRequirement(kGroup, jCombination, j, s, atLeast = 1, kGroupSet = null) {
  // 热路径：j!==s 且 atLeast===1 时只需判断交集>=s，可早退
  if (j !== s && atLeast === 1 && kGroupSet != null) {
    if (!intersectionAtLeastWithSet(kGroupSet, jCombination, s)) return false;
    return true;
  }
  const intersect = kGroupSet != null
    ? intersectionSizeWithSet(kGroupSet, jCombination)
    : intersectionSize(kGroup, jCombination);
  
  if (intersect < s) return false;
  
  if (j === s) {
    // j = s：要求所有 s 组合都被覆盖
    // 交集必须等于 j（即 k 组必须包含整个 j 组合）
    if (intersect !== j) return false;
    
    const sCombinations = generateCombinations(jCombination, s);
    const kSubsets = generateCombinations(kGroup.filter(x => jCombination.includes(x)), s);
    
    const kSubsetsSet = new Set(kSubsets.map(sub => sub.sort().join(',')));
    return sCombinations.every(sComb => {
      const key = sComb.sort().join(',');
      return kSubsetsSet.has(key);
    });
  } else {
    // j ≠ s：要求至少 atLeast 个 s 组合被覆盖
    // 如果交集 >= s，那么交集中的任意 s 个元素组成的 s 组合肯定在 k 组中
    // 所以至少有一个 s 组合被覆盖（当 atLeast = 1 时）
    if (atLeast === 1) {
      return intersect >= s;
    }
    
    // 如果需要至少 atLeast 个 s 组合，需要具体计算
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

// 预计算：每个 k 组覆盖的 j 组合下标列表（用于加速贪心 + 启发式排序）
// 预计算每个 k 组的 Set，避免内层 25M 次 new Set
function buildCoverageIndexes(allKGroups, allJCombinations, j, s, atLeast) {
  const kGroupSets = allKGroups.map(g => new Set(g));
  const indexes = [];
  for (let g = 0; g < allKGroups.length; g++) {
    const list = [];
    const kSet = kGroupSets[g];
    for (let i = 0; i < allJCombinations.length; i++) {
      if (coversRequirement(allKGroups[g], allJCombinations[i], j, s, atLeast, kSet)) list.push(i);
    }
    indexes.push(list);
  }
  return indexes;
}

// --- 位图加速贪心：覆盖关系用 Uint32Array 表示，用 popcount(a & ~b) 算新增覆盖 ---
function popcount32(x) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return ((x + (x >>> 4) & 0x0f0f0f0f) * 0x1010101) >>> 24;
}
function bitsetFromIndexList(indexList, numElements) {
  const len = (numElements + 31) >>> 5;
  const b = new Uint32Array(len);
  for (const i of indexList) b[i >>> 5] |= 1 << (i & 31);
  return b;
}
function popcountBitset(b) {
  let c = 0;
  for (let i = 0; i < b.length; i++) c += popcount32(b[i]);
  return c;
}
function popcountAndNot(a, b) {
  let c = 0;
  for (let i = 0; i < a.length; i++) c += popcount32(a[i] & ~b[i]);
  return c;
}
function bitsetOrInto(dest, src) {
  for (let i = 0; i < dest.length; i++) dest[i] |= src[i];
}

// Burnside 式去重：按「覆盖集合」分类，只保留每类一个代表元
// 返回 { uniqueGroups, uniqueCoverage, originalCount, uniqueCount }
function deduplicateByCoverage(allKGroups, coverageIndexes) {
  const seen = new Map(); // key -> first index
  const uniqueGroups = [];
  const uniqueCoverage = [];
  
  for (let i = 0; i < allKGroups.length; i++) {
    // 用排序后的覆盖下标列表作为等价类的 key
    const key = coverageIndexes[i].slice().sort((a, b) => a - b).join(',');
    if (!seen.has(key)) {
      seen.set(key, uniqueGroups.length);
      uniqueGroups.push(allKGroups[i]);
      uniqueCoverage.push(coverageIndexes[i]);
    }
  }
  
  return {
    uniqueGroups,
    uniqueCoverage,
    originalCount: allKGroups.length,
    uniqueCount: uniqueGroups.length
  };
}

// 贪心算法：找最少组数（近似解），Burnside 去重 + 位图加速内层
function greedySetCover(nSamples, k, j, s, atLeast = 1) {
  const allKGroupsRaw = generateCombinations(nSamples, k);
  const allJCombinations = generateCombinations(nSamples, j);
  const coverageIndexesRaw = buildCoverageIndexes(allKGroupsRaw, allJCombinations, j, s, atLeast);
  
  const { uniqueGroups, uniqueCoverage } = deduplicateByCoverage(allKGroupsRaw, coverageIndexesRaw);
  const numJ = allJCombinations.length;

  // 位图：每组的覆盖用 Uint32Array 表示，贪心轮用 popcount(groupBits & ~coveredBits) 算增益
  const coverageBits = uniqueCoverage.map(list => bitsetFromIndexList(list, numJ));
  const coveredBits = new Uint32Array((numJ + 31) >>> 5);
  const selected = [];
  const selectedIdx = new Set();

  while (popcountBitset(coveredBits) < numJ) {
    let bestIdx = -1;
    let bestNew = 0;

    for (let g = 0; g < uniqueGroups.length; g++) {
      if (selectedIdx.has(g)) continue;
      const newCov = popcountAndNot(coverageBits[g], coveredBits);
      if (newCov > bestNew) {
        bestNew = newCov;
        bestIdx = g;
      }
    }

    if (bestIdx < 0 || bestNew === 0) break;

    selected.push(uniqueGroups[bestIdx]);
    selectedIdx.add(bestIdx);
    bitsetOrInto(coveredBits, coverageBits[bestIdx]);
  }

  return selected;
}

// 分层：贪心解的后处理——移除冗余组（若某组覆盖的 j 组合均已被其他已选组覆盖则可删）
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

// 回溯算法：找精确最优解（小规模）
// 启发式：1) 先用贪心得到上界；2) k 组按“覆盖数”降序排列，优先进分支；3) 下界剪枝
function backtrackSetCover(nSamples, k, j, s, atLeast = 1, maxGroups = Infinity) {
  const allJCombinations = generateCombinations(nSamples, j);
  const allKGroupsRaw = generateCombinations(nSamples, k);
  const coverageIndexesRaw = buildCoverageIndexes(allKGroupsRaw, allJCombinations, j, s, atLeast);
  
  // Burnside 去重：只考虑本质不同的 k 组
  const { uniqueGroups, uniqueCoverage } = deduplicateByCoverage(allKGroupsRaw, coverageIndexesRaw);

  // 启发式排序：覆盖数多的 k 组排在前面
  const order = uniqueGroups.map((_, i) => i).sort((a, b) => uniqueCoverage[b].length - uniqueCoverage[a].length);
  const sortedGroups = order.map(i => uniqueGroups[i]);
  const sortedCoverage = order.map(i => uniqueCoverage[i]);

  const maxSingleCover = Math.max(...sortedCoverage.map(list => list.length), 1);

  // 上界：先跑贪心，最优解不会差于贪心解
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
    if (startIdx >= sortedGroups.length) return;

    const uncovered = allJCombinations.length - covered.size;
    const lb = Math.ceil(uncovered / maxSingleCover);
    if (selected.length + lb >= bestCount) return;

    backtrack(selected, covered, startIdx + 1);

    const currentGroup = sortedGroups[startIdx];
    const newCovered = new Set(covered);
    for (const jIdx of sortedCoverage[startIdx]) newCovered.add(jIdx);

    if (newCovered.size > covered.size) {
      selected.push(currentGroup);
      backtrack(selected, newCovered, startIdx + 1);
      selected.pop();
    }
  }

  backtrack([], new Set(), 0);
  return bestSolution;
}

// 主算法：根据规模选择回溯或贪心
function solveOptimalSamples(m, n, k, j, s, atLeast = 1, randomSamples = null) {
  // 生成 n 个样本（随机或手动）
  let nSamples;
  if (randomSamples && randomSamples.length === n) {
    nSamples = randomSamples;
  } else {
    // 随机从 1 到 m 中选 n 个
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
    // 分层：贪心后再做一层冗余移除，往往能减少组数
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

module.exports = {
  combination,
  generateCombinations,
  solveOptimalSamples,
  coversRequirement,
  buildCoverageIndexes,
  deduplicateByCoverage,
  removeRedundantGroups
};

