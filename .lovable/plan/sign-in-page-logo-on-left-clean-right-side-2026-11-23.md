# Sign-in page: logo on left, clean right side

Like the reference screenshot: a large brand logo on the left, and the same sign-in card on the right.

## Changes (sign-in page only)
- **Left panel:** show the full RESL logo (red rings with "r" and "e") large and centered, in its original red colors, on a light background so it stays clear. Keep the short "Management Information System" line and the description below the logo. Remove the faint white logo watermark.
- **Right panel:** remove the small logo in the top-right corner. The sign-in card stays exactly as it is now.
- **Phone screens:** the left panel stays hidden as it is now, so only the sign-in card shows.

## Technical
- Change `src/routes/auth.tsx`: swap the watermark `<img>` for a visible `reslLogo` image (about 22rem wide) on a light panel background token, and delete the absolute-positioned logo in the right panel.
