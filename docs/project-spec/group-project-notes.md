# AI Group Project Notes

This document is an English reference for the course project formulation used by Optipick.

## Project objective

Build an **optimal sample selection system**: select a subset from large-scale data under fairness/unbiasedness expectations and explicit combinatorial constraints.

## Background and motivation

In many data workflows (data mining, machine learning, statistical studies), teams process large raw datasets by first taking a representative subset. A practical first step is a rule-based sampling strategy that is as fair and unbiased as possible while staying computationally feasible. This project models that step as a constrained set-cover problem and provides a usable implementation (web + CLI).

## Problem definition

### Parameters

- `m`: total item count, `45 <= m <= 54`
- `n`: sampled item count from `m`, `7 <= n <= 25`
- `k`: group size built from `n`, `4 <= k <= 7`
- `j`: subset size for constraints, `s <= j <= k`
- `s`: overlap/coverage threshold, `3 <= s <= 7`

### Core requirement

Find the **minimum number of k-groups** such that each `j`-combination from the selected `n` samples is covered according to `(j, s, atLeast)` semantics:

- If `j == s`: full containment condition (all required `s`-subsets for that `j`-combination are effectively required).
- If `j != s`: partial coverage condition, requiring at least `atLeast` satisfied `s`-subsets.

## Combinatorial formulas

Combination count:

```text
C(n, k) = n! / (k! * (n-k)!)
```

Key counts used in analysis:

- `C(m, n)`: ways to sample `n` from `m`
- `C(n, k)`: candidate k-groups on selected samples
- `C(n, j)`: number of j-constraints
- `C(j, s)`: number of s-subsets inside one j-combination

## Typical examples (from course-style scenarios)

- `m=45, n=7, k=6, j=5, s=5` -> minimum group count is 6.
- `m=45, n=8, k=6, j=5, s=5` -> minimum group count is 12.
- `m=45, n=8, k=6, j=4, s=4` -> minimum group count is 7.

(Exact outputs depend on the same rule semantics implemented in code.)

## Implementation mapping

- Core solver: `api/algorithm.js` and `cli/src/algorithm.js`
- Coverage semantics: `coversRequirement(...)`
- Exact branch: backtracking when search space is small
- Large-space branch: GRASP-style greedy with post-pass reduction

## Deliverable positioning (report / demo)

You can reuse this framing in:

1. Report introduction and problem statement.
2. Early PPT slides (motivation -> formulation).
3. In-product help/context text (concise version).
