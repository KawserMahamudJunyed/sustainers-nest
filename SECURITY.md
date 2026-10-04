# Sustainers NEST Website Security Notes

## Secrets

Use `SUPABASE_SECRET_KEY` only in Vercel server-side environment variables. Do not commit it. The public `SUPABASE_PUBLISHABLE_KEY` is intentionally non-secret and is used for published public CMS reads.

## Admin session

Admin access tokens and refresh tokens are stored only in Secure, HttpOnly, SameSite=Strict cookies. Frontend JavaScript does not read or store those tokens.

## Database access

The public browser has read-only access to published CMS content. Authenticated browser users have no write grants to CMS tables. Admin writes use Vercel APIs which re-check the user's CMS role and then use the server secret.

## Private records

Contact submissions, Volunteer applications, admin accounts and audit logs have no browser grants. They are read or changed only through role-checked server APIs.

## Media

The `site-media` bucket is public for reading published website images. Browser uploads are disabled. Admin images are optimized in the browser, validated again by the server and uploaded with the server secret. SVG and executable uploads are not accepted.

## Account lifecycle

New dashboard-created users receive a temporary password and cannot manage content until they change it. Administrators cannot demote or disable themselves from the dashboard, and the last active administrator is protected.

## Future hardening

For organizations that want stronger identity assurance, add Supabase TOTP MFA with an explicit enrollment, challenge and verify interface and then enforce AAL2 for privileged routes.
