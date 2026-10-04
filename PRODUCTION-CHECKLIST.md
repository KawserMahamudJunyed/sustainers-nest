# Sustainers NEST Production Checklist

## Vercel
- Framework Preset: **Other**
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: leave empty
- Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` in Vercel Environment Variables.
- Never commit real `.env` files or secret keys.

## Supabase
For an existing Supabase project, run the full `supabase/01-admin-security-upgrade.sql`. If the project is missing CMS tables, the file is self-contained and creates them before applying security. If Supabase asks about RLS, choose **Run and enable RLS**.

## Admin
- Admin URL: `/admin`
- Confirm the admin user exists in Supabase Authentication and `public.admin_users`.
- Test login, one content edit, one image upload, Contact inbox, and Volunteer applications.

## GitHub
Push this project folder only. Do not upload old backup ZIPs or real environment files. `.gitignore` is already configured for local secrets and Vercel metadata.
