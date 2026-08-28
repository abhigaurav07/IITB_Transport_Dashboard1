# Mumbai-Pune Expressway Project Dashboard

A Next.js, TypeScript and Tailwind CSS dashboard for the Mumbai-Pune
Expressway (Yashwantrao Chavan Expressway) traffic and transportation study.

**Status:** early prototype. Only the **Data Collection: Daily Progress
Tracker** page is finished. Every other module (Module 1 through Module 4)
is a placeholder screen marked "Under Construction", using the same design
system, so the whole app already reads as one coherent product while the
rest is built out module by module.

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
    page.tsx                    Overview and module launcher
    data-collection/page.tsx    Daily Progress Tracker (finished)
    module-1/page.tsx           placeholder
    module-2/page.tsx           placeholder
    module-3/page.tsx           placeholder
    module-4/page.tsx           placeholder
  components/
    layout/           Sidebar navigation and responsive app shell
    ui/                Shared primitives (StatCard, StatusBadge, UnderConstruction)
    data-collection/   Chainage status grid, lane progress panel, log table
  data/
    project.ts              Route name, total chainage, lane and direction config
    collection-entries.ts   THE DATA YOU UPDATE, see below
  lib/
    types.ts                 Shared TypeScript types
    collection-utils.ts      Progress and aggregation math (interval merging, etc.)
```

## How to update the daily collection record

`src/data/collection-entries.ts` is the single source of truth for the
tracker page. There is no database, so the page reads this file directly,
which keeps the whole module a static, zero maintenance page that you
redeploy whenever there is new data to add.

To log a new day's survey, append one object per lane/direction segment to
the `collectionEntries` array:

```ts
{
  id: "e12",                    // any unique string
  seq: 12,                      // next reference number, shown as "#12" on the page
  date: "2026-08-28",           // YYYY-MM-DD
  direction: "MP",              // "MP" (Mumbai to Pune) | "PM" (Pune to Mumbai)
  lane: "L1",                   // "L1" (Inner Lane) | "L2" (Middle Lane) | "L3" (Outer Lane)
  chainageFrom: 31.4,           // km, start of the surveyed segment
  chainageTo: 38.0,             // km, end of the surveyed segment
  team: "Survey Team A",        // optional
  remarks: "Classified count",  // optional
},
```

Chainage is always expressed on the single 0 to 94.4 km reference line for
that lane, regardless of direction. On the field record, lanes on the
Mumbai to Pune carriageway are addressed L1/L2/L3 and lanes on the Pune to
Mumbai carriageway as R1/R2/R3; both map to the same lane id here, since
direction plus lane id together identify the exact carriageway and
position. Overlapping or re-surveyed ranges are merged automatically, not
double counted, so it is safe to log a repeat survey of an already covered
stretch.

An entry can be marked `needsVerification: true` if its chainage still
needs to be confirmed against the original field record; this shows a
"Pending verification" tag on that row and a notice banner at the top of
the page. Clear the flag once the figure is confirmed.

After editing the file: commit, push, and Vercel redeploys automatically
(see below).

## Deploying

1. Push this repository to GitHub.
2. Import it into [Vercel](https://vercel.com/new); no configuration is
   needed, Vercel auto-detects Next.js.
3. Every push to the default branch redeploys automatically.

## Adding a new module

Each placeholder page under `src/app/<module>/page.tsx` follows the same
pattern: a page header plus `<UnderConstruction />`. Add real functionality
by leaving the header and swapping the `<UnderConstruction />` component for
real content, following the same design tokens defined in
`src/app/globals.css` and the component patterns used in `data-collection/`.
