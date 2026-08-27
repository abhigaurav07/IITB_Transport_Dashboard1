# Mumbai–Pune Expressway — Project Dashboard

A Next.js + TypeScript + Tailwind CSS dashboard for the Mumbai–Pune Expressway
traffic & transportation study.

**Status:** early prototype. Only the **Data Collection → Daily Progress
Tracker** page is finished. Every other module (Data Processing, Data
Analysis, Traffic Modeling, Results & Reporting) is a placeholder screen
marked *"Prototype — Under Construction"*, using the same design system, so
the whole app already reads as one coherent product while the rest is built
out module by module.

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The finished page is at `/data-collection`.

## Project structure

```
src/
  app/
    page.tsx                    Overview / module launcher
    data-collection/page.tsx    ✅ Daily Progress Tracker (finished)
    data-processing/page.tsx    🚧 placeholder
    data-analysis/page.tsx      🚧 placeholder
    traffic-modeling/page.tsx   🚧 placeholder
    results-reporting/page.tsx  🚧 placeholder
  components/
    layout/        Sidebar navigation + responsive app shell
    ui/             Shared primitives (StatCard, StatusBadge, UnderConstruction)
    data-collection/ Chainage strip, lane progress panel, log table
  data/
    project.ts              Route name, total chainage, lane/direction config
    collection-entries.ts   ⭐ THE DATA YOU UPDATE — see below
  lib/
    types.ts                 Shared TypeScript types
    collection-utils.ts       Progress/aggregation math (interval merging, etc.)
```

## How to update the daily collection record

`src/data/collection-entries.ts` is the single source of truth for the
tracker page. There is **no database** — the page reads this file directly,
which keeps the whole module a static, zero-maintenance page you redeploy
whenever there's new data to add.

To log a new day's survey, append one object per lane/direction segment to
the `collectionEntries` array:

```ts
{
  id: "e11",                    // any unique string
  date: "2026-08-27",           // YYYY-MM-DD
  direction: "MP",              // "MP" (Mumbai→Pune) | "PM" (Pune→Mumbai)
  lane: "L1",                   // "L1" | "L2" | "L3"
  chainageFrom: 31.4,           // km — start of the surveyed segment
  chainageTo: 38.0,             // km — end of the surveyed segment
  team: "Survey Team A",        // optional
  remarks: "Classified count",  // optional
},
```

Chainage is always expressed on the single 0 → 94.4 km reference line for
that lane, regardless of direction. Overlapping or re-surveyed ranges are
merged automatically (not double-counted), so it's safe to log a repeat
survey of an already-covered stretch.

The file currently contains **sample/placeholder data** — a note at the top
of the file (`IS_SAMPLE_DATA`) and a banner on the page itself flag this.
Once real entries start coming in, set `IS_SAMPLE_DATA` to `false` and
replace the sample array.

After editing the file: commit, push, and Vercel redeploys automatically
(see below).

## Deploying

1. Push this repository to GitHub.
2. Import it into [Vercel](https://vercel.com/new) — no configuration needed,
   Vercel auto-detects Next.js.
3. Every push to the default branch redeploys automatically.

## Adding a new module

Each placeholder page under `src/app/<module>/page.tsx` follows the same
pattern — a page header plus `<UnderConstruction />`. Add real functionality
by leaving the header and swapping the `<UnderConstruction />` component for
real content, following the same design tokens defined in
`src/app/globals.css` and the component patterns used in `data-collection/`.
