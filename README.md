# Optipick

Optipick is an **Optimal Samples Selection System** for a constrained grouping task. It selects `n` samples from `1..m`, builds candidate `k`-groups, and minimizes the number of groups while satisfying coverage rules defined by `j`, `s`, and `atLeast`.

Live demo: https://optipick-system.vercel.app

## Quick Start

Install dependencies once:

```bash
npm install
cd cli && npm install && cd ..
```

Run the local web version:

```bash
npm run local:web
```

Then open:

```bash
http://localhost:3000
```

Run the regression tests:

```bash
npm test
```

## Project Structure

```text
optimal-samples-selector/
├── api/            # Vercel APIs and shared solver/verification logic
├── cli/            # Local web server and command-line interface
├── database/       # Optional Supabase setup SQL
├── scripts/        # Evidence and utility scripts
├── test/           # Node.js regression tests
├── web-ui/         # Static frontend
├── package.json    # npm scripts
└── vercel.json     # Vercel routing configuration
```

## Usage Modes

| Mode | Entry | Notes |
|---|---|---|
| Hosted Web | Open the live demo | Best for quick demonstration. |
| Local Web | `npm run local:web` | Runs the same browser UI on localhost. |
| CLI | `node cli/index.js solve ...` | Good for batch testing and saved evidence. |

## CLI Examples

```bash
cd cli
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5 --samples "1,2,3,4,5,6,7,8"
node index.js solve -m 50 -n 25 -k 6 -j 6 -s 5 --solve-mode fast
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5 --save
node index.js list
node index.js show -f <file-name>
node index.js delete -f <file-name>
```

## Parameters

| Parameter | Meaning | Range |
|---|---|---|
| `m` | Total sample pool size | `45 <= m <= 54` |
| `n` | Selected sample count | `7 <= n <= 25` |
| `k` | Group size | `4 <= k <= 7` |
| `j` | Requirement subset size | `s <= j <= k` |
| `s` | Required overlap size | `3 <= s <= 7` |
| `atLeast` | Minimum coverage count | default `1` |

In simple words: each selected `k`-group is like a table; every `j`-sample subset must have at least `s` members appearing together in selected groups, and this must happen at least `atLeast` times.

## Algorithm

Optipick models the task as a **minimum set cover** problem.

1. Select `n` samples from the `m`-sample pool.
2. Enumerate all possible `k`-groups as candidate sets.
3. Treat every required `j`-combination as a coverage requirement.
4. Select as few `k`-groups as possible while covering all requirements.

Solver strategy:

- If `C(n,k) <= 30`, the system uses exact backtracking and can guarantee an exact minimum under the implemented rules.
- If `C(n,k) > 30`, the system uses a time-bounded GRASP-style heuristic.
- `fast`, `balanced`, and `quality` modes control the heuristic runtime/quality trade-off.
- `Verify Candidate` independently checks feasibility for every returned result.

## Data Storage

Local saved runs are stored under:

```bash
~/.optimal-samples-selector/db/
```

Saved records include parameters, selected samples, groups, group count, method, solve mode, and timestamp.

The hosted deployment can use Supabase for cloud history when environment variables are configured. Solving itself still works without Supabase.

## API Surface

| Endpoint | Purpose |
|---|---|
| `POST /api/solve` | Solve a parameter set and optionally save the result. |
| `POST /api/verify` | Verify whether candidate groups satisfy coverage constraints. |
| `GET /api/files` | List saved local records in local web mode. |
| `GET /api/export` | Export saved records as JSON in local web mode. |

## Tests

```bash
npm test
```

The test suite checks exact solving, candidate verification, forged-save rejection, malformed input rejection, local DB filename validation, and graceful behavior when cloud history is unavailable.
