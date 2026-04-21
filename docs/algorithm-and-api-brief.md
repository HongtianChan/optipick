# Algorithm and API Brief

## Core algorithm modules

- `combination(n, k)`: combinatorial count
- `generateCombinations(arr, k)`: enumerate k-subsets
- `coversRequirement(...)`: constraint semantics for `(j, s, atLeast)`
- `buildCoverageIndexes(...)`: precompute coverage for speed
- `backtrackSetCover(...)`: exact branch for small spaces
- `greedySetCover(...)`: heuristic branch for large spaces
- `removeRedundantGroups(...)`: post-pass reduction
- `solveOptimalSamples(...)`: orchestration entry point

## HTTP APIs

- `POST /api/solve`: solve once, optionally save
- `GET /api/files`: list saved records
- `GET /api/file?f=...`: read one saved record
- `DELETE /api/file`: delete one saved record
- `GET /api/export`: export saved data

## External dependency

- Supabase is optional and only used for hosted cloud persistence.
- Solver logic itself does not depend on third-party algorithm services.
