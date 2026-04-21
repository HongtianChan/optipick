# Usage Example (E.g.5 style)

## Goal
Run one complete solve flow and save the result.

## Steps (web)

1. Open hosted site or local site.
2. Fill parameters (`m`, `n`, `k`, `j`, `s`, optional `atLeast`).
3. (Optional) provide manual samples.
4. Click **Execute**.
5. Review returned groups and method.
6. Click **Store** if you want to save the run.
7. Open **Data Base** tab to inspect records.

## Equivalent CLI

```bash
cd cli
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5 --save
node index.js list
```
