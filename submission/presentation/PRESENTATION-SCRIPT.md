# Presentation Script — Optimal Samples Selection System (English)

Use this for your **15-minute** talk: introduction → methods → achievements → **live demo**.  
Practice: **two anchor functions** only (`solveOptimalSamples`, `greedySetCover`). You do **not** need to read the whole `algorithm.js` on stage.

---

## 0. Time box (suggested)

| Block | Minutes | Content |
|------:|--------:|---------|
| Intro + problem | ~2 | What we built, why it matters |
| Methodology | ~3.5 | Set cover, exact vs heuristic, API split |
| Deep dive (2 functions) | ~2.5 | Branching + GRASP loop (high level) |
| Achievements + limits | ~3 | Speed, modes, evidence |
| Live demo | ~4 | Fixed cases, narrate screen |

---

## 1. Opening (30–45 seconds)

> Good morning. Our project is **An Optimal Samples Selection System**.  
> Given parameters **m, n, k, j, s**, and **at least**, the system selects **n** samples from **m**, then finds a **small set of k-person groups** so that a **coverage rule** on **j-subsets** is satisfied.  
> Our goal is to **minimize the number of groups** while keeping the solution **correct** and **fast enough** for a web demo and for submission evidence.

---

## 2. Problem modeling (45–60 seconds)

> We model this as a **set cover** problem.  
> The **universe** is the set of all required **j-combinations** we must satisfy.  
> Each **candidate** is a **k-group** drawn from the chosen **n** samples. Each candidate **covers** a subset of those **j-combinations** according to **s** and **at least**.  
> We want the **minimum number of candidates** that covers the whole universe.

**If asked “What is at least?”**

> For each **j-set**, we require a minimum number of covered **s-subsets** inside it. That threshold is the parameter **`at least`**. In our demos it is usually **1**.

---

## 3. Why not one algorithm only? (30–45 seconds)

> The underlying problem is **NP-hard**.  
> So we cannot rely on one brute-force method for all parameter sizes.  
> We use a **two-level strategy**: **exact search** when the search space is small, and a **time-bounded heuristic** when the space is large.  
> We also expose **solve modes** — **fast**, **balanced**, and **quality** — so users can trade **runtime** versus **solution quality**.

---

## 4. System / API split (30 seconds) — “not a black box”

> The **solver** is isolated in **`algorithm.js`**. It has **no HTTP** and **no database**. It only computes **`samples`, `groups`, `count`, `method`**.  
> The **`solve.js`** endpoint is the **front door**: it **validates inputs**, calls the solver (or accepts **precomputed** results when saving), optionally **writes to Supabase**, and returns **timing** metadata.  
> Listing, reading, deleting, and exporting history are separate endpoints — **`files.js`**, **`file.js`**, **`export.js`** — they **do not** solve the optimization; they only manage stored runs.

---

## 5. Deep dive 1 — `solveOptimalSamples` (90–120 seconds)

**File:** `api/algorithm.js` — function `solveOptimalSamples`

**What to say (order):**

1. **Inputs / outputs**

> First we build **`nSamples`**: either the user’s manual list, or we randomly sample **n** distinct values from **1..m** and sort them.

2. **The key size measure**

> We compute **C(n, k)** — how many **k-groups** exist from the **n** samples. That number decides whether exact search is feasible.

3. **Exact branch**

> If **C(n, k)** is at most **300**, we run **backtracking** and label the method **`backtrack`**. That branch aims for a **globally optimal** minimum number of groups.

4. **Large branch — special fast path**

> If the user selects **fast mode** and we hit a common heavy pattern — **j equals k**, **s equals k−1**, **at least is 1**, and **C(n, k)** is very large — we use a **speed-first constructive heuristic** and return **`grasp-fast`**. This prioritizes **latency** for huge instances.

5. **Large branch — GRASP**

> Otherwise we run **GRASP** under a **time budget** based on the mode — roughly **2.2, 3.5, or 5.5 seconds**. 
> The returned method string reflects this choice: **`grasp`**, **`grasp-fast`**, or **`grasp-quality`**. 
> We also apply a **redundant-group removal** pass, but only when the search space is small enough to keep performance safe.

**One-line takeaway:**

> **`solveOptimalSamples` is the decision layer: it chooses exact vs heuristic and sets the runtime budget.**

---

## 6. Deep dive 2 — `greedySetCover` (90–120 seconds)

**File:** `api/algorithm.js` — function `greedySetCover`

**What to say (order):**

1. **Enumerate and index**

> We enumerate all **k-groups** and all **j-combinations**, then precompute which **j-indices** each **k-group** covers. That turns the inner loop into mostly **table lookups** instead of re-checking coverage from scratch every time.

2. **Optional dedup at scale**

> For very large candidate spaces, **full deduplication by coverage pattern** can dominate runtime, so we **skip** it beyond a threshold to keep responses bounded.

3. **Bitsets**

> We pack “which **j** indices are already covered” into a **bitset** and use **population count** to measure **how many new j’s** a candidate adds. That makes each greedy step much faster.

4. **Stochastic scan (very large n)**

> When there are tens of thousands of candidates, we do not scan all of them every step. We **randomly sample** a subset of candidates to estimate the best “next pick”, which keeps each step cheap.

5. **GRASP outer loop**

> The outer loop runs **until the time budget expires**. Each iteration builds a full solution with a **randomized greedy**: at each step, among candidates with the **maximum marginal gain**, we **randomly pick one**. That randomness helps **escape local optima** compared to a deterministic greedy. We keep the **best** solution found across iterations.

**One-line takeaway:**

> **`greedySetCover` is the workhorse: randomized multi-start greedy under a time limit, accelerated by indexing and bitsets.**

---

## 6.1 Notes for yourself — `graspBudgetMs` and `scanMode` (optional on stage)

You **do not have to say this aloud**, but you should **not misread the units** if a marker asks about the numbers in code.

### `graspBudgetMs` (milliseconds, **not** “5500 = 55 seconds”)

In `solveOptimalSamples` we pass a **time limit in milliseconds** into `greedySetCover`:

- **fast** → `2200` ms ≈ **2.2 s**
- **balanced** → `3500` ms ≈ **3.5 s**
- **quality** → `5500` ms ≈ **5.5 s**

`greedySetCover` uses it like: “keep restarting randomized greedy rounds **until this budget runs out**.”

**Important:** `5500` here means **5.5 seconds**, **not** 55 seconds. (55 seconds would be `55000` ms.)

If you want one English sentence **only if asked**:

> The budget is in **milliseconds**; quality mode allows about **5.5 seconds** of GRASP iterations, not 55 seconds.

### `scanMode = 'auto'`

We pass `scanMode` into `greedySetCover`. With **`'auto'`**, the implementation **decides automatically** how to pick the next candidate group each greedy step:

- If the number of candidate **k-groups** is **not huge**, it can **scan all candidates** (exact best marginal gain for that step).
- If the candidate count is **very large** (above an internal threshold), it switches to **stochastic sampling**: randomly check a subset of candidates each step so one step does not scan tens of thousands of items.

So **`auto` means: “full scan vs sampled scan — chosen by the algorithm based on scale,”** not a separate user-visible mode on the UI.

---

## 7. If they ask: “What is GRASP?” (15–20 seconds)

> **GRASP** stands for **Greedy Randomized Adaptive Search Procedure**.  
> In our implementation, it means: **repeat** a greedy construction **many times** within a **time budget**, inject **randomness** when ties occur, and return the **best** feasible set cover found. It is **not** guaranteed globally optimal, but it is **practical** for large instances.

---

## 8. Correctness & evidence (30–45 seconds)

> We do not only show a UI result. We ship a small script **`scripts/generate-evidence-report.js`** that writes Markdown reports under **`submission/sample-runs/`**, including **covered vs total j-combinations**, **coverage percentage**, **runtime**, and the **method** used.  
> For small cases, **`backtrack`** supports an **exact optimality** story. For large cases, we emphasize **feasibility** (100% coverage in evidence) plus **near-optimality under a time budget**.

---

## 9. Achievements + limitations (30–45 seconds)

**Achievements (pick 2–3):**

- End-to-end **web UI + API + persistence + export** for submission  
- **Strict validation** to avoid invalid demos  
- **Dual runtime**: cloud Supabase vs **local offline** mode (team members can run independently)  
- **Solve modes** and **precomputed save** to avoid recomputation on save  

**Limitations (say honestly — teachers like this):**

- Exact search **does not scale** to all parameter combinations  
- Heuristics are **not always globally optimal**  
- Runtime still depends on **n, k, j, s** and the internal thresholds  

---

## 10. Live demo script (speak while clicking)

**Before class:** fix **three** cases and rehearse twice.

1. **Small exact case** (example from spec):  
   `m=45, n=8, k=6, j=6, s=5, at least=1`, mode **balanced** → expect **`backtrack`**, small group count, slower but “optimal story”.

2. **Medium large**:  
   `m=50, n=20, k=6, j=6, s=5, at least=1`, mode **balanced** → **`grasp`**, show **timing** and result size.

3. **Very large fast**:  
   `m=50, n=25, k=6, j=6, s=5, at least=1`, mode **fast** → **`grasp-fast`**, emphasize **speed** and still show **coverage evidence file** if asked.

**Narration template while demoing:**

> I will run case A on the deployed site. You can see the **method** field and **group count**. Then I will save to history and show **export JSON** for reproducibility.

---

## 11. Backup Q&A (one sentence each)

- **“Did you prove optimality?”**  
  > For small **C(n,k)**, **backtracking** is exact. For large cases we claim **feasible** solutions and **near-minimum under a time budget**, supported by evidence reports.

- **“Why JavaScript / serverless?”**  
  > It matches our course delivery: a **single deployable** demo with **minimal setup** for markers, plus optional **local** execution.

- **“What if Supabase is down?”**  
  > The demo can still run **locally**; cloud save is optional.

- **“Why is the exact threshold 300?”**  
  > It is an **engineering trade-off** between **optimality** and **worst-case latency** for the exact solver in our deployment environment.

- **“Is your solution always feasible?”**  
  > The construction aims to cover all required **j-combinations**; we additionally validate coverage in **evidence reports** for representative runs.

---

## 12. Closing (15 seconds)

> In summary: we built a **practical set-cover solver** with **exact** and **time-bounded heuristic** modes, wrapped it in a **clear API layer**, and added **evidence exports** for grading and USB submission. Thank you — I am happy to take questions.

---

## Appendix — File map (for your own glance, not to read aloud)

| File | Role |
|------|------|
| `api/algorithm.js` | Pure solver: `solveOptimalSamples`, `greedySetCover`, `backtrackSetCover`, … |
| `api/solve.js` | POST: validate → solve or precomputed → optional Supabase save → JSON + timing |
| `api/files.js` | GET: list `file_name` |
| `api/file.js` | GET/DELETE: one record |
| `api/export.js` | GET: full JSON export for submission |

---

*End of script. Practice out loud twice; timing matters more than perfect wording.*
