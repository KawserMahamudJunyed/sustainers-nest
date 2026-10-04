-- Sustainers NEST - NEW SUPABASE PROJECT
-- STEP 2 OF 3: SECURITY, RLS AND STORAGE

alter table public.contact_submissions enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.activities enable row level security;
alter table public.activity_photos enable row level security;
alter table public.team_members enable row level security;
alter table public.impact_metrics enable row level security;
alter table public.site_settings enable row level security;
alter table public.gallery_items enable row level security;
alter table public.partners enable row level security;

create policy "public_read_activities"
on public.activities
for select
to anon, authenticated
using (published = true);

create policy "public_read_activity_photos"
on public.activity_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.activities a
    where a.id = activity_id
      and a.published = true
  )
);

create policy "public_read_team_members"
on public.team_members
for select
to anon, authenticated
using (published = true);

create policy "public_read_impact_metrics"
on public.impact_metrics
for select
to anon, authenticated
using (published = true);

create policy "public_read_site_settings"
on public.site_settings
for select
to anon, authenticated
using (is_public = true);

create policy "public_read_gallery_items"
on public.gallery_items
for select
to anon, authenticated
using (published = true);

create policy "public_read_partners"
on public.partners
for select
to anon, authenticated
using (published = true);

revoke all on public.contact_submissions from anon, authenticated;
revoke all on public.volunteer_applications from anon, authenticated;
revoke all on public.admin_users from anon, authenticated;
revoke all on public.admin_audit_log from anon, authenticated;

revoke all on public.activities from anon, authenticated;
revoke all on public.activity_photos from anon, authenticated;
revoke all on public.team_members from anon, authenticated;
revoke all on public.impact_metrics from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.gallery_items from anon, authenticated;
revoke all on public.partners from anon, authenticated;

grant select on public.activities to anon, authenticated;
grant select on public.activity_photos to anon, authenticated;
grant select on public.team_members to anon, authenticated;
grant select on public.impact_metrics to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.gallery_items to anon, authenticated;
grant select on public.partners to anon, authenticated;

grant all on public.contact_submissions to service_role;
grant all on public.volunteer_applications to service_role;
grant all on public.admin_users to service_role;
grant all on public.admin_audit_log to service_role;
grant all on public.activities to service_role;
grant all on public.activity_photos to service_role;
grant all on public.team_members to service_role;
grant all on public.impact_metrics to service_role;
grant all on public.site_settings to service_role;
grant all on public.gallery_items to service_role;
grant all on public.partners to service_role;

grant usage, select on all sequences in schema public to service_role;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id)
do update set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "public_read_site_media" on storage.objects;

create policy "public_read_site_media"
on storage.objects
for select
to public
using (bucket_id = 'site-media');

select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'contact_submissions',
    'volunteer_applications',
    'admin_users',
    'admin_audit_log',
    'activities',
    'activity_photos',
    'team_members',
    'impact_metrics',
    'site_settings',
    'gallery_items',
    'partners'
  )
order by tablename;
