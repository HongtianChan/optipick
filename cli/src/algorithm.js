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

// 检查 k 组是否覆盖 j 组合的要求
function coversRequirement(kGroup, jCombination, j, s, atLeast = 1) {
  const intersect = intersectionSize(kGroup, jCombination);
  
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

// 贪心算法：找最少组数（近似解）
function greedySetCover(nSamples, k, j, s, atLeast = 1) {
  const allKGroups = generateCombinations(nSamples, k);
  const allJCombinations = generateCombinations(nSamples, j);
  
  const selected = [];
  const covered = new Set();
  
  while (covered.size < allJCombinations.length) {
    let bestGroup = null;
    let bestCoverage = 0;
    
    for (const kGroup of allKGroups) {
      if (selected.some(sel => JSON.stringify(sel) === JSON.stringify(kGroup))) {
        continue; // 已选择
      }
      
      let newCoverage = 0;
      for (let i = 0; i < allJCombinations.length; i++) {
        if (covered.has(i)) continue;
        
        if (coversRequirement(kGroup, allJCombinations[i], j, s, atLeast)) {
          newCoverage++;
        }
      }
      
      if (newCoverage > bestCoverage) {
        bestCoverage = newCoverage;
        bestGroup = kGroup;
      }
    }
    
    if (!bestGroup || bestCoverage === 0) break;
    
    selected.push(bestGroup);
    
    // 标记新覆盖的 j 组合
    for (let i = 0; i < allJCombinations.length; i++) {
      if (!covered.has(i) && coversRequirement(bestGroup, allJCombinations[i], j, s, atLeast)) {
        covered.add(i);
      }
    }
  }
  
  return selected;
}

// 回溯算法：找精确最优解（小规模）
function backtrackSetCover(nSamples, k, j, s, atLeast = 1, maxGroups = Infinity) {
  const allKGroups = generateCombinations(nSamples, k);
  const allJCombinations = generateCombinations(nSamples, j);
  
  let bestSolution = null;
  let bestCount = Infinity;
  
  function backtrack(selected, covered, startIdx) {
    // 剪枝：如果当前解已经不可能更优
    if (selected.length >= bestCount) return;
    
    // 检查是否全部覆盖
    if (covered.size === allJCombinations.length) {
      if (selected.length < bestCount) {
        bestCount = selected.length;
        bestSolution = selected.map(g => [...g]);
      }
      return;
    }
    
    // 剪枝：如果剩余组数不够
    if (startIdx >= allKGroups.length) return;
    if (selected.length + 1 >= bestCount) return;
    
    // 尝试不选当前组
    backtrack(selected, covered, startIdx + 1);
    
    // 尝试选当前组
    const currentGroup = allKGroups[startIdx];
    const newCovered = new Set(covered);
    
    for (let i = 0; i < allJCombinations.length; i++) {
      if (!newCovered.has(i) && coversRequirement(currentGroup, allJCombinations[i], j, s, atLeast)) {
        newCovered.add(i);
      }
    }
    
    if (newCovered.size > covered.size) {
      selected.push(currentGroup);
      backtrack(selected, newCovered, startIdx + 1);
      selected.pop();
    }
  }
  
  backtrack([], new Set(), 0);
  
  return bestSolution || [];
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
  
  // 根据规模选择算法
  const totalKGroups = combination(n, k);
  const useExact = totalKGroups <= 100; // 小规模用精确算法
  
  let result;
  if (useExact) {
    result = backtrackSetCover(nSamples, k, j, s, atLeast);
  } else {
    result = greedySetCover(nSamples, k, j, s, atLeast);
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
  coversRequirement
};

