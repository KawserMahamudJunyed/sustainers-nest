-- OPTIONAL VERIFICATION

select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select email, display_name, role, active, must_change_password
from public.admin_users;

select 'activities' as item, count(*)::bigint as total
from public.activities
union all
select 'team_members', count(*)::bigint
from public.team_members
union all
select 'impact_metrics', count(*)::bigint
from public.impact_metrics
union all
select 'contact_submissions', count(*)::bigint
from public.contact_submissions
union all
select 'volunteer_applications', count(*)::bigint
from public.volunteer_applications;
