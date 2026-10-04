# Sustainers NEST Admin + New Supabase Setup

## Before SQL

In Supabase open **Authentication -> Users -> Add user** and create:

`admin@sustainersnest.org`

Use a strong password and confirm the user.

## SQL run order

Use a new SQL Editor tab for each file.

1. `supabase/01-CREATE-TABLES.sql`
   - Expected: 11 public table names.

2. `supabase/02-SECURITY-RLS-STORAGE.sql`
   - If Supabase shows an RLS warning, choose **Run and enable RLS**.
   - Expected: 11 rows with `rowsecurity = true`.

3. `supabase/03-SEED-DATA-AND-ADMIN.sql`
   - Expected:
     - activities = 10
     - team_members = 5
     - impact_metrics = 5
     - authorized_admins = 1

4. Optional: `supabase/04-VERIFY-OPTIONAL.sql`

## Vercel variables

Replace the old project's values with the new project's:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

The legacy `SUPABASE_SERVICE_ROLE_KEY` is accepted as a fallback.

Never commit a secret/service-role key to GitHub.

## Vercel

Framework Preset: **Other**

Leave Build Command, Output Directory and Install Command blank.

After saving the new environment variables, redeploy Vercel and open `/admin`.
