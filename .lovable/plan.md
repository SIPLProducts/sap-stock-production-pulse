# Fix "User not found" when creating users

## What is wrong
After the project was remixed, the automatic step that creates a portal profile for every new login was lost (the signup trigger on the login table no longer exists — confirmed: zero triggers). So when you click Create user:
1. The login account is created (bala@sharviinfotech.com exists and is confirmed).
2. No profile row is created for it, so the details/role steps cannot find the user and show "User not found".

## Fix
1. Recreate the signup trigger so every new account automatically gets a profile and a default role (uses the existing profile-creation routine, with a valid default role so signup never fails).
2. Repair the half-created account bala@sharviinfotech.com: create its profile and default role, so it appears in User Management and you can edit it (set Admin role, plants, etc.), or delete and recreate it.
3. Make Create user safer: if the profile is somehow missing after signup, create it directly instead of failing, so the error cannot come back.
4. Mirror the trigger change in a dated migration file for Quality/Production.

## Check other screens
- Sign in as Sharvi Admin and open each live screen (Vendor Ageing, ZFBL1N, Current Stock, Inventory Aging, Tables Master, User Management, Roles, SAP settings) and confirm no errors.
- Create a test user end to end, sign in as it, and confirm it sees only the screens its role allows.

## Technical details
- `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
- Ensure `handle_new_user` default role key exists in `public.roles` (fallback to an existing role instead of missing `viewer`).
- Backfill: insert profile + role assignment for auth users without a profile.
- `createPortalUser`: upsert profile row when update affects 0 rows.
