# Sign-in card: round soft "Login" style (like the reference)

Restyle only the sign-in card on the right of the sign-in page. Sign-in still works the same way.

## Look
- **Large soft circle** in place of the square card: light grey with a raised, embossed shadow (soft light on the top-left, darker shade on the bottom-right), on the light grey page.
- Inside the circle, centred from top to bottom:
  - A small RESL logo
  - A big bold **"Login"** title, with "Sign in to your account" underneath
  - **Email or username** box with a person icon. The box looks pressed in, with a thin coloured line along the bottom.
  - **Password** box with a lock icon and an eye button to show or hide the password, in the same pressed-in style
  - "Remember me" on the left and "Forgot password?" on the right, in small text
  - A wide **SIGN IN** button with a gradient and spaced capital letters
  - "Authorised RESL staff only" below the button
- **Colours:** RESL red in place of the reference's green and orange. The button and the box underlines use a red gradient.
- **Phones:** the circle becomes a rounded card so it fits the screen.
- The words "Portal access is provisioned by your administrator." move inside the circle and become the "Authorised RESL staff only" line.

## Technical
- Change only `src/routes/auth.tsx`, keeping the existing handlers and state. Add a `showPassword` state with an Eye/EyeOff toggle.
- Add the neumorphic shadow tokens (`--shadow-neu-raised`, `--shadow-neu-inset`) and a `--gradient-brand` red gradient to `src/styles.css` so the colours come from tokens. The circle uses `aspect-square rounded-full` from `md`, and falls back to `rounded-3xl` below that.
