# User Manual

## Cover Page

- Group Number: `<fill>`
- Course: `CS360/SE360 Artificial Intelligence`
- Project: `An Optimal Samples Selection System`
- Member 1: `陈鸿天 / 1230002551`
- Member 2: `陈乐怡 / <student id>`
- Member 3: `冯宏臻 / <student id>`
- Member 4: `余升斌/ <student id>`
- Date: `<fill>`

---

## 1. System Overview

This system solves the optimal samples selection problem.
Given parameters `m, n, k, j, s`, it selects the minimum (or near-minimum) number of `k`-groups to satisfy coverage constraints.

Main features:

- Parameter input (`m, n, k, j, s, at least`)
- Two selection modes (`Random n`, `Input n manually`)
- Compute result groups
- Save/display/delete historical records
- Export DB records to JSON for submission

---

## 2. Environment Requirements

### Option A: Use deployed web version

- Modern browser (Chrome / Safari / Edge)
- Internet connection

### Option B: Run locally

- Node.js 18+
- npm

---

## 3. Installation and Setup

### 3.1 Local setup

```bash
cd optimal-samples-selector
npm install
cd api
npm install
```

### 3.2 Database setup (Supabase)

1. Open Supabase SQL Editor
2. Run `database/supabase-setup.sql`
3. Configure environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### 3.3 Start / deploy

- If deployed: open the project URL
- If local with existing script/tooling: follow your team run command

---

## 4. How to Use the System

### Step 1: Input parameters

Fill:

- `m` (45-54)
- `n` (7-25)
- `k` (4-7)
- `j` (s <= j <= k)
- `s` (3-7)
- `at least` (default 1)

### Step 2: Choose sample mode

- `Random n`: system randomly selects `n` values from `1..m`
- `Input n manually`: user enters exactly `n` values

### Step 3: Execute

Click `Calculate`.
System displays:

- selected `n` samples
- algorithm method (exact or approximate)
- minimum/near-minimum number of groups
- all selected `k` groups

### Step 4: Save to DB

Click `Save to history`.
File name format:

`m-n-k-j-s-x-y`

- `x`: run index
- `y`: number of output groups

### Step 5: View or delete in History

1. Open `History` tab
2. Select one file
3. Click `Display` to view content
4. Click `Delete` to remove a record

### Step 6: Export DB JSON (for USB submission)

In `History`, click `Export DB`.
Downloaded file name format:

`db-export-YYYY-MM-DDTHH-MM-SS-sssZ.json`

Place this file into:

`submission/db/`

---

## 5. Input Validation Rules

The system validates:

- positive integers only
- range constraints:
  - `45 <= m <= 54`
  - `7 <= n <= 25`
  - `4 <= k <= 7`
  - `3 <= s <= 7`
- relationship constraints:
  - `n <= m`
  - `k <= n`
  - `s <= j <= k`
  - `j <= n`
- manual samples:
  - exactly `n` numbers
  - each in `[1, m]`
  - no duplicates

---

## 6. Example Run (E.g. 5)

Input:

- `m=45, n=8, k=6, j=6, s=5, at least=1`

Expected:

- result count around the known benchmark (minimum 4 groups for the classic example setting)

Add screenshots:

- Screenshot A: parameter input
- Screenshot B: result output
- Screenshot C: history saved item

---

## 7. Troubleshooting

- **Error: invalid parameters**
  - Check integer/range constraints
- **Error: Supabase not configured**
  - Check `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- **No history displayed**
  - Verify DB table exists and write permissions are correct

---

## 8. File Locations for Final Submission

- Source code: `submission/source-code/`
- DB files / export: `submission/db/`
- Sample runs: `submission/sample-runs/`
- This manual (PDF version): `submission/reports/User-Manual.pdf`
- Project report (PDF): `submission/reports/Project-Report.pdf`

