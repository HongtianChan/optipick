# AI Brief for Team Members

Use this document as context for any AI assistant helping with the presentation. The goal is to help teammates quickly understand what the project does and how to produce a good English PPT.

---

## 1. What This Project Is

Project name: **Optipick — An Optimal Samples Selection System**

This is a course project for Artificial Intelligence. It solves a constrained sample group selection problem.

The system receives:

- `m`: total sample pool size
- `n`: number of selected samples
- `k`: group size
- `j`: constraint subset size
- `s`: covered subset size
- `at least`: minimum number of covered `s`-subsets required

After selecting `n` samples from `1..m`, the system tries to choose the smallest possible number of `k`-groups so that every required `j`-combination satisfies the coverage rule.

In simple words:

> We choose sample groups under strict coverage rules, and we try to use as few groups as possible.

---

## 2. The Core Idea

The problem is modeled as a **Set Cover** problem.

- Universe: all required `j`-combinations.
- Candidate sets: all possible `k`-groups.
- A candidate group covers some `j`-combination constraints.
- Goal: choose the fewest candidate groups that cover all constraints.

This is why the project belongs naturally in an AI / optimization course: it turns a sampling requirement into a combinatorial search problem.

---

## 3. Algorithm Strategy

The solver uses a hybrid strategy.

### Small Search Space

If `C(n,k) <= 30`, the system uses exact **Backtracking**.

This branch:

- gives a certified exact minimum under our implemented rules
- uses pruning and a greedy upper bound
- is suitable for small cases such as `n=8,k=6`

### Large Search Space

If `C(n,k) > 30`, the system uses time-bounded **GRASP-style greedy heuristics**.

This branch:

- is much faster for large cases
- provides feasible near-optimal results
- does not guarantee global optimality

Solve modes:

- `fast`: prioritizes speed
- `balanced`: default mode
- `quality`: spends more time for better search quality

Important wording:

- Say **"exact"** only for the backtracking branch.
- Say **"near-optimal"** or **"heuristic result"** for GRASP branches.
- Do not claim that every large-case result is globally optimal.

---

## 4. Verification

The system includes an independent **Verify Candidate** function.

It checks:

- whether every required `j`-combination is covered
- covered/total count
- coverage percentage
- failed examples when the candidate answer is invalid

Important distinction:

- Verification proves the returned groups are **feasible**.
- Verification does not prove a heuristic result is globally minimum.

Good sentence for PPT:

> The solver finds a solution, and the verifier independently checks whether that solution satisfies all coverage constraints.

---

## 5. Main System Components

Important files:

- `web-ui/index.html`: single-page web interface
- `api/algorithm.js`: core solver
- `api/solve.js`: solve API endpoint
- `api/verify.js`: candidate verification endpoint
- `api/verify-core.js`: shared verification logic
- `cli/index.js`: command-line tool
- `docs/algorithm-implementation-detail.md`: detailed function-by-function algorithm explanation

The local web mode and the hosted web mode use the same algorithm logic.

---

## 6. What the PPT Should Emphasize

The PPT should not become a code dump. It should explain the project clearly.

Recommended focus:

1. Problem definition
2. Why it is a Set Cover problem
3. Exact vs heuristic strategy
4. System workflow
5. Verification and evidence
6. Live demo using the instructor's case

Avoid:

- showing too many code screenshots
- overexplaining every helper function
- claiming global optimum for large heuristic cases
- spending too much time on Supabase or deployment details

---

## 7. Suggested Slide Structure

Use `PPT-CONTENT-OUTLINE.md` as the main outline.

Recommended 15-minute timing:

- Title: 0.5 min
- Problem: 1.5 min
- Workflow: 1 min
- Set Cover model: 1.5 min
- Exact + heuristic strategy: 2 min
- Key functions: 2.5 min total
- UI / engineering: 1 min
- Evidence + demo setup: 1.5 min
- Instructor live case: 3 min
- Conclusion: 0.5 min

Keep one slide for the instructor's live case. The instructor may give a new example during class, so the presentation must reserve time for that.

---

## 8. Live Demo Plan

Primary demo:

1. Use the example given by the instructor.
2. Enter `m, n, k, j, s, at least`.
3. Choose solve mode if needed.
4. Click Execute.
5. Show selected samples.
6. Show method, group count, runtime.
7. Click Verify Candidate.
8. Show coverage result.
9. Optionally store and display from History.

Backup cases:

- Case A: `m=45,n=8,k=6,j=6,s=5,at least=1`
- Case B: `m=50,n=20,k=6,j=6,s=5,at least=1,mode=balanced`
- Case C: `m=50,n=25,k=6,j=6,s=5,at least=1,mode=fast`

If the live system fails:

- Use screenshots in `submission/sample-runs/`.
- Explain that the evidence files show 100% coverage for representative cases.
- Do not panic or over-explain technical errors.

---

## 9. Suggested Speaker Split

Not every member has to speak. The instructor said all members should be present, but non-speaking members may stand beside the stage.

Possible split:

- Speaker 1: title, problem, workflow
- Speaker 2: set cover model and algorithm strategy
- Speaker 3: UI, verification, evidence
- Speaker 4 or main operator: live demo

If only one or two members speak, make sure everyone still understands:

- what the parameters mean
- exact vs heuristic difference
- what Verify Candidate proves
- how to run the live demo

---

## 10. Common Questions and Safe Answers

### Q: Is the output always globally optimal?

Safe answer:

> For small cases, yes, because the system uses exact backtracking. For large cases, the system uses time-bounded GRASP heuristics, so the result is feasible and near-optimal, but not mathematically guaranteed to be globally minimal.

### Q: How do you know the answer is correct?

Safe answer:

> We independently verify coverage. The verifier checks every required `j`-combination and reports covered/total constraints. This proves feasibility.

### Q: Why use GRASP?

Safe answer:

> Exact search becomes too expensive when `C(n,k)` is large. GRASP gives practical results within a fixed time budget.

### Q: What does `at least` mean?

Safe answer:

> It means each `j`-combination must have at least that many covered `s`-subsets.

### Q: What should happen if the instructor gives a large case?

Safe answer:

> Use `fast` or `balanced` mode depending on the expected runtime. Then verify the result after execution.

---

## 11. Important Wording Rules

Use these words:

- "exact minimum" for backtracking
- "near-optimal" for GRASP
- "feasible result" after verification
- "coverage constraints"
- "time-bounded heuristic"

Avoid these words:

- "always optimal" for all cases
- "AI model" as if we used a neural network
- "random answer"
- "database is required" because local mode works without Supabase

---

## 12. Final PPT Quality Checklist

Before finalizing the PPT:

- All text is in English, except member names.
- Each slide has no more than 3 main bullets.
- The Set Cover model is explained visually.
- Exact vs heuristic is clearly separated.
- The live demo slide reserves about 3 minutes.
- Backup cases are included in speaker notes or appendix.
- The conclusion does not overclaim global optimality.
- The PPT mentions Verify Candidate.
- The speaker knows where `docs/algorithm-implementation-detail.md` is for deeper questions.

