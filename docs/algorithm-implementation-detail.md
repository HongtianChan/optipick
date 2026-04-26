# Algorithm Implementation Detail

This document explains how Optipick implements the optimal sample group selection algorithm, down to the main functions used in code.

Main files:

- `api/algorithm.js`: solver implementation
- `api/verify-core.js`: independent result verification
- `api/solve.js`: hosted solve endpoint
- `cli/src/algorithm.js`: local CLI/server re-export of `api/algorithm.js`

---

## 1. Problem Model

The system receives:

- `m`: total sample pool size
- `n`: number of selected samples
- `k`: group size
- `j`: constraint subset size
- `s`: covered subset size
- `atLeast`: minimum number of covered `s`-subsets required inside each `j`-combination

After the `n` samples are fixed, the algorithm:

1. Enumerates all possible `k`-groups from the `n` samples.
2. Enumerates all required `j`-combinations from the same `n` samples.
3. Treats every `j`-combination as a constraint to cover.
4. Treats every `k`-group as a candidate set that may cover some constraints.
5. Solves a set-cover style problem: choose as few `k`-groups as possible while covering all required `j`-combinations.

For small search spaces, the project uses exact backtracking. For large search spaces, it uses time-bounded GRASP-style greedy heuristics.

---

## 2. `api/algorithm.js`

### `combination(n, k)`

Purpose: calculate the binomial coefficient `C(n, k)`.

How it works:

- Handles invalid or trivial cases first.
- Uses `k = min(k, n-k)` to reduce multiplication steps.
- Iteratively computes:

```text
C(n,k) = n*(n-1)*...*(n-k+1) / k!
```

Where used:

- `solveOptimalSamples()` uses it to decide whether the search space is small enough for exact backtracking.

Why it matters:

- The branch decision is based on `C(n,k) <= 30`.

---

### `generateCombinations(arr, k)`

Purpose: enumerate all `k`-element combinations from an array.

How it works:

- Uses recursive backtracking.
- Maintains a temporary `current` array.
- When `current.length === k`, it pushes a copy into `result`.

Where used:

- Generates all candidate `k`-groups.
- Generates all required `j`-combinations.
- Generates inner `s`-combinations when exact coverage counting is needed.

Complexity note:

- Output size is `C(arr.length, k)`, so this function is naturally expensive for large inputs.

---

### `intersectionSize(set1, set2)`

Purpose: count how many values two collections share.

How it works:

- Converts `set1` into a JavaScript `Set`.
- Counts how many items from `set2` exist in that set.

Where used:

- Fallback path inside `coversRequirement()` when a prebuilt Set is not provided.

---

### `intersectionSizeWithSet(kGroupSet, jCombination)`

Purpose: count intersection size when the `k`-group is already a `Set`.

How it works:

- Iterates over `jCombination`.
- Increments a counter for values contained in `kGroupSet`.

Why it exists:

- Avoids repeatedly constructing `new Set(kGroup)` in hot loops.

Where used:

- `coversRequirement()`
- `buildCoverageIndexes()`

---

### `intersectionAtLeastWithSet(kGroupSet, jCombination, s)`

Purpose: fast yes/no check for whether intersection size reaches `s`.

How it works:

- Iterates over `jCombination`.
- Stops immediately once `s` shared values are found.

Why it exists:

- For the common case `j !== s` and `atLeast === 1`, the algorithm only needs to know whether at least one `s`-subset is covered.
- If the intersection has at least `s` items, then at least one `s`-combination exists inside the `k`-group.

---

### `coversRequirement(kGroup, jCombination, j, s, atLeast = 1, kGroupSet = null)`

Purpose: decide whether one candidate `k`-group covers one `j`-combination constraint.

This is the key semantic function.

Cases:

1. `j === s`
   - The requirement becomes strict.
   - A `k`-group covers the `j`-combination only if it contains the whole `j`-combination.
   - In practice, intersection size must equal `j`.

2. `j !== s` and `atLeast === 1`
   - Fast path.
   - If intersection size is at least `s`, the group covers at least one required `s`-combination.

3. `j !== s` and `atLeast > 1`
   - Enumerates all `s`-combinations inside the `j`-combination.
   - Enumerates all relevant `s`-subsets inside the candidate group.
   - Counts how many required `s`-combinations are covered.
   - Returns true once `covered >= atLeast`.

Where used:

- `buildCoverageIndexes()`
- `removeRedundantGroups()`

Why it matters:

- This function defines what "covered" means in the project.

---

### `buildCoverageIndexes(allKGroups, allJCombinations, j, s, atLeast)`

Purpose: precompute which `j`-combination indexes each `k`-group covers.

Output shape:

```js
[
  [0, 3, 7],   // k-group 0 covers j-combination indexes 0, 3, 7
  [1, 4, 8],
  ...
]
```

Normal path:

- Converts each `k`-group to a `Set`.
- For each candidate group, tests it against every `j`-combination with `coversRequirement()`.
- Saves the indexes that pass.

Optimized path:

- Triggered when:
  - `atLeast === 1`
  - `j === k`
  - `s === k - 1`

Why this case is special:

- A `k`-group covers a `j`-combination if they differ by at most one element.
- The implementation builds bit masks for combinations and directly marks the group itself plus all radius-1 neighbors.
- This avoids checking every candidate against every constraint.

Why it matters:

- Coverage precomputation is the bridge between the original combinatorial problem and set cover.

---

## 3. Bitset Helpers

These helpers make greedy coverage counting faster.

### `popcount32(x)`

Purpose: count how many 1-bits exist in a 32-bit integer.

Where used:

- `popcountBitset()`
- `popcountAndNot()`

Why it matters:

- Set-cover greedy repeatedly asks: "How many new constraints would this candidate cover?"
- Bit operations make that much faster than using JavaScript `Set` operations.

---

### `bitsetFromIndexList(indexList, numElements)`

Purpose: convert a list of covered indexes into a compact `Uint32Array` bitset.

Example:

```text
covered indexes: [0, 2, 5]
bitset: bit 0 = 1, bit 2 = 1, bit 5 = 1
```

Where used:

- `greedySetCover()`

---

### `popcountBitset(b)`

Purpose: count how many constraints are covered in a full bitset.

Where used:

- `greedySetCover()` uses it to know whether all `j`-constraints are covered.

---

### `popcountAndNot(a, b)`

Purpose: count how many bits are in `a` but not yet in `b`.

Meaning in this project:

- `a`: constraints covered by a candidate group
- `b`: constraints already covered by selected groups
- `a & ~b`: newly covered constraints if this candidate is selected

Where used:

- Core scoring step in `greedySetCover()`.

---

### `bitsetOrInto(dest, src)`

Purpose: merge one coverage bitset into another.

Meaning:

- After selecting a candidate group, its covered constraints are added into the global covered set.

Where used:

- `greedySetCover()`

---

## 4. Candidate Deduplication

### `deduplicateByCoverage(allKGroups, coverageIndexes)`

Purpose: remove candidate groups that cover exactly the same set of `j`-constraints.

How it works:

- Sorts each candidate's coverage index list.
- Joins the list into a string key.
- Keeps only the first candidate for each unique key.

Why it is valid:

- If two `k`-groups cover the same constraints, they are equivalent from the set-cover solver's perspective.
- Keeping one representative reduces the search space without changing the achievable coverage pattern.

Return value:

```js
{
  uniqueGroups,
  uniqueCoverage,
  originalCount,
  uniqueCount
}
```

Where used:

- `greedySetCover()`
- `backtrackSetCover()`

---

## 5. Heuristic Solver

### `greedySetCover(nSamples, k, j, s, atLeast = 1, timeLimitMs = 4000, scanMode = 'auto')`

Purpose: solve large cases approximately with time-bounded randomized greedy search.

High-level idea:

1. Generate all candidate `k`-groups.
2. Generate all required `j`-combinations.
3. Precompute coverage indexes.
4. Optionally deduplicate candidates by coverage pattern.
5. Convert coverage lists into bitsets.
6. Repeat randomized greedy attempts until the time budget is used.
7. Return the best solution found.

Important thresholds:

- `DEDUP_THRESHOLD = 12000`
  - If candidate count is not too large, deduplicate by coverage.
  - If too large, skip deduplication to avoid spending too much time before solving.

- `LARGE_CANDIDATE_THRESHOLD = 12000`
  - If candidate count is large, use stochastic scan instead of full scan.

- `STOCHASTIC_SAMPLE_SIZE = 1400`
  - Number of random candidates checked per greedy step in large spaces.

How one greedy step works:

1. For each candidate, compute `newCov = popcountAndNot(candidateCoverage, coveredBits)`.
2. Track candidates with the largest `newCov`.
3. Randomly pick one candidate among the best candidates.
4. Add it to `selected`.
5. Merge its coverage into `coveredBits`.

Why it is called GRASP-style:

- It is not a single deterministic greedy run.
- It repeatedly runs randomized greedy construction.
- Random choice among best candidates helps escape local choices.

Guarantee:

- It tries to cover all constraints.
- It does not prove global minimality.

Where used:

- Large search-space branch in `solveOptimalSamples()`.
- Greedy upper bound inside `backtrackSetCover()`.

---

### `removeRedundantGroups(selected, allJCombinations, j, s, atLeast)`

Purpose: post-process a solution by removing groups that are not necessary.

How it works:

For each selected group:

1. Temporarily remove that group.
2. Recompute what constraints the remaining groups cover.
3. If all constraints previously covered by the removed group are still covered, the group is redundant.
4. Remove it permanently.

Why it matters:

- Greedy construction may include unnecessary groups.
- This pass can shrink the answer without changing correctness.

Cost note:

- It can be expensive because it repeatedly checks coverage.
- `solveOptimalSamples()` only runs it under size thresholds.

---

### `fastRadiusCoverHeuristic(nSamples, k)`

Purpose: very fast constructive heuristic for the heavy common case:

```text
j = k
s = k - 1
atLeast = 1
```

Why this case is special:

- Required constraints are also `k`-combinations.
- A selected `k`-group covers:
  - itself
  - any other `k`-combination differing by one element

Implementation:

1. Generate all `k`-groups.
2. Map each group to an index.
3. Keep a `Uint8Array` called `uncovered`.
4. Repeatedly pick the first uncovered group.
5. Mark that group and all radius-1 neighbor groups as covered.
6. Return the selected groups.

Strength:

- Very fast for large cases.

Limitation:

- It is constructive and speed-oriented.
- It does not try as hard as GRASP to minimize group count.

Where used:

- `solveOptimalSamples()` when mode is `fast` and the special condition matches.

---

## 6. Exact Solver

### `backtrackSetCover(nSamples, k, j, s, atLeast = 1, maxGroups = Infinity)`

Purpose: find an exact minimum set cover for small cases.

Preparation:

1. Generate all `j`-combinations.
2. Generate all candidate `k`-groups.
3. Build coverage indexes.
4. Deduplicate candidates by coverage.
5. Sort candidates by coverage size descending.
6. Run greedy once to get an initial upper bound.

Main recursive function:

```js
backtrack(selected, covered, startIdx)
```

State:

- `selected`: currently selected groups
- `covered`: set of covered `j`-combination indexes
- `startIdx`: candidate index currently being considered

Pruning rules:

1. If `selected.length >= bestCount`, stop.
2. If all constraints are covered, update best solution.
3. If no candidates remain, stop.
4. Lower bound pruning:

```text
uncovered = total constraints - covered constraints
lb = ceil(uncovered / maxSingleCover)
if selected.length + lb >= bestCount, stop
```

Branching:

- First branch: skip current candidate.
- Second branch: take current candidate, but only if it adds new coverage.

Guarantee:

- For small search spaces, this returns an exact minimum under the implemented coverage rule.

Where used:

- `solveOptimalSamples()` when `C(n,k) <= 30`.

---

## 7. Main Entry Point

### `solveOptimalSamples(m, n, k, j, s, atLeast = 1, randomSamples = null, solveMode = 'balanced')`

Purpose: orchestrate the whole solving process.

Steps:

1. Determine selected samples:
   - If `randomSamples` is provided and has length `n`, use it.
   - Otherwise randomly draw `n` values from `1..m`.

2. Compute search size:

```js
totalKGroups = combination(n, k)
```

3. Choose solving branch:

- If `totalKGroups <= 30`:
  - run `backtrackSetCover()`
  - method name: `backtrack`

- Else if `solveMode === 'fast'` and special condition matches:
  - run `fastRadiusCoverHeuristic()`
  - method name: `grasp-fast`

- Else:
  - run `greedySetCover()` with a time budget
  - method name:
    - `grasp` for balanced
    - `grasp-fast` for fast
    - `grasp-quality` for quality

4. Optional redundant-group removal:

- Always allowed for smaller large cases.
- Allowed for quality mode up to a higher threshold.

5. Return normalized result:

```js
{
  samples,
  groups,
  count,
  method
}
```

Important thresholds:

- `EXACT_THRESHOLD = 30`
- `REDUNDANT_REMOVAL_THRESHOLD = 1500`
- `QUALITY_REDUNDANT_REMOVAL_THRESHOLD = 20000`

Solve mode budgets:

- `fast`: about 2.2 seconds in GRASP phase
- `balanced`: about 3.5 seconds in GRASP phase
- `quality`: about 5.5 seconds in GRASP phase

---

## 8. `api/verify-core.js`

Verification is separate from solving. This is important because a candidate answer may come from:

- solver output
- pasted user input
- a precomputed result sent by the frontend before saving

The verifier checks feasibility, not global optimality.

---

### `combination(arr, k)`

Purpose: enumerate combinations for verification.

Difference from `api/algorithm.js`:

- Here it receives an array and returns combinations.
- In `api/algorithm.js`, `combination(n, k)` returns only the count.

---

### `isPositiveInteger(value)`

Purpose: validate numeric input after normalization.

Used by:

- `normalizeSamples()`
- `normalizeGroups()`
- `validateCandidate()`

---

### `isSubset(subset, groupSet)`

Purpose: check whether every value in `subset` exists in `groupSet`.

Used by:

- `evaluateCoverage()`

---

### `normalizeSamples(samples)`

Purpose: validate and normalize selected samples.

Checks:

- input must be a non-empty array
- every value must be a positive integer after `Number(...)`
- values must be unique

Returns:

- normalized numeric sample array

---

### `normalizeGroups(groups)`

Purpose: validate and normalize candidate groups.

Checks:

- input must be an array
- each group must be a non-empty array
- all group values must be positive integers after `Number(...)`

Returns:

- normalized numeric group arrays

Security note:

- This rejects malformed values such as strings or injection-like payloads.

---

### `validateCandidate(samples, groups, k)`

Purpose: validate candidate group structure.

Checks:

- samples are valid and unique
- groups are non-empty
- `k` is a positive integer
- each group length equals `k`
- each group has no duplicate values
- every group value belongs to the selected sample set

This prevents a group from using values outside the chosen `n` samples.

---

### `evaluateCoverage(samples, groups, j, s, atLeast = 1)`

Purpose: verify whether candidate groups satisfy all coverage constraints.

Steps:

1. Generate all `j`-combinations from selected samples.
2. Convert every candidate group to a Set.
3. For each `j`-combination:
   - generate all `s`-combinations inside it
   - count how many of those `s`-combinations are covered by any selected group
   - required count is:
     - all `s`-combinations if `j === s`
     - `atLeast` otherwise
4. Track total satisfied constraints.
5. Store up to five failed examples.

Return value:

```js
{
  total,
  satisfied,
  passed,
  coveragePct,
  failed
}
```

Important:

- This verifies feasibility.
- It does not prove the group count is globally minimal.

---

### `verifyCoverageOrThrow(samples, groups, k, j, s, atLeast = 1)`

Purpose: strict verification wrapper used before trusting or saving candidate groups.

Steps:

1. Normalize samples.
2. Normalize groups.
3. Validate group structure.
4. Run `evaluateCoverage()`.
5. If coverage fails, throw an error with the first failed `j`-combination.

Where used:

- `api/solve.js` before saving precomputed results
- `cli/src/server.js` before saving precomputed results in local web mode
- tests

---

## 9. API Integration

### `POST /api/solve`

File: `api/solve.js`

Responsibilities:

- validate parameters
- validate `solveMode`
- call `solveOptimalSamples()` for normal solve requests
- call `verifyCoverageOrThrow()` for precomputed save requests
- optionally save results to Supabase
- return result plus timing information

Important safety behavior:

- If a precomputed result is forged or incomplete, it is rejected before persistence.

---

### `POST /api/verify`

File: `api/verify.js`

Responsibilities:

- validate `k`, `j`, `s`, and `atLeast`
- normalize samples and groups
- validate group structure
- run `evaluateCoverage()`
- return pass/fail coverage data

This endpoint powers the UI's **Verify Candidate** button.

---

## 10. What `npm test` Proves and Does Not Prove

`npm test` is a project regression check. It is not a mathematical proof that every heuristic result is globally optimal.

It currently checks:

- the exact branch returns 4 groups for the classic small case
- the verifier rejects incomplete candidate groups
- the verifier rejects malformed/injection-like values
- forged precomputed saves are rejected before persistence
- local DB filename validation blocks path traversal

What it proves:

- Important project behaviors still work after code changes.
- The exact branch and verification path are not obviously broken.
- Some security-sensitive paths are protected.

What it does not prove:

- GRASP is globally optimal for large cases.
- Every possible parameter combination has been exhaustively tested.
- The heuristic will always return the smallest possible group count.

For large cases, correctness is checked by coverage verification, while quality is evaluated by group count and runtime evidence.

