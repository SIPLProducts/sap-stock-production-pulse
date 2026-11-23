# Spinner shows once, nicer background, ZFBL1N error fix

## Why the spinner shows twice
1. **When you click a card**: the app briefly shows the full-screen loader while the screen's code loads (after 0.4 s).
2. **After the screen opens**: the screen shows the loader again inside the page while its data loads.
These are two separate loaders back to back, so it looks like the animation restarts.

## What will change
1. **One loader per open**: drop the full-screen loader for screen switches. You'll see the screen header straight away, then one loader inside the page until the data arrives. The full-screen loader stays only for the first portal opening.
2. **Nicer loader background**: show the inline loader on a soft card. It gets a light radial glow in the RESL red and the theme's background color, rounded corners, a faint border and a subtle shadow. Under the logo there's a thin animated progress line. The loader matches Light, Dark and Glassy modes, and the full-screen version gets the same soft glow behind its blur.
3. **ZFBL1N red error "Cannot read properties of undefined (reading 'rest')"**: the screen calls the database in a way that loses its connection. Fix the call so tiles, charts and the table load again. The data itself is fine (1,002 lines were checked in the database).

## Technical details
- `src/router.tsx`: remove `defaultPendingComponent`/`defaultPendingMs` (or set pendingMs high, e.g. 2000, with a minimal blank pending). The root loader keeps "Opening portal…".
- `src/lib/zfbl1n-data.ts`: `supabase.rpc` was detached from the client (`this` undefined). Use `supabase.rpc.bind(supabase)`.
- `src/styles.css`: `.brand-loader--inline` gets a radial-gradient token background using `--primary`/`--background` via color-mix, plus border, radius, shadow and an `::after` shimmer bar. Add the glow to the full-screen overlay. Remove the hand-written `-webkit-backdrop-filter`.
- Verify with Playwright: open Vendor Ageing/ZFBL1N from the launchpad, confirm one loader and no error.
