# Menu toggle, a cleaner top bar, and a full-width launchpad

## 1. Menu button switches between the side menu and the module tabs
- **Side menu closed (default):** no strip of icons on the left. The module tabs bar (All Modules, Financial Accounting, …) shows under the top bar.
- **Click the menu button:** the full side menu opens on the left and the module tabs bar hides.
- **Click again:** the side menu closes completely and the module tabs bar comes back.
- On phones the side menu slides over the screen as it does now.

## 2. Better top bar look
- Replace the dark red/blue band with a clean light bar that matches the page: white (dark grey in Dark mode), the RESL logo without the boxed badge, and "MIS PORTAL" in dark text.
- A thin RESL red gradient line runs along the bottom.
- Icons are dark grey and get a soft red highlight when you point at them.
- Module tabs bar: light background, with a red underline and red text on the active tab.
- Glassy mode keeps its see-through look.

## 3. Launchpad left and right space
- Remove the fixed maximum width on the launchpad, so the module tabs, role card and tile cards use the full screen width with the same small side margins as the report screens.

## Technical
- `_authenticated/route.tsx`: keep `SidebarProvider defaultOpen={false}`.
- `app-sidebar.tsx`: change to `collapsible="offcanvas"`.
- `launchpad.tsx`: read `useSidebar().open` and render the tabs strip only when the menu is closed (always on mobile). Drop `max-w-[1500px] mx-auto` from the tabs and content wrappers, keeping responsive padding `px-4 lg:px-6`.
- `shell-bar.tsx` and `styles.css`: `.shell-bar` uses `bg-card`/`text-foreground` with a red gradient `border-image` bottom. Tabs use the `bg-card` and `primary` tokens, and icon buttons use `text-muted-foreground hover:bg-primary/10 hover:text-primary`. Glassy theme keeps its translucent `--shell`.
