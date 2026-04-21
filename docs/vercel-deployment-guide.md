# Vercel Deployment Guide

This guide documents a practical deployment flow for Optipick on **Vercel** with optional **Supabase** persistence.

## Prerequisites

1. A GitHub repository containing this project.
2. A Vercel account connected to GitHub.
3. (Optional) A Supabase project if you want cloud history APIs (`/api/files`, `/api/file`, `/api/export`).

## 1) Install and sign in to Vercel CLI

```bash
npm i -g vercel
vercel --version
vercel login
```

## 2) Verify project structure

```text
optimal-samples-selector/
├── api/
│   ├── solve.js
│   ├── files.js
│   ├── file.js
│   ├── export.js
│   └── algorithm.js
├── web-ui/
│   └── index.html
├── package.json
└── vercel.json
```

Notes:
- `api/*.js` is automatically exposed as `/api/*` routes on Vercel.
- Keep `web-ui/index.html` as the frontend entry unless you intentionally switch to `public/`.

## 3) First deployment

From repository root:

```bash
vercel
```

Follow the CLI prompts:
- Link to existing project? choose based on your case.
- Project name: use default or your preferred name.
- Root directory: `./`

Then push a production deployment:

```bash
vercel --prod
```

## 4) Configure Supabase (optional)

If you only need solving, you can skip this section.

### 4.1 Create table and policy

In Supabase SQL Editor, run your repository SQL setup (for example `database/supabase-setup.sql`).

### 4.2 Add environment variables to Vercel

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env ls
```

Set them for **Production** and **Preview**.

After changes, redeploy:

```bash
vercel --prod
```

## 5) Validation checklist

### 5.1 Site status

```bash
curl -I https://your-domain.vercel.app
```

Expected: `HTTP/2 200`.

### 5.2 API smoke test

```bash
curl -X POST https://your-domain.vercel.app/api/solve \
  -H "Content-Type: application/json" \
  -d '{"m":45,"n":8,"k":6,"j":6,"s":5}'
```

Expected: JSON with `samples`, `groups`, `count`, and `method`.

### 5.3 Logs

```bash
vercel inspect https://your-deployment.vercel.app --logs
```

## 6) Common issues

### 404 NOT_FOUND

- Check `vercel.json` rewrites and route config.
- Confirm frontend files are in the expected location.

### API 404

- Ensure files are under `api/`.
- Ensure handlers use CommonJS export style:
  `module.exports = async (req, res) => { ... }`

### Environment variables not applied

- Confirm with `vercel env ls`.
- Redeploy with `vercel --prod` after edits.

### Domain already taken

- Rename project or use a variant domain (e.g. `-app`, `-system`, `-web`).

### Failed to fetch on local testing

- Do not open HTML via `file://`.
- Start local server: `npm run local:web`.

## 7) Day-to-day release workflow

- **Automatic:** push to GitHub; Vercel auto-deploys when repository integration is enabled.
- **Manual:** `vercel --prod`.
- If environment variables change, always redeploy.

## Useful commands

```bash
vercel projects ls
vercel ls
vercel env ls
vercel inspect deployment-url
vercel inspect deployment-url --logs
vercel remove project-name --yes
vercel --prod
```

## References

- [Vercel docs](https://vercel.com/docs)
- [Supabase docs](https://supabase.com/docs)
