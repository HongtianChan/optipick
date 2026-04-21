# Local Offline Mode

Use this mode to run Optipick entirely on your own machine. Results are written to a local file database, not the shared cloud backend.

## What you get

- Local web app at `http://localhost:3000`
- Local history in `~/.optimal-samples-selector/db/`
- Local export from **History → Export DB**

## One-time setup

```bash
cd optimal-samples-selector
npm install
cd cli
npm install
cd ..
```

> If your shell is not already in the project folder, use your own absolute path instead (for example: `cd "/path/to/optimal-samples-selector"`).

## Start local web mode

```bash
npm run local:web
```

Open `http://localhost:3000` in your browser.

If port `3000` is busy, choose another port:

```bash
node cli/index.js web -p 3001
```

Then open `http://localhost:3001`.

## Local data location

- Directory: `~/.optimal-samples-selector/db/`
- Filename pattern: `m-n-k-j-s-x-y`
- Meaning: `x` = run count, `y` = number of output groups

## Common local commands

```bash
# Solve once and save to local DB
npm run local:solve

# List local records
node cli/index.js list
```

## Notes

- Local mode does not call Supabase, so it is not affected by RLS policies, network issues, or cloud quotas.
- Each teammate only sees records from their own machine, which is useful for parallel experiments and demo preparation.
- The frontend entry is `web-ui/index.html`; local server paths and Vercel paths are aligned.
