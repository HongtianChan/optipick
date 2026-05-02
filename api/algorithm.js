// API algorithm core. cli/src/algorithm.js re-exports this file.
// combination count: nCk.
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

// Invoke `fn` once per r-element sub-multiset of `arr` (in sorted order, same as generateCombinations order).
// When r=0, calls `fn` once with `[]` (k-subset built from G only, none from outside).
function forEachCombination(arr, r, fn) {
  if (r < 0) return;
  if (r === 0) {
    fn([]);
    return;
  }
  if (r > arr.length) return;
  const n = arr.length;
  const chosen = [];
  function rec(start) {
    if (chosen.length === r) {
      fn(chosen.slice());
      return;
    }
    for (let i = start; i <= n - (r - chosen.length); i++) {
      chosen.push(arr[i]);
      rec(i + 1);
      chosen.pop();
    }
  }
  rec(0);
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
    // j = k, atLeast = 1: coverage iff |G ∩ R| >= s. Enumerate R from t elements of G and
    // (k-t) of (universe \ G) for t in [s, k] — O(|G| * sum_t C(k,t)C(n-k,k-t)) instead of O(|G|·|J|).
    if (j === kSize && atLeast === 1) {
      const universe = [...new Set(allKGroups.flat())].sort((a, b) => a - b);
      // 32-bit bitmask needs n<=31; product n<=25, always ok here.
      if (universe.length <= 31) {
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
        const indexes = [];
        for (let g = 0; g < allKGroups.length; g++) {
          const group = allKGroups[g];
          const gSet = new Set(group);
          const inG = group.slice();
          const outside = universe.filter((x) => !gSet.has(x));
          const covered = new Set();
          for (let t = s; t <= kSize; t++) {
            const rem = kSize - t;
            if (rem < 0 || rem > outside.length) continue;
            forEachCombination(inG, t, (fromG) => {
              forEachCombination(outside, rem, (fromO) => {
                let m = 0;
                for (let a = 0; a < fromG.length; a++) m |= bitOf.get(fromG[a]);
                for (let a = 0; a < fromO.length; a++) m |= bitOf.get(fromO[a]);
                m >>>= 0;
                const idx = maskToIndex.get(m);
                if (idx != null) covered.add(idx);
              });
            });
          }
          indexes.push([...covered].sort((a, b) => a - b));
        }
        return indexes;
      }
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

// Precompute { uniqueGroups, uniqueCoverage, numJ } for canonical samples [1..n] (for offline precache / introspection).
function buildCanonicalCoverageState(n, k, j, s, atLeast) {
  const nSamples = Array.from({ length: n }, (_, i) => i + 1);
  const allKGroupsRaw = generateCombinations(nSamples, k);
  const allJCombinations = generateCombinations(nSamples, j);
  const coverageIndexesRaw = buildCoverageIndexes(allKGroupsRaw, allJCombinations, j, s, atLeast);
  const DEDUP_THRESHOLD = 12000;
  const useDedup = allKGroupsRaw.length <= DEDUP_THRESHOLD;
  const deduped = useDedup
    ? deduplicateByCoverage(allKGroupsRaw, coverageIndexesRaw)
    : { uniqueGroups: allKGroupsRaw, uniqueCoverage: coverageIndexesRaw };
  return {
    n, k, j, s, atLeast,
    numJ: allJCombinations.length,
    nK: allKGroupsRaw.length,
    uniqueCount: deduped.uniqueGroups.length,
    uniqueGroups: deduped.uniqueGroups,
    uniqueCoverage: deduped.uniqueCoverage
  };
}

// GRASP set cover heuristic with reactive alpha, local search, and path relinking.
function greedySetCover(nSamples, k, j, s, atLeast = 1, timeLimitMs = 4000, scanMode = 'auto') {
  const startTime = Date.now();
  const deadlineMs = startTime + timeLimitMs;
  const constructShare = timeLimitMs >= 10000 ? 0.76 : 0.78;
  // Long budgets: two construction waves with reset state (diversity) without
  // repeating the O(C(n,k)·C(n,j)) precomputation.
  const totalConstructMs = Math.floor(timeLimitMs * constructShare);
  const CONSTRUCTION_WAVES =
    timeLimitMs >= 95000 ? 4 :
    timeLimitMs >= 50000 ? 3 :
    (timeLimitMs >= 35000 ? 2 : 1);
  const perWaveConstruct = Math.max(1, Math.floor(totalConstructMs / CONSTRUCTION_WAVES));

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

  const LARGE_CANDIDATE_THRESHOLD = 12000;
  const useStochasticScan = scanMode === 'stochastic' || (scanMode === 'auto' && uniqueGroups.length > LARGE_CANDIDATE_THRESHOLD);
  const STOCHASTIC_SAMPLE_SIZE = timeLimitMs >= 10000 ? 2400 : 1400;
  const ELITE_POOL_SIZE =
    timeLimitMs >= 95000 ? 14 :
    (timeLimitMs >= 10000 ? 10 : 6);
  // Alpha controls RCL breadth (0 => greedy, 1 => broad randomization).
  // Keep a spread from greedy to exploratory and let reactive choice adapt.
  const ALPHA_LEVELS = [0.1, 0.2, 0.35, 0.5, 0.7];
  const alphaUseCount = new Uint32Array(ALPHA_LEVELS.length);
  const alphaObjectiveSum = new Float64Array(ALPHA_LEVELS.length);

  // Rare requirements should be prioritized: they usually become bottlenecks.
  const requirementFrequency = new Uint32Array(numJ);
  let totalFrequency = 0;
  for (const list of uniqueCoverage) {
    for (const reqIdx of list) {
      requirementFrequency[reqIdx]++;
      totalFrequency++;
    }
  }
  const avgFrequency = Math.max(1, totalFrequency / Math.max(1, numJ));
  const requirementWeight = new Float64Array(numJ);
  for (let i = 0; i < numJ; i++) {
    const freq = Math.max(1, requirementFrequency[i]);
    // Clamp weights to avoid over-fixating on ultra-rare edges.
    const rarity = Math.pow(avgFrequency / freq, 1.1);
    requirementWeight[i] = Math.min(8, Math.max(0.2, rarity));
  }
  const groupRarityScore = new Float64Array(uniqueGroups.length);
  for (let g = 0; g < uniqueGroups.length; g++) {
    let score = 0;
    const list = uniqueCoverage[g];
    for (let i = 0; i < list.length; i++) score += requirementWeight[list[i]];
    groupRarityScore[g] = score;
  }

  function scoreCandidateGain(groupIdx, uncoveredFlags) {
    const list = uniqueCoverage[groupIdx];
    let newCov = 0;
    let weightedGain = 0;
    for (let i = 0; i < list.length; i++) {
      const reqIdx = list[i];
      if (!uncoveredFlags[reqIdx]) continue;
      newCov++;
      weightedGain += requirementWeight[reqIdx];
    }
    return { newCov, weightedGain };
  }

  function applyGroup(groupIdx, uncoveredFlags, state) {
    const list = uniqueCoverage[groupIdx];
    for (let i = 0; i < list.length; i++) {
      const reqIdx = list[i];
      if (!uncoveredFlags[reqIdx]) continue;
      uncoveredFlags[reqIdx] = 0;
      state.uncoveredCount--;
    }
  }

  function buildStateFromSelected(selectedIndexes) {
    const uncoveredFlags = new Uint8Array(numJ);
    uncoveredFlags.fill(1);
    const selectedFlags = new Uint8Array(uniqueGroups.length);
    const state = { uncoveredCount: numJ };
    for (let i = 0; i < selectedIndexes.length; i++) {
      const idx = selectedIndexes[i];
      if (selectedFlags[idx]) continue;
      selectedFlags[idx] = 1;
      applyGroup(idx, uncoveredFlags, state);
    }
    return { uncoveredFlags, selectedFlags, state };
  }

  function pickFromRCL(uncoveredFlags, selectedFlags, alpha) {
    let maxScore = -Infinity;
    let minScore = Infinity;
    const scored = [];

    function evaluate(groupIdx) {
      const gain = scoreCandidateGain(groupIdx, uncoveredFlags);
      if (gain.newCov <= 0) return;
      const score = gain.weightedGain + 0.15 * gain.newCov;
      scored.push({ groupIdx, score });
      if (score > maxScore) maxScore = score;
      if (score < minScore) minScore = score;
    }

    if (useStochasticScan) {
      const seen = new Set();
      let checked = 0;
      let attempts = 0;
      const maxAttempts = STOCHASTIC_SAMPLE_SIZE * 8;
      while (checked < STOCHASTIC_SAMPLE_SIZE && attempts < maxAttempts) {
        attempts++;
        const groupIdx = Math.floor(Math.random() * uniqueGroups.length);
        if (selectedFlags[groupIdx] || seen.has(groupIdx)) continue;
        seen.add(groupIdx);
        checked++;
        evaluate(groupIdx);
      }
    } else {
      for (let groupIdx = 0; groupIdx < uniqueGroups.length; groupIdx++) {
        if (selectedFlags[groupIdx]) continue;
        evaluate(groupIdx);
      }
    }

    if (scored.length === 0) return -1;
    if (maxScore === minScore) {
      return scored[Math.floor(Math.random() * scored.length)].groupIdx;
    }

    const threshold = maxScore - alpha * (maxScore - minScore);

    let totalRclWeight = 0;
    const rcl = [];
    for (let i = 0; i < scored.length; i++) {
      if (scored[i].score < threshold) continue;
      rcl.push(scored[i]);
      totalRclWeight += scored[i].score;
    }
    if (rcl.length === 0) return scored[0].groupIdx;
    if (totalRclWeight <= 0) return rcl[Math.floor(Math.random() * rcl.length)].groupIdx;

    let ticket = Math.random() * totalRclWeight;
    for (let i = 0; i < rcl.length; i++) {
      ticket -= rcl[i].score;
      if (ticket <= 0) return rcl[i].groupIdx;
    }
    return rcl[rcl.length - 1].groupIdx;
  }

  function runGraspConstruction(iterDeadlineMs, alpha) {
    const uncoveredFlags = new Uint8Array(numJ);
    uncoveredFlags.fill(1);
    const selectedFlags = new Uint8Array(uniqueGroups.length);
    const state = { uncoveredCount: numJ };
    const selected = [];

    while (state.uncoveredCount > 0) {
      if (Date.now() >= iterDeadlineMs) return null;
      const chosenIdx = pickFromRCL(uncoveredFlags, selectedFlags, alpha);
      if (chosenIdx === -1) return null;
      selected.push(chosenIdx);
      selectedFlags[chosenIdx] = 1;
      applyGroup(chosenIdx, uncoveredFlags, state);
    }
    return selected;
  }

  function fullScanGreedyFallbackIndexes() {
    const uncoveredFlags = new Uint8Array(numJ);
    uncoveredFlags.fill(1);
    const selectedFlags = new Uint8Array(uniqueGroups.length);
    const state = { uncoveredCount: numJ };
    const selected = [];

    while (state.uncoveredCount > 0) {
      let bestIdx = -1;
      let bestNewCov = 0;
      let bestWeightedGain = -Infinity;

      for (let g = 0; g < uniqueGroups.length; g++) {
        if (selectedFlags[g]) continue;
        const gain = scoreCandidateGain(g, uncoveredFlags);
        if (gain.newCov > bestNewCov || (gain.newCov === bestNewCov && gain.weightedGain > bestWeightedGain)) {
          bestIdx = g;
          bestNewCov = gain.newCov;
          bestWeightedGain = gain.weightedGain;
        }
      }

      if (bestIdx === -1) break;
      selected.push(bestIdx);
      selectedFlags[bestIdx] = 1;
      applyGroup(bestIdx, uncoveredFlags, state);
    }

    return state.uncoveredCount === 0 ? selected : [];
  }

  function pruneRedundantIndexes(indexes) {
    if (indexes.length <= 1) return indexes.slice();
    const result = indexes.slice();
    const coverCount = new Uint32Array(numJ);
    for (let i = 0; i < result.length; i++) {
      const list = uniqueCoverage[result[i]];
      for (let t = 0; t < list.length; t++) coverCount[list[t]]++;
    }

    for (let i = result.length - 1; i >= 0; i--) {
      const list = uniqueCoverage[result[i]];
      let removable = true;
      for (let t = 0; t < list.length; t++) {
        if (coverCount[list[t]] <= 1) {
          removable = false;
          break;
        }
      }
      if (!removable) continue;
      for (let t = 0; t < list.length; t++) coverCount[list[t]]--;
      result.splice(i, 1);
    }
    return result;
  }

  const elitePool = [];
  const eliteSignatures = new Set();
  function solutionSignature(indexes) {
    const sorted = indexes.slice().sort((a, b) => a - b);
    return sorted.join(',');
  }
  function addEliteCandidate(indexes) {
    if (!indexes || indexes.length === 0) return;
    const sig = solutionSignature(indexes);
    if (eliteSignatures.has(sig)) return;
    if (elitePool.length < ELITE_POOL_SIZE) {
      elitePool.push(indexes.slice());
      eliteSignatures.add(sig);
      return;
    }
    let worstPos = -1;
    let worstLen = -Infinity;
    for (let i = 0; i < elitePool.length; i++) {
      if (elitePool[i].length > worstLen) {
        worstLen = elitePool[i].length;
        worstPos = i;
      }
    }
    if (indexes.length >= worstLen) return;
    eliteSignatures.delete(solutionSignature(elitePool[worstPos]));
    elitePool[worstPos] = indexes.slice();
    eliteSignatures.add(sig);
  }

  function selectReactiveAlphaIndex() {
    let minUse = Infinity;
    for (let i = 0; i < alphaUseCount.length; i++) {
      if (alphaUseCount[i] < minUse) minUse = alphaUseCount[i];
    }
    // Bootstrap uniformly: force each alpha to be tested a few times.
    if (minUse < 1) {
      const bucket = [];
      for (let i = 0; i < alphaUseCount.length; i++) {
        if (alphaUseCount[i] === minUse) bucket.push(i);
      }
      return bucket[Math.floor(Math.random() * bucket.length)];
    }

    let bestAvg = Infinity;
    const avgObj = new Float64Array(alphaUseCount.length);
    for (let i = 0; i < alphaUseCount.length; i++) {
      const avg = alphaObjectiveSum[i] / Math.max(1, alphaUseCount[i]);
      avgObj[i] = avg;
      if (avg < bestAvg) bestAvg = avg;
    }

    // Better (lower) objective should have higher probability.
    let totalWeight = 0;
    const weights = new Float64Array(alphaUseCount.length);
    for (let i = 0; i < alphaUseCount.length; i++) {
      const ratio = bestAvg / Math.max(1, avgObj[i]);
      const w = Math.pow(ratio, 4);
      weights[i] = w;
      totalWeight += w;
    }
    if (totalWeight <= 0) return Math.floor(Math.random() * alphaUseCount.length);

    let ticket = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      ticket -= weights[i];
      if (ticket <= 0) return i;
    }
    return weights.length - 1;
  }

  function recordReactiveAlpha(alphaIdx, solutionLen) {
    alphaUseCount[alphaIdx]++;
    alphaObjectiveSum[alphaIdx] += solutionLen;
  }

  function repairFromPartial(partialIndexes, localDeadlineMs) {
    const stateBundle = buildStateFromSelected(partialIndexes);
    const selected = partialIndexes.slice();

    while (stateBundle.state.uncoveredCount > 0) {
      if (Date.now() >= localDeadlineMs) return null;
      const chosenIdx = pickFromRCL(stateBundle.uncoveredFlags, stateBundle.selectedFlags, 0.2);
      if (chosenIdx === -1) return null;
      selected.push(chosenIdx);
      stateBundle.selectedFlags[chosenIdx] = 1;
      applyGroup(chosenIdx, stateBundle.uncoveredFlags, stateBundle.state);
    }
    return selected;
  }

  function improveWithLocalSearch(seedIndexes, localDeadlineMs) {
    if (!seedIndexes || seedIndexes.length <= 1) return seedIndexes ? seedIndexes.slice() : [];
    let best = pruneRedundantIndexes(seedIndexes);
    let stagnation = 0;
    const STAGNATION_LIMIT = timeLimitMs >= 95000 ? 22 : 12;

    while (Date.now() < localDeadlineMs && stagnation < STAGNATION_LIMIT) {
      if (best.length <= 1) break;
      const candidate = best.slice();
      const removeRatio = 0.08 + Math.random() * 0.14;
      const removeCount = Math.max(1, Math.min(candidate.length - 1, Math.floor(candidate.length * removeRatio)));
      for (let r = 0; r < removeCount; r++) {
        const pos = Math.floor(Math.random() * candidate.length);
        candidate.splice(pos, 1);
      }
      const repaired = repairFromPartial(candidate, localDeadlineMs);
      if (!repaired) {
        stagnation++;
        continue;
      }
      const compact = pruneRedundantIndexes(repaired);
      if (compact.length < best.length) {
        best = compact;
        stagnation = 0;
      } else {
        stagnation++;
      }
    }
    return best;
  }

  function pathRelinkBetween(fromIndexes, toIndexes, relinkDeadlineMs) {
    if (!fromIndexes || !toIndexes) return null;
    let current = pruneRedundantIndexes(fromIndexes);
    let best = current.slice();
    const targetSet = new Set(toIndexes);
    const currentSet = new Set(current);
    let pendingAdds = toIndexes
      .filter((idx) => !currentSet.has(idx))
      .sort((a, b) => groupRarityScore[b] - groupRarityScore[a]);

    while (pendingAdds.length > 0 && Date.now() < relinkDeadlineMs) {
      const addIdx = pendingAdds.shift();
      currentSet.add(addIdx);

      // Favor moving toward target structure by removing one non-target group.
      const removable = [];
      for (const idx of currentSet) {
        if (!targetSet.has(idx)) removable.push(idx);
      }
      if (removable.length > 0) {
        const removeIdx = removable[Math.floor(Math.random() * removable.length)];
        currentSet.delete(removeIdx);
      }

      const repaired = repairFromPartial(Array.from(currentSet), relinkDeadlineMs);
      if (!repaired) break;
      current = pruneRedundantIndexes(repaired);
      currentSet.clear();
      for (let i = 0; i < current.length; i++) currentSet.add(current[i]);
      pendingAdds = pendingAdds.filter((idx) => !currentSet.has(idx));

      if (current.length < best.length) {
        best = current.slice();
      }
    }
    return best;
  }

  function relinkElitePool(seedBest, relinkDeadlineMs) {
    let best = seedBest.slice();
    if (elitePool.length < 2) return best;

    const compactElite = elitePool
      .map((sol) => pruneRedundantIndexes(sol))
      .sort((a, b) => a.length - b.length)
      .slice(0, Math.min(ELITE_POOL_SIZE, 6));

    for (let i = 0; i < compactElite.length && Date.now() < relinkDeadlineMs; i++) {
      for (let j = i + 1; j < compactElite.length && Date.now() < relinkDeadlineMs; j++) {
        const a = compactElite[i];
        const b = compactElite[j];
        const childAB = pathRelinkBetween(a, b, relinkDeadlineMs);
        if (childAB && childAB.length < best.length) best = childAB;
        if (Date.now() >= relinkDeadlineMs) break;
        const childBA = pathRelinkBetween(b, a, relinkDeadlineMs);
        if (childBA && childBA.length < best.length) best = childBA;
      }
    }
    return best;
  }

  let bestConstruction = null;
  for (let wave = 0; wave < CONSTRUCTION_WAVES; wave++) {
    const waveEnd = startTime + Math.min(totalConstructMs, (wave + 1) * perWaveConstruct);
    elitePool.length = 0;
    eliteSignatures.clear();
    alphaUseCount.fill(0);
    alphaObjectiveSum.fill(0);

    let globalBestIndexes = null;
    do {
      const alphaIdx = selectReactiveAlphaIndex();
      const candidate = runGraspConstruction(waveEnd, ALPHA_LEVELS[alphaIdx]);
      if (!candidate) continue;
      recordReactiveAlpha(alphaIdx, candidate.length);
      addEliteCandidate(candidate);
      if (!globalBestIndexes || candidate.length < globalBestIndexes.length) {
        globalBestIndexes = candidate.slice();
      }
    } while (Date.now() < waveEnd);

    if (globalBestIndexes) {
      if (!bestConstruction || globalBestIndexes.length < bestConstruction.length) {
        bestConstruction = globalBestIndexes;
      }
    }
  }

  // Time budgets should limit optimization effort, not allow an infeasible answer.
  // If randomized GRASP does not finish a full cover, fall back to deterministic
  // full-scan greedy and spend the extra time needed to return a valid solution.
  let bestIndexes = bestConstruction || fullScanGreedyFallbackIndexes();
  if (bestIndexes.length === 0) return [];
  addEliteCandidate(bestIndexes);

  // Light local search: destroy-and-repair from the best construction.
  if (Date.now() < deadlineMs - 20 && bestIndexes.length > 1) {
    bestIndexes = improveWithLocalSearch(bestIndexes, deadlineMs);
  } else {
    bestIndexes = pruneRedundantIndexes(bestIndexes);
  }
  addEliteCandidate(bestIndexes);

  // Elite-pool path relinking: combine high-quality elites to escape local minima.
  if (Date.now() < deadlineMs - 20 && elitePool.length >= 2 && bestIndexes.length > 1) {
    const relinked = relinkElitePool(bestIndexes, deadlineMs);
    if (relinked && relinked.length < bestIndexes.length) {
      bestIndexes = relinked;
    }
  }
  bestIndexes = pruneRedundantIndexes(bestIndexes);

  return bestIndexes.map((idx) => uniqueGroups[idx]);
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

// Map canonical rank 1..n to actual sample pool values (sorted selection).
function mapCanonicalGroupsToActual(groups, sortedValues) {
  return groups.map((g) => g.map((r) => sortedValues[r - 1]));
}

// Main algorithm: choose exact or heuristic path by search size.
// Internally always solves on canonical [1..n] so combinatorics match precomputed / teacher tables; results map back to actual values.
function solveOptimalSamples(m, n, k, j, s, atLeast = 1, randomSamples = null, solveMode = 'balanced') {
  let sortedValues;
  if (randomSamples && randomSamples.length === n) {
    sortedValues = [...randomSamples].sort((a, b) => a - b);
  } else {
    const all = Array.from({ length: m }, (_, i) => i + 1);
    const shuffled = all.sort(() => Math.random() - 0.5);
    sortedValues = shuffled.slice(0, n).sort((a, b) => a - b);
  }
  const nSamples = Array.from({ length: n }, (_, i) => i + 1);
  
  const totalKGroups = combination(n, k);
  // Exact backtracking stays tractable here; tens of thousands of candidates still route to GRASP.
  const EXACT_THRESHOLD = 120;
  const REDUNDANT_REMOVAL_THRESHOLD = 1500;
  const useExact = totalKGroups <= EXACT_THRESHOLD;
  // Legacy alias: treat `deep` like `quality` so old clients keep working.
  let mode = (solveMode || 'balanced').toLowerCase();
  if (mode === 'deep') mode = 'quality';

  let result;
  let methodName;
  if (useExact) {
    result = backtrackSetCover(nSamples, k, j, s, atLeast);
    result = mapCanonicalGroupsToActual(result, sortedValues);
    methodName = 'backtrack';
  } else {
    // Per-mode GRASP wall time (milliseconds): fast 15s, balanced 45s, quality 60s.
    let graspBudgetMs =
      mode === 'quality' ? 60000 :
      mode === 'balanced' ? 45000 :
      15000;
    const envMs = process.env.OSS_GRASP_MS;
    if (envMs != null) {
      const v = Number(envMs);
      if (Number.isFinite(v) && v >= 3000) graspBudgetMs = Math.floor(v);
    }
    const scanMode = mode === 'fast' ? 'auto' : 'full';
    result = greedySetCover(nSamples, k, j, s, atLeast, graspBudgetMs, scanMode);
    const allJ = generateCombinations(nSamples, j);
    if (mode === 'balanced' || mode === 'quality') {
      result = removeRedundantGroupsFast(result, allJ, j, s, atLeast);
    } else if (totalKGroups <= REDUNDANT_REMOVAL_THRESHOLD) {
      result = removeRedundantGroups(result, allJ, j, s, atLeast);
    }
    result = mapCanonicalGroupsToActual(result, sortedValues);
    methodName = mode === 'quality' ? 'grasp-quality' : (mode === 'fast' ? 'grasp-fast' : 'grasp');
  }

  return {
    samples: sortedValues,
    groups: result,
    count: result.length,
    method: methodName
  };
}

module.exports = { solveOptimalSamples, buildCanonicalCoverageState };

