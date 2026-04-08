# Project Report

## Cover Page

- Group Number: `<fill>`
- Course: `CS360/SE360 Artificial Intelligence`
- Project: `An Optimal Samples Selection System`
- Member 1: `<name> / <student id>`
- Member 2: `<name> / <student id>`
- Member 3: `<name> / <student id>`
- Member 4: `<name> / <student id>`
- Date: `<fill>`

---

## 1. Introduction

This project implements an optimal samples selection system based on set-cover style modeling.
The goal is to choose as few `k`-groups as possible while satisfying coverage constraints defined by `j`, `s`, and `at least`.

Problem context:

- Total data scale is large (`m`)
- We select `n` samples from `m`
- We then find minimal groups of size `k` to satisfy required coverage

---

## 2. Problem Definition

Input parameters:

- `m`: total samples (`45 <= m <= 54`)
- `n`: selected samples (`7 <= n <= 25`)
- `k`: group size (`4 <= k <= 7`)
- `j`: constrained by `s <= j <= k`
- `s`: subset size (`3 <= s <= 7`)
- `at least`: minimum required covered `s`-combinations (default = 1)

Target:

- Minimize number of selected `k`-groups
- Ensure each required `j`-combination satisfies coverage rule

---

## 3. Methodology

### 3.1 Core model

We model the task as a set cover optimization problem:

- Universe: all required `j`-combinations
- Candidate sets: each possible `k`-group and the `j`-combinations it covers
- Objective: choose minimum candidate sets that cover universe

### 3.2 Algorithms used

1. **Exact method (Backtracking)**
   - Used when search space `C(n,k)` is small
   - Includes pruning and bounds
   - Provides optimal solution

2. **Approximate method (Greedy)**
   - Used when search space is large
   - Fast and practical
   - Produces near-optimal solution

### 3.3 Engineering optimizations

- Coverage precomputation
- Bitset acceleration for coverage counting
- Equivalent-group deduplication
- Redundant-group removal post-processing

---

## 4. System Design

### 4.1 Architecture

- Frontend: single-page web UI
- Backend API: compute + DB operations
- Database: Supabase `results` table

### 4.2 Main modules

- `api/algorithm.js`: core solving logic
- `api/solve.js`: compute endpoint + validation + save
- `api/files.js`: list saved files
- `api/file.js`: display/delete one saved file
- `api/export.js`: export DB records to JSON
- `index.html`: UI for calculation and history management

### 4.3 Data format

Stored record naming:

`m-n-k-j-s-x-y`

- `x`: run count
- `y`: result group count

---

## 5. Features Implemented

- User-friendly web UI with parameter form
- Two input modes: random/manual
- Validation for legal input ranges and relationships
- Solve and show result groups
- Save/display/delete DB records
- Print result support
- Export DB records as JSON for submission package

---

## 6. Experiments and Sample Runs

### 6.1 Test setting

Use representative cases from project examples.

Case A:

- `m=45, n=8, k=6, j=6, s=5, at least=1`

Case B:

- `<fill>`

Case C:

- `<fill>`

### 6.2 Results summary

| Case | Parameters | Method | Group Count | Runtime | Note |
|---|---|---|---:|---:|---|
| A | 45,8,6,6,5,1 | backtrack/greedy | `<fill>` | `<fill>` | `<fill>` |
| B | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| C | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |

Add screenshots in appendix and place raw outputs in `submission/sample-runs/`.

---

## 7. Contributions and Improvements

- Built complete end-to-end system (UI + API + DB)
- Added strict backend validation to prevent invalid demo inputs
- Added DB export for reproducible submission evidence
- Organized final submission package structure

---

## 8. Limitations

- Exact method is expensive for large search spaces
- Greedy method is approximate and may not always be globally optimal
- Runtime still depends on parameter combination complexity

---

## 9. Future Work

- Better approximation strategies for larger cases
- More advanced pruning / branch-and-bound improvements
- Mobile-focused UI and offline support

---

## 10. Conclusion

The project successfully implements the required optimal samples selection workflow.
It satisfies core functional requirements and supports practical submission needs (history management, evidence export, and structured delivery package).

---

## Appendix A - Installation and Execution Snapshot

Refer to `User-Manual.md` for full steps.

---

## Appendix B - Submission Mapping

- Source code: `submission/source-code/`
- DB setup + exports: `submission/db/`
- Sample runs: `submission/sample-runs/`
- User Manual PDF: `submission/reports/User-Manual.pdf`
- Project Report PDF: `submission/reports/Project-Report.pdf`
- Slides: `submission/presentation/`

