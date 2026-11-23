# RESL brand loading animation

## What you will see
A full-screen loader that fades over the portal while it is opening or switching screens:

1. A thin red circle slowly draws itself (left ring of the logo), then the second ring draws (about 1.2 s).
2. The "r" fades and scales in inside the left ring.
3. The "e" fades in inside the right ring.
4. "RESL MIS Portal" fades in below, then a small "Loading…" line.
5. The full logo holds for about 1.5 s, gently fades out, and the loop repeats until the page is ready.
6. When loading finishes, the whole screen fades away smoothly instead of disappearing.

Logo keeps its original red colour, shape and sharpness. The loader background is a soft see-through blur, so it looks right in Light, Dark and Glassy modes.

## Where it appears
- When the portal first opens (replaces the current small grey spinner and "Opening RESL MIS Portal…").
- While moving between screens that are still loading.
- Small in-button spinners (Upload, Sync, Save) stay as they are, since a full-screen loader there would block work.

## Technical details
- New `src/components/brand-loader.tsx`: inline SVG with two circles traced over the logo rings (`stroke-dasharray`/`stroke-dashoffset` draw), then the existing RESL logo image revealed in two halves via `clip-path` (left = r, right = e) with scale/opacity keyframes. One shared 5 s loop; all keyframes live in `src/styles.css`. No new libraries.
- Ring colour sampled from the logo (#D9222A) as a design token; overlay uses `bg-background/70 backdrop-blur`.
- Use it in `__root.tsx` boot screen and as router `defaultPendingComponent` (with a short delay so fast screens don't flash it).
- `prefers-reduced-motion`: show the static logo with a gentle pulse only.
- Verify with Playwright screenshots at several moments of the loop in light and dark modes.
