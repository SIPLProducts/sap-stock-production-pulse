# RESL red buttons, new top bar, and a side menu

## 1. Sign-in card
- Remove the small RESL logo from the top of the round Login card on the right. The big logo on the left stays.

## 2. Buttons in logo colours
- Main buttons across the portal (Refresh, Upload, Save, Sign in, Open on launchpad cards, and similar) use a RESL red gradient: deep red to bright logo red, with a soft red glow.
- Sync stays green, Delete stays red, and Excel/PDF export keeps its own colour, so these actions still stand out. Light, Dark and Glassy modes all use the same red.

## 3. New top bar
- A clean bar with a thin red gradient line along the bottom:
  - Left: a menu button that opens or closes the side menu, the RESL logo and "MIS Portal"
  - Centre: the current screen name
  - Right: Home, theme switch, Alerts, Settings, and your name with the sign-out menu
- Small rounded buttons that show a soft red highlight when you point at them.

## 4. Side menu
- Shows the modules you're allowed to see (Financial Accounting, Inventory, Tables Master, Administration), each opening to its screens, such as Vendor Ageing, ZFBL1N and Current Stock.
- The screen you're on is highlighted in red, and its module stays open.
- The menu button shrinks it to a thin strip of icons and opens it again. It remembers your choice.
- On phones it slides in over the screen and closes after you pick a screen.
- It isn't shown on the sign-in page. Exported PDFs never include it.

## Technical
- `src/styles.css`: point `--primary` and `--ring` at RESL red, so `--gradient-action`, `btn-action` and `btn-soft` follow it. Add `--gradient-brand-line` for the top bar.
- `src/routes/auth.tsx`: remove the logo `<img>` inside the card.
- New `src/components/app-sidebar.tsx` uses the shadcn Sidebar (`collapsible="icon"`) and builds its items from `PERMISSION_MODULES` plus admin links, filtered by the user's screen permissions in the same way as the launchpad. It uses `useRouterState` for the active item.
- `src/routes/_authenticated/route.tsx`: wrap `<Outlet />` in `SidebarProvider` with the sidebar and `SidebarInset`. Restyle `shell-bar.tsx` and add `SidebarTrigger`. Screen headers inside reports are unchanged.
