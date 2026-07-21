# NextMove — v0.1 prototype

AI-powered, truthful, Germany-adapted job-application assistant. See
[`PROJECT_SCOPE.md`](./PROJECT_SCOPE.md) for the locked scope.

**Status:** Day 1 — first working vertical slice.

## What works today (Day 1)

- Input screen: experience text, job-ad text, output-language selector
  (German / English), and an **Analyze and Generate** button.
- A single **secure server-side endpoint** (`POST /api/generate`). The AI key
  lives only on the server and is never exposed to the browser.
- A pluggable **AI service layer**: the app depends only on the `AIProvider`
  interface, so the provider can be swapped without rewriting the app.
  - `MockProvider` — deterministic, no key required (default fallback).
  - `ClaudeProvider` — live Claude API round-trip when a key is set.
- The structured result is returned as JSON and rendered raw for verification.

The full 3-screen flow, multi-stage pipeline, and Truth Lock validation arrive
on later days per the approved plan.

## Tech stack

Next.js (App Router) · TypeScript · Claude API · deployable on Vercel.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Without a key the app uses the **mock** provider automatically, so the slice
runs with no configuration.

## Use the live Claude provider

```bash
cp .env.example .env.local
# then set ANTHROPIC_API_KEY=... in .env.local
```

Provider selection (server-side): `AI_PROVIDER` (`mock` | `claude`) overrides;
otherwise Claude is used when `ANTHROPIC_API_KEY` is present, else the mock.

## Out of scope (do not add)

No accounts, database, payments, PDF/DOCX export, file upload, dashboards, or
additional markets. See `PROJECT_SCOPE.md` §9.
