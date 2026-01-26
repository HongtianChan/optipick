# Optipick

Optimal samples selection system. Solves set cover problem.

**Live**: https://optipick-system.vercel.app

## What it does

- Finds optimal sample groups (set cover problem)
- Random or manual sample input
- Saves results to Supabase
- CLI tool
- Web UI (terminal style)
- Deployed on Vercel

## Project structure

```
optimal-samples-selector/
├── api/              # Vercel serverless functions
├── cli/              # CLI tool
├── web-ui/           # Web UI source
├── public/           # Static files for deployment
├── docs/             # Documentation
├── package.json
├── vercel.json
└── supabase-setup.sql
```

## Install

```bash
cd cli
npm install
```

## Usage

### CLI

```bash
# Basic
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5

# Manual samples
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5 --samples "1,2,3,4,5,6,7,8"

# Save result
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5 --save

# List files
node index.js list

# Show file
node index.js show -f 45-8-6-6-5-1-4

# Delete file
node index.js delete -f 45-8-6-6-5-1-4

# Start Web UI
node index.js web
# Then visit http://localhost:3000
```

### Web UI

1. Start server: `node index.js web`
2. Open: http://localhost:3000
3. Enter params, choose mode, execute, save

## Parameters

- **m**: Total samples (45-54)
- **n**: Selected from m (7-25)
- **k**: Group size (4-7)
- **j**: j param (s <= j <= k)
- **s**: s param (3-7)
- **at-least**: Min s combinations to cover (default 1)

## Algorithm

- **Small** (n ≤ 10): Backtrack (exact)
- **Large** (n > 10): Greedy (approximate)

## Example

E.g. 5: m=45, n=8, k=6, j=6, s=5
```bash
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5
```
Result: min 4 groups

## Storage

**Local CLI**: `~/.optimal-samples-selector/db/`

**Online**: Supabase database

File format: `m-n-k-j-s-x-y`
- x: run count
- y: result count

## Deploy

**Online**: https://optipick-system.vercel.app

**Local**: See [docs/vercel-deployment-guide.md](./docs/vercel-deployment-guide.md)

## Docs

- [Deployment guide](./docs/vercel-deployment-guide.md)
- [Design style](./docs/bentossell-style.md)
- [Color palette](./docs/color-palette.md)
- [Project spec](./docs/project-spec/Group%20Project%20说明.md)

## Tech

- Backend: Node.js, Vercel Serverless Functions
- Database: Supabase (PostgreSQL)
- Frontend: HTML, CSS, JavaScript
- Deploy: Vercel
- CLI: Commander.js
