# Move the menu button and soften the top bar line

## Changes
- **Menu button:** move it from the far left of the top bar to the right side, where "Alerts" is now. The button still opens and closes the side menu and swaps the module tabs as before.
- **Alerts:** moves one step left, so it isn't lost. The RESL logo and "MIS PORTAL" now start at the far left.
- **Bottom line of the top bar:** change the strong red line to a lighter, soft rose-red gradient, and make the shadow under the bar softer too.

## Technical
- `shell-bar.tsx`: render `SidebarTrigger` inside the right-hand action group, after the Alerts button, and remove it from the start of the header.
- `styles.css` `.shell-bar`: use a lighter `border-image` gradient (primary mixed about 35–45% with card, 2px) and a fainter box-shadow.
