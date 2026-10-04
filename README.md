# Sustainers NEST Website

Official static website for Sustainers NEST.

## Stack

- HTML
- CSS
- Vanilla JavaScript
- Vercel Web Analytics

No framework or build step is required.

## Local preview

Open `index.html` directly for a quick preview, or serve the folder with any static web server.

## Deploy with GitHub and Vercel

1. Create a GitHub repository.
2. Put the contents of this folder at the repository root.
3. Push the repository to GitHub.
4. In Vercel, choose **Add New Project** and import the GitHub repository.
5. Leave the framework preset as **Other**.
6. No build command is required.
7. The output is the repository root.
8. Deploy.
9. In the Vercel project dashboard, enable **Web Analytics**.
10. Connect `sustainernest.org` when the production domain is ready.

`vercel.json` enables clean URLs and basic security headers.

## Analytics

`assets/vercel-analytics.js` intentionally skips `.netlify.app`, localhost and file previews. This keeps the current Netlify testing deployment out of Vercel Analytics. On the Vercel production deployment, enable Web Analytics in the Vercel dashboard.

## SEO files

- `robots.txt`
- `sitemap.xml`

The sitemap currently targets `https://sustainernest.org`. If the final production domain changes, update both files and the website metadata.

## Main pages

Home, About, Projects, four project pages, Impact, Updates, Team, Volunteer, Partners, Gallery, Contact, FAQ, Privacy and custom 404.

## Supabase forms

The Contact and Volunteer forms submit through Vercel serverless endpoints (`/api/contact` and `/api/volunteer`) and store private submissions in Supabase. The server uses `SUPABASE_SECRET_KEY` (or the older compatible variable name `SUPABASE_SERVICE_ROLE_KEY`), so the secret never reaches the browser.

The full one-time setup is described in the CMS section below. After deployment, test both forms on Vercel and confirm new rows appear in `contact_submissions` and `volunteer_applications`. Admin users can then review those submissions from `/admin`.

### Netlify testing

Netlify remains useful for visual testing, but the Vercel `/api` endpoints and Admin access should be tested on a Vercel Preview or Production deployment.

## Supabase CMS and secure admin dashboard

The website includes a private admin portal at `/admin`. The public site remains HTML/CSS/JavaScript with a Supabase-backed content layer, while privileged administration is handled through Vercel server functions.

The secure admin architecture now includes HttpOnly server sessions, CSRF protection, server-side role checks, private form inboxes, server-only media uploads, mandatory temporary-password replacement for newly created accounts, audit logging, last-admin protection and a strict Admin Content Security Policy. Admin JWTs are no longer stored in `sessionStorage` or exposed to admin JavaScript.

For an existing Supabase CMS deployment, run `supabase/01-admin-security-upgrade.sql`. For a new deployment, run the complete `supabase/schema.sql`.

Then configure Vercel with:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (preferred server key)

See `ADMIN-SETUP.md` for exact first-admin setup and `SECURITY.md` for the security model.

**Admin** can manage public content, private submissions, access roles, permanent deletion and Audit logs. **Editor** can add/edit/publish/hide public content but cannot read private submissions, manage accounts or permanently delete CMS records.

The static HTML remains as a fallback if Supabase is temporarily unavailable.
