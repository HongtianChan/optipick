// API algorithm core. cli/src/algorithm.js re-exports this file.
// Combination count: nCk.
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

// Generate all k-combinations from arr.
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

// Count intersection size between two collections.
function intersectionSize(set1, set2) {
  const s1 = new Set(set1);
  return set2.filter(x => s1.has(x)).length;
}

// Use this when the k-group is already a Set to avoid repeated allocations.
function intersectionSizeWithSet(kGroupSet, jCombination) {
  let c = 0;
  for (const x of jCombination) if (kGroupSet.has(x)) c++;
  return c;
}
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

// Check whether a k-group covers a j-combination requirement.
function coversRequirement(kGroup, jCombination, j, s, atLeast = 1, kGroupSet = null) {
  if (j !== s && atLeast === 1 && kGroupSet != null) {
    if (!intersectionAtLeastWithSet(kGroupSet, jCombination, s)) return false;
    return true;
  }
  const intersect = kGroupSet != null
    ? intersectionSizeWithSet(kGroupSet, jCombination)
    : intersectionSize(kGroup, jCombination);
  
  if (intersect < s) return false;
  
  if (j === s) {
    // j = s: all s-combinations must be covered.
    // The k-group must contain the entire j-combination.
    if (intersect !== j) return false;
    
    const sCombinations = generateCombinations(jCombination, s);
    const kSubsets = generateCombinations(kGroup.filter(x => jCombination.includes(x)), s);
    
    const kSubsetsSet = new Set(kSubsets.map(sub => sub.sort().join(',')));
    return sCombinations.every(sComb => {
      const key = sComb.sort().join(',');
      return kSubsetsSet.has(key);
    });
  } else {
    // j != s: at least atLeast s-combinations must be covered.
    // If intersection >= s, at least one s-combination is covered when atLeast = 1.
    if (atLeast === 1) {
      return intersect >= s;
    }
    
    // For atLeast > 1, count covered s-combinations explicitly.
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

// Precompute the list of j-combination indexes covered by each k-group.
// Also precompute Sets for k-groups to avoid repeated allocations in hot loops.
function buildCoverageIndexes(allKGroups, allJCombinations, j, s, atLeast) {
  // Fast path for common heavy case: j = k and s = k - 1 with atLeast=1
  // Coverage condition becomes intersection >= k-1. We can build neighbors
  // combinatorially instead of O(|K|*|J|) pair checks.
  if (atLeast === 1 && allKGroups.length > 0 && allJCombinations.length > 0) {
    const kSize = allKGroups[0].length;
    if (j === kSize && s === kSize - 1) {
      const universe = [...new Set(allKGroups.flat())].sort((a, b) => a - b);
      const bitOf = new Map();
      for (let i = 0; i < universe.length; i++) {
        bitOf.set(universe[i], 1 << i);
      }

      const maskToIndex = new Map();
      for (let i = 0; i < allJCombinations.length; i++) {
        let mask = 0;
        for (const v of allJCombinations[i]) mask |= bitOf.get(v);
        maskToIndex.set(mask >>> 0, i);
      }

      const universeBits = universe.map((v) => bitOf.get(v));
      const indexes = [];

      for (let g = 0; g < allKGroups.length; g++) {
        const group = allKGroups[g];
        let gMask = 0;
        for (const v of group) gMask |= bitOf.get(v);
        gMask >>>= 0;

        const covered = new Set();

        const selfIdx = maskToIndex.get(gMask);
        if (selfIdx != null) covered.add(selfIdx);

        const inBits = group.map((v) => bitOf.get(v));
        for (const dropBit of inBits) {
          const baseMask = (gMask & ~dropBit) >>> 0;
          for (const addBit of universeBits) {
            if ((gMask & addBit) !== 0) continue;
            const nMask = (baseMask | addBit) >>> 0;
            const nIdx = maskToIndex.get(nMask);
            if (nIdx != null) covered.add(nIdx);
          }
        }
        indexes.push([...covered]);
      }
      return indexes;
    }
  }

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

// --- Bitset-accelerated greedy: popcount(a & ~b) gives newly covered items. ---
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

// Deduplicate candidates by coverage set; keep one representative per class.
// Returns { uniqueGroups, uniqueCoverage, originalCount, uniqueCount }.
function deduplicateByCoverage(allKGroups, coverageIndexes) {
  const seen = new Map(); // key -> first index
  const uniqueGroups = [];
  const uniqueCoverage = [];
  
  for (let i = 0; i < allKGroups.length; i++) {
    // Use sorted coverage indexes as the equivalence key.
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

// Greedy/GRASP set cover heuristic with coverage deduplication and bitsets.
function greedySetCover(nSamples, k, j, s, atLeast = 1, timeLimitMs = 4000, scanMode = 'auto') {
  const startTime = Date.now();
  const allKGroupsRaw = generateCombinations(nSamples, k);
  const allJCombinations = generateCombinations(nSamples, j);
  const coverageIndexesRaw = buildCoverageIndexes(allKGroupsRaw, allJCombinations, j, s, atLeast);
  
  // For very large candidate spaces, full dedup-by-coverage can dominate runtime.
  // In that case, directly use raw candidates to keep total latency bounded.
  const DEDUP_THRESHOLD = 12000;
  const useDedup = allKGroupsRaw.length <= DEDUP_THRESHOLD;
  const deduped = useDedup
    ? deduplicateByCoverage(allKGroupsRaw, coverageIndexesRaw)
    : { uniqueGroups: allKGroupsRaw, uniqueCoverage: coverageIndexesRaw };
  const { uniqueGroups, uniqueCoverage } = deduped;
  const numJ = allJCombinations.length;

  const coverageBits = uniqueCoverage.map(list => bitsetFromIndexList(list, numJ));
  const LARGE_CANDIDATE_THRESHOLD = 12000;
  const useStochasticScan = scanMode === 'stochastic' || (scanMode === 'auto' && uniqueGroups.length > LARGE_CANDIDATE_THRESHOLD);
  const STOCHASTIC_SAMPLE_SIZE = 1400;

  function fullScanGreedyFallback() {
    const coveredBits = new Uint32Array((numJ + 31) >>> 5);
    const selected = [];
    const selectedIdx = new Set();

    while (popcountBitset(coveredBits) < numJ) {
      let bestIdx = -1;
      let bestNewCov = 0;

      for (let g = 0; g < uniqueGroups.length; g++) {
        if (selectedIdx.has(g)) continue;
        const newCov = popcountAndNot(coverageBits[g], coveredBits);
        if (newCov > bestNewCov) {
          bestNewCov = newCov;
          bestIdx = g;
        }
      }

      if (bestIdx === -1) break;
      selected.push(uniqueGroups[bestIdx]);
      selectedIdx.add(bestIdx);
      bitsetOrInto(coveredBits, coverageBits[bestIdx]);
    }

    return popcountBitset(coveredBits) === numJ ? selected : [];
  }

  // GRASP: Greedy Randomized Adaptive Search Procedure
  // We run multiple iterations of randomized greedy to escape local optima
  let globalBest = null;

  do {
    const coveredBits = new Uint32Array((numJ + 31) >>> 5);
    const selected = [];
    const selectedIdx = new Set();

    while (popcountBitset(coveredBits) < numJ) {
      let candidates = [];
      let maxNewCov = 0;

      if (useStochasticScan) {
        const seen = new Set();
        let checked = 0;
        let attempts = 0;
        const maxAttempts = STOCHASTIC_SAMPLE_SIZE * 8;
        while (checked < STOCHASTIC_SAMPLE_SIZE && attempts < maxAttempts) {
          attempts++;
          const g = Math.floor(Math.random() * uniqueGroups.length);
          if (selectedIdx.has(g) || seen.has(g)) continue;
          seen.add(g);
          checked++;
          const newCov = popcountAndNot(coverageBits[g], coveredBits);
          if (newCov > maxNewCov) {
            maxNewCov = newCov;
            candidates = [g];
          } else if (newCov === maxNewCov && newCov > 0) {
            candidates.push(g);
          }
        }
      } else {
        for (let g = 0; g < uniqueGroups.length; g++) {
          if (selectedIdx.has(g)) continue;
          const newCov = popcountAndNot(coverageBits[g], coveredBits);
          if (newCov > maxNewCov) {
            maxNewCov = newCov;
            candidates = [g];
          } else if (newCov === maxNewCov && newCov > 0) {
            candidates.push(g);
          }
        }
      }

      if (candidates.length === 0) break;

      // Randomly pick from the best candidates to add variance
      const chosenIdx = candidates[Math.floor(Math.random() * candidates.length)];
      
      selected.push(uniqueGroups[chosenIdx]);
      selectedIdx.add(chosenIdx);
      bitsetOrInto(coveredBits, coverageBits[chosenIdx]);
    }

    if (popcountBitset(coveredBits) === numJ && (!globalBest || selected.length < globalBest.length)) {
      globalBest = selected;
    }
  } while (Date.now() - startTime < timeLimitMs);

  // Time budgets should limit optimization effort, not allow an infeasible answer.
  // If randomized GRASP does not finish a full cover, fall back to deterministic
  // full-scan greedy and spend the extra time needed to return a valid solution.
  return globalBest || fullScanGreedyFallback();
}

// Post-process greedy results by removing redundant groups.
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

// Bitset-accelerated redundant removal with multi-pass shrinking.
function removeRedundantGroupsFast(selected, allJCombinations, j, s, atLeast) {
  if (selected.length <= 1) return selected;
  const numJ = allJCombinations.length;
  const bitsLen = (numJ + 31) >>> 5;
  let result = [...selected];
  let changed = true;

  while (changed) {
    changed = false;
    const indexes = buildCoverageIndexes(result, allJCombinations, j, s, atLeast);
    const bits = indexes.map(list => bitsetFromIndexList(list, numJ));

    for (let i = result.length - 1; i >= 0; i--) {
      const unionBits = new Uint32Array(bitsLen);
      for (let g = 0; g < result.length; g++) {
        if (g === i) continue;
        bitsetOrInto(unionBits, bits[g]);
      }
      if (popcountAndNot(bits[i], unionBits) === 0) {
        result.splice(i, 1);
        bits.splice(i, 1);
        changed = true;
      }
    }
  }
  return result;
}

// Fast constructive heuristic for heavy case: j = k and s = k - 1 (atLeast = 1).
// Instead of scanning all candidate groups each step, repeatedly pick one uncovered
// k-combination and mark its radius-1 neighborhood as covered.
function fastRadiusCoverHeuristic(nSamples, k) {
  const allKGroups = generateCombinations(nSamples, k);
  const keyToIndex = new Map();
  for (let i = 0; i < allKGroups.length; i++) {
    keyToIndex.set(allKGroups[i].join(','), i);
  }

  const uncovered = new Uint8Array(allKGroups.length);
  uncovered.fill(1);
  let uncoveredCount = allKGroups.length;
  const selectedIndexes = [];
  const universe = nSamples;

  function markCovered(group) {
    const gKey = group.join(',');
    const selfIdx = keyToIndex.get(gKey);
    if (selfIdx != null && uncovered[selfIdx]) {
      uncovered[selfIdx] = 0;
      uncoveredCount--;
    }
    const gSet = new Set(group);
    for (let dropPos = 0; dropPos < group.length; dropPos++) {
      const base = group.slice(0, dropPos).concat(group.slice(dropPos + 1));
      for (const addVal of universe) {
        if (gSet.has(addVal)) continue;
        const neighbor = [...base, addVal].sort((a, b) => a - b);
        const nIdx = keyToIndex.get(neighbor.join(','));
        if (nIdx != null && uncovered[nIdx]) {
          uncovered[nIdx] = 0;
          uncoveredCount--;
        }
      }
    }
  }

  let cursor = 0;
  while (uncoveredCount > 0) {
    while (cursor < uncovered.length && uncovered[cursor] === 0) cursor++;
    if (cursor >= uncovered.length) break;
    selectedIndexes.push(cursor);
    markCovered(allKGroups[cursor]);
  }

  return selectedIndexes.map((idx) => allKGroups[idx]);
}

// Backtracking exact solver for small instances.
// Heuristics: greedy upper bound, high-coverage-first ordering, lower-bound pruning.
function backtrackSetCover(nSamples, k, j, s, atLeast = 1, maxGroups = Infinity) {
  const allJCombinations = generateCombinations(nSamples, j);
  const allKGroupsRaw = generateCombinations(nSamples, k);
  const coverageIndexesRaw = buildCoverageIndexes(allKGroupsRaw, allJCombinations, j, s, atLeast);
  
  // Consider only coverage-distinct k-groups.
  const { uniqueGroups, uniqueCoverage } = deduplicateByCoverage(allKGroupsRaw, coverageIndexesRaw);

  // Sort groups by coverage count, descending.
  const order = uniqueGroups.map((_, i) => i).sort((a, b) => uniqueCoverage[b].length - uniqueCoverage[a].length);
  const sortedGroups = order.map(i => uniqueGroups[i]);
  const sortedCoverage = order.map(i => uniqueCoverage[i]);

  const maxSingleCover = Math.max(...sortedCoverage.map(list => list.length), 1);

  // Greedy upper bound: the optimum cannot be worse than this solution.
  const greedySolution = greedySetCover(nSamples, k, j, s, atLeast, 500);
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

    const currentGroup = sortedGroups[startIdx];
    const newCovered = new Set(covered);
    for (const jIdx of sortedCoverage[startIdx]) newCovered.add(jIdx);

    if (newCovered.size > covered.size) {
      selected.push(currentGroup);
      backtrack(selected, newCovered, startIdx + 1);
      selected.pop();
    }

    backtrack(selected, covered, startIdx + 1);
  }

  backtrack([], new Set(), 0);
  return bestSolution;
}

// Main algorithm: choose exact or heuristic path by search size.
function solveOptimalSamples(m, n, k, j, s, atLeast = 1, randomSamples = null, solveMode = 'balanced') {
  // Generate n samples, either manual or random.
  let nSamples;
  if (randomSamples && randomSamples.length === n) {
    nSamples = randomSamples;
  } else {
    // Randomly select n values from 1..m.
    const all = Array.from({ length: m }, (_, i) => i + 1);
    const shuffled = all.sort(() => Math.random() - 0.5);
    nSamples = shuffled.slice(0, n).sort((a, b) => a - b);
  }
  
  const totalKGroups = combination(n, k);
  const EXACT_THRESHOLD = 30;
  const REDUNDANT_REMOVAL_THRESHOLD = 1500;
  const useExact = totalKGroups <= EXACT_THRESHOLD;
  const mode = (solveMode || 'balanced').toLowerCase();

  let result;
  let methodName;
  if (useExact) {
    result = backtrackSetCover(nSamples, k, j, s, atLeast);
    methodName = 'backtrack';
  } else {
    // Fast mode: prioritize latency on very large common case.
    if (mode === 'fast' && j === k && s === k - 1 && atLeast === 1 && totalKGroups >= 5000) {
      result = fastRadiusCoverHeuristic(nSamples, k);
      methodName = 'grasp-fast';
      return {
        samples: nSamples,
        groups: result,
        count: result.length,
        method: methodName
      };
    }
    const graspBudgetMs = mode === 'quality' ? 15000 : (mode === 'fast' ? 2200 : 3500);
    const scanMode = mode === 'quality' ? 'full' : 'auto';
    result = greedySetCover(nSamples, k, j, s, atLeast, graspBudgetMs, scanMode);
    const allJ = generateCombinations(nSamples, j);
    if (mode === 'quality') {
      result = removeRedundantGroupsFast(result, allJ, j, s, atLeast);
    } else if (totalKGroups <= REDUNDANT_REMOVAL_THRESHOLD) {
      result = removeRedundantGroups(result, allJ, j, s, atLeast);
    }
    methodName = mode === 'quality' ? 'grasp-quality' : (mode === 'fast' ? 'grasp-fast' : 'grasp');
  }

  return {
    samples: nSamples,
    groups: result,
    count: result.length,
    method: methodName
  };
}

module.exports = { solveOptimalSamples };

