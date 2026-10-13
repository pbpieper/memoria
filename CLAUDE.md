# Memoria — agent file

For any Claude agent working on Memoria. Read this first.
Source: the Notion page "README — Memoria agent" (https://app.notion.com/p/3f8982b1fd6d814abbffd093bf264a68). If they differ, Notion wins.

## Role
Build and run Memoria with Patrick: a loop to memorize something, keep coming back to it, and keep improving it.

## Where things live (addresses, not copies)
- Truth: the Memoria page in Notion (https://app.notion.com/p/37a982b1fd6d81059ddadc46b871a3f7). Its Deliverables and Inbox views are the work queue.
- App: https://memoria-woad.vercel.app · Vercel project `memoria`, deploys from `main`
- Code: https://github.com/pbpieper/memoria, one branch, `main` (skit-trainer = archived predecessor)
- Data: Supabase project Shuji (`pdcrvpggskryptsdvnpe`), shared with another app (Nabu). Only touch Memoria's tables (`skits`, `ladder_progress`, plus the user's own `profiles`/`progress` rows through the app).
- Design: https://claude.ai/design/p/e3fd5b10-8d20-4984-bf4e-9d8cbcc847fe?file=Exercise+Lab.dc.html

## Rules
- Patrick's words are truth. Never write prose into the Memoria page; capture to the Inbox in his words.
- No deliverable without Patrick's OK: each has a time, a place, a person.
- Before any change: check versions, back up, verify with a live signal, pair every permission with a switch-off step.
- Ask before anything that deletes or archives.
- Every shipped change = a new version line on the Memoria page (V1, V2, …).
- Facts belong on the Memoria page, not here. This file only says how to work.

## Working in the code
```bash
npm run dev    # Vite dev server on :5173
npm run build  # tsc -b + vite build; run before every push
```
Vite + React 19 + TypeScript + Tailwind v4. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (without them the app runs local-only).

- `src/services/`: components never call localStorage or Supabase directly; they use `useServices()`. `ServiceProvider.tsx` swaps local ↔ Supabase services on sign-in/out.
- `src/components/auth/`: `AuthGuard` (choice screen: "Sign in to sync" or "Continue without account", saved on this device only), `AccountButton` in the header (sign in / sign out). `dataMigration.ts` copies local data to the account once at first sign-in.
- `src/components/tools/`: practice tools. To add one: create the component, add it to `METHODS` in `src/data/methods.ts`, add the id to `ToolId` in `src/types/tools.ts`, add a case in `AppShell.tsx`'s tool switch.
- `src/data/skit-parser.ts`: `parseSkitFromText()`, where `SPEAKER: line` marks speakers and blank lines split chunks.
- `supabase/migrations/`: schema for Memoria's tables. `skits.id` is TEXT with no default, so the client generates it.
- Optional: Creative Hub (local AI backend, localhost:8420, `src/services/creativeHub.ts`) for TTS/images/LLM; the app works without it.
