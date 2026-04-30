#!/usr/bin/env python3
"""
Exact verification for the 6 hard teacher cases via OR-Tools CP-SAT.

Usage:
  python3 scripts/solve-six-hard-cases-exact.py
  python3 scripts/solve-six-hard-cases-exact.py --time-limit 1800 --workers 8

Notes:
  - Solves on canonical samples [1..n].
  - Requires: pip install ortools
"""
from __future__ import annotations

import argparse
import itertools
import math
import time
from typing import Dict, Iterable, List, Sequence, Tuple

from ortools.sat.python import cp_model


# (n, k, j, s, teacher_expected)
HARD_CASES = [
    (12, 6, 5, 5, 132),
    (13, 6, 5, 5, 245),
    (18, 6, 4, 4, 258),
    (20, 6, 5, 4, 216),
    (18, 6, 6, 4, 42),
    (23, 6, 6, 4, 153),
]


def all_k_groups(n: int, k: int) -> List[Tuple[int, ...]]:
    return list(itertools.combinations(range(1, n + 1), k))


def build_group_index(groups: Sequence[Tuple[int, ...]]) -> Dict[Tuple[int, ...], int]:
    return {g: i for i, g in enumerate(groups)}


def covering_groups_for_requirement(
    req: Tuple[int, ...],
    n: int,
    k: int,
    s: int,
    group_to_idx: Dict[Tuple[int, ...], int],
) -> List[int]:
    """
    Return indexes of k-groups that cover this requirement under:
      coverage iff intersection(group, req) >= s   (atLeast=1)
    """
    universe = set(range(1, n + 1))
    req_set = set(req)
    outside = sorted(universe - req_set)
    req_sorted = sorted(req_set)

    covered = set()
    max_t = min(k, len(req_sorted))
    for t in range(s, max_t + 1):
        rem = k - t
        if rem < 0 or rem > len(outside):
            continue
        for from_req in itertools.combinations(req_sorted, t):
            for from_out in itertools.combinations(outside, rem):
                g = tuple(sorted(from_req + from_out))
                idx = group_to_idx.get(g)
                if idx is not None:
                    covered.add(idx)
    return sorted(covered)


def solve_case(n: int, k: int, j: int, s: int, expected: int, time_limit: int, workers: int) -> None:
    t0 = time.time()
    groups = all_k_groups(n, k)
    group_to_idx = build_group_index(groups)
    reqs = list(itertools.combinations(range(1, n + 1), j))

    model = cp_model.CpModel()
    x = [model.NewBoolVar(f"x_{i}") for i in range(len(groups))]

    # One coverage constraint per requirement.
    for ridx, req in enumerate(reqs):
        cover_idx = covering_groups_for_requirement(req, n, k, s, group_to_idx)
        if not cover_idx:
            raise RuntimeError(f"Requirement #{ridx} has no covering group: {req}")
        model.Add(sum(x[i] for i in cover_idx) >= 1)

    model.Minimize(sum(x))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit)
    solver.parameters.num_search_workers = workers
    solver.parameters.log_search_progress = False

    status = solver.Solve(model)
    elapsed = time.time() - t0
    status_name = solver.StatusName(status)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        got = int(round(solver.ObjectiveValue()))
        diff = ((got - expected) / expected) * 100.0
        print(
            f"n={n} k={k} j={j} s={s} expected={expected} "
            f"got={got} diff={diff:+.1f}% status={status_name} "
            f"vars={len(groups)} req={len(reqs)} t={elapsed:.1f}s"
        )
    else:
        print(
            f"n={n} k={k} j={j} s={s} expected={expected} "
            f"status={status_name} vars={len(groups)} req={len(reqs)} t={elapsed:.1f}s"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--time-limit", type=int, default=1800, help="seconds per case")
    parser.add_argument("--workers", type=int, default=8, help="CP-SAT workers")
    parser.add_argument(
        "--case",
        type=str,
        default="",
        help="run one case only, format: n,k,j,s (example: 12,6,5,5)",
    )
    args = parser.parse_args()

    print(
        f"Exact six-case verification | time_limit={args.time_limit}s workers={args.workers} "
        f"| requires OR-Tools CP-SAT"
    )
    cases = HARD_CASES
    if args.case:
        n, k, j, s = map(int, args.case.split(","))
        cases = [c for c in HARD_CASES if c[:4] == (n, k, j, s)]
        if not cases:
            raise SystemExit(f"case not found in hard list: {args.case}")

    for case in cases:
        solve_case(*case, time_limit=args.time_limit, workers=args.workers)


if __name__ == "__main__":
    main()

