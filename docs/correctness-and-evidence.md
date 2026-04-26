# Correctness and Evidence Guide

This document explains how we verify that calculation results are valid, and where to find evidence files for demo/report use.

## 1) What "correct" means in this project

Given input `m, n, k, j, s, at least`, the output is considered correct if:

- every required `j`-combination is covered according to the rule
- coverage count reaches `total/total` (100%)

For `j = s`, coverage means ALL required subsets for each `j`-combination.
For `j != s`, coverage means at least the configured number (`at least`).

## 2) How we generate verification evidence

We use:

- script: `scripts/generate-evidence-report.js`
- output: markdown report in `submission/sample-runs/`

Example command:

```bash
node scripts/generate-evidence-report.js --m 50 --n 20 --k 6 --j 6 --s 5 --at-least 1 --solve-mode balanced --runs 1 --output submission/sample-runs/evidence-current-n20-balanced.md
```

The report includes:

- run parameters
- method used
- runtime
- covered/total `j`-combinations
- coverage percentage
- best run groups

## 3) Current evidence files

- `submission/sample-runs/evidence-2026-04-14T06-15-31-460Z.md`
- `submission/sample-runs/evidence-n20-fast.md`
- `submission/sample-runs/evidence-n25-fast.md`
- `submission/sample-runs/evidence-current-small-exact.md`
- `submission/sample-runs/evidence-current-n20-balanced.md`
- `submission/sample-runs/evidence-current-n25-fast.md`

## 4) How to present this in demo/report

- **Correctness**: show `Covered j-combinations: X/X (100%)`
- **Quality**: show group count and runtime
- **Method note**:
  - `backtrack` => exact for small search spaces
  - `grasp` / `grasp-quality` => near-optimal under time budget
  - `grasp-fast` => speed-priority mode for very large inputs
