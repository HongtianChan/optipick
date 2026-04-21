# Algorithm Optimizations

This document summarizes practical optimizations used in the solver.

## 1) Layered solving

- First build a feasible cover quickly.
- Then run redundant-group removal to tighten the result.

## 2) Heuristic ordering and pruning

- Sort candidates by estimated coverage impact.
- Use lower-bound checks to prune branches early in backtracking.

## 3) Coverage precomputation

- Precompute coverage indexes once.
- Reuse them across greedy selection and search steps.

## 4) Symmetry reduction

- Deduplicate candidates with equivalent coverage signatures.
- Reduce repeated exploration of effectively identical branches.

## 5) Fast-path behavior

- For large combinatorial spaces, use mode-based time budgets (`fast`, `balanced`, `quality`).
- Optionally skip expensive post-processing on very large instances.
