// 复制算法核心代码到 api 目录，避免路径问题
// 组合数计算：nCk
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

// 生成所有组合
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
    if (atLeast === 1) {
      return intersect >= s;
    }
    
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
        continue;
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
    
    for (let i = 0; i < allJCombinations.length; i++) {
      if (!covered.has(i) && coversRequirement(bestGroup, allJCombinations[i], j, s, atLeast)) {
        covered.add(i);
      }
    }
  }
  
  return selected;
}

function backtrackSetCover(nSamples, k, j, s, atLeast = 1, maxGroups = Infinity) {
  const allKGroups = generateCombinations(nSamples, k);
  const allJCombinations = generateCombinations(nSamples, j);
  
  let bestSolution = null;
  let bestCount = Infinity;
  
  function backtrack(selected, covered, startIdx) {
    if (selected.length >= bestCount) return;
    
    if (covered.size === allJCombinations.length) {
      if (selected.length < bestCount) {
        bestCount = selected.length;
        bestSolution = selected.map(g => [...g]);
      }
      return;
    }
    
    if (startIdx >= allKGroups.length) return;
    if (selected.length + 1 >= bestCount) return;
    
    backtrack(selected, covered, startIdx + 1);
    
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
  }
  
  return {
    samples: nSamples,
    groups: result,
    count: result.length,
    method: useExact ? 'backtrack' : 'greedy'
  };
}

module.exports = { solveOptimalSamples };
