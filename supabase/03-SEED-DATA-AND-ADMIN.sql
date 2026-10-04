-- Sustainers NEST - NEW SUPABASE PROJECT
-- STEP 3 OF 3: SEED WEBSITE DATA AND AUTHORIZE FIRST ADMIN
--
-- Create admin@sustainersnest.org in Authentication -> Users before running.

insert into public.impact_metrics
  (metric_key, label, value_number, suffix, sort_order, published)
values
  ('institutes', 'Institutes reached', 25, '+', 10, true),
  ('young_learners', 'Young learners reached', 1500, '+', 20, true),
  ('volunteers', 'Volunteers', 300, '+', 30, true),
  ('projects', 'Active projects', 4, '', 40, true),
  ('trees', 'Trees planted', 100, '+', 50, true);

insert into public.team_members
  (slug, team_group, name, role_title, motto, photo_url, photo_position, sort_order, published)
values
  ('rahat-mollik', 'executive', 'Rahat Mollik', 'Executive Director',
   'When you are young, they assume you know nothing.',
   'assets/executive-rahat.jpg', 'center 25%', 10, true),
  ('joyriya-jannat-wasika', 'executive', 'Joyriya Jannat Wasika',
   'Operation & Strategy Lead', 'Choose progress over perfection.',
   null, 'center 25%', 20, true),
  ('hamza-bin-halim', 'executive', 'Hamza Bin Halim',
   'Head of Administration', 'Far to go, fearless to conquer.',
   'assets/executive-hamza.jpg', 'center 25%', 30, true),
  ('nadia-akter-maria', 'executive', 'Nadia Akter Maria',
   'Head of Communication', 'Silent people have the loudest minds.',
   'assets/executive-nadia.jpg', 'center 25%', 40, true),
  ('riyadul-islam', 'executive', 'Riyadul Islam',
   'Logistic Officer & Organizing Secretary',
   'Steady in efforts, ready in action.',
   'assets/executive-riyadul.jpg', 'center 25%', 50, true);

insert into public.activities
  (
    slug, project_key, project_label, title, institute, date_label,
    start_date, end_date, sort_date, description, thumbnail_url,
    detail_url, status_label, featured_home, published
  )
values
  (
    'chasing-aliganj-2026', 'chasing-green', 'Chasing Green',
    'Aliganj High School', 'Aliganj High School', '28 September 2026',
    '2026-09-28', null, '2026-09-28',
    'Young advocates explored climate solutions through group discussion, collaborative action and environmental advocacy.',
    'assets/chasing-aliganj-7.jpg',
    'project-chasing.html#activity-aliganj-chasing',
    'Completed', true, true
  ),
  (
    'trash-nabinagar-2026', 'trash-to-treasure', 'Trash To Treasure',
    'Nabinagar Government Primary School',
    'Nabinagar Government Primary School',
    '20 & 22 September 2026',
    '2026-09-20', '2026-09-22', '2026-09-22',
    'A two-part institute activity where young innovators combined responsible waste-management learning with hands-on creative upcycling.',
    'assets/trash-to-treasure-nabinagar-group.jpg',
    'project-trash.html#activity-nabinagar-trash',
    'Completed', true, true
  ),
  (
    'seeds-isdair-2026', 'seeds-of-change-artists',
    'Seeds of Change Artists', 'Isdair Government Primary School',
    'Isdair Government Primary School', '16 September 2026',
    '2026-09-16', null, '2026-09-16',
    'Young advocates connected environmental observation with drawing and creative expression.',
    'assets/seeds-isdair-6.jpg',
    'project-seeds.html#activity-isdair-seeds',
    'Completed', true, true
  ),
  (
    'chasing-police-lines-2026', 'chasing-green', 'Chasing Green',
    'Police Lines School Narayanganj', 'Police Lines School Narayanganj',
    '17 August 2026', '2026-08-17', null, '2026-08-17',
    'Young advocates moved from climate awareness to practical solutions and creative visual advocacy.',
    'assets/chasing-police-lines-6.jpg',
    'project-chasing.html#activity-police-lines-chasing',
    'Completed', false, true
  ),
  (
    'trash-fatullah-2026', 'trash-to-treasure', 'Trash To Treasure',
    'Fatullah Government Primary School',
    'Fatullah Government Primary School',
    '27 & 29 July 2026', '2026-07-27', '2026-07-29', '2026-07-29',
    'A two-part activity where young innovators connected waste awareness, reuse and practical creative upcycling.',
    'assets/trash-fatullah-group.jpg',
    'project-trash.html#activity-fatullah-trash',
    'Completed', false, true
  ),
  (
    'plastic-free-commitment-2026', 'organization',
    'Organization-wide Advocacy',
    'Plastic-Free & Zero-Waste Commitment',
    null, '1 July 2026', '2026-07-01', null, '2026-07-01',
    'Sustainers NEST joined a youth-led national commitment to reduce single-use plastics and promote zero-waste practices.',
    'assets/plastic-free-commitment-1.jpg',
    'activity-plastic-free-commitment.html',
    'Commitment', true, true
  ),
  (
    'planting-fatullah-2026', 'planting-for-the-future',
    'Planting For The Future', 'Fatullah Pilot High School',
    'Fatullah Pilot High School', '21 May & 11 June 2026',
    '2026-05-21', '2026-06-11', '2026-06-11',
    'Young environmental stewards completed climate education, a 21-day plant-care cycle, reporting, evaluation and recognition.',
    'assets/planting-fatullah-10.jpg',
    'project-planting.html#activity-fatullah-planting',
    'Completed', true, true
  ),
  (
    'seeds-khanpur-2026', 'seeds-of-change-artists',
    'Seeds of Change Artists', 'Khanpur Adarsha Kindergarten',
    'Khanpur Adarsha Kindergarten', '9 April 2026',
    '2026-04-09', null, '2026-04-09',
    'Young advocates explored environmental issues and expressed their observations through visual storytelling.',
    'assets/seeds-khanpur-8.jpg',
    'project-seeds.html#activity-khanpur-seeds',
    'Completed', false, true
  ),
  (
    'planting-iet-2026', 'planting-for-the-future',
    'Planting For The Future', 'IET High School', 'IET High School',
    '26 January & 17 February 2026',
    '2026-01-26', '2026-02-17', '2026-02-17',
    'Young environmental stewards moved from climate learning into hands-on planting, stewardship and follow-up.',
    'assets/planting-iet-5.jpg',
    'project-planting.html#activity-iet-planting',
    'Completed', false, true
  ),
  (
    'seeds-fatullah-2025', 'seeds-of-change-artists',
    'Seeds of Change Artists', 'Fatullah Government Primary School',
    'Fatullah Government Primary School', '20 October 2025',
    '2025-10-20', null, '2025-10-20',
    'Climate learning, local observation and creative expression came together in an institute-based art activity for young advocates.',
    'assets/seeds-fatullah-1.jpg',
    'project-seeds.html#activity-fatullah-seeds',
    'Completed', false, true
  );

insert into public.site_settings
  (setting_key, value, is_public)
values
  (
    'homepage_feature',
    jsonb_build_object(
      'enabled', true,
      'image_url', 'assets/sustainers-nest-social-preview.jpg',
      'alt', 'Sustainers NEST - Celebrating Our Beginning'
    ),
    true
  ),
  (
    'organization_profile',
    jsonb_build_object(
      'founded_on', '2025-09-30',
      'official_name', 'Sustainers NEST'
    ),
    true
  );

insert into public.admin_users
  (user_id, display_name, email, role, active, must_change_password)
select
  id,
  coalesce(nullif(raw_user_meta_data ->> 'display_name', ''), 'Sustainers NEST Admin'),
  email,
  'admin',
  true,
  false
from auth.users
where lower(email) = 'admin@sustainersnest.org';

select 'activities' as item, count(*)::bigint as total
from public.activities
union all
select 'team_members', count(*)::bigint
from public.team_members
union all
select 'impact_metrics', count(*)::bigint
from public.impact_metrics
union all
select 'authorized_admins', count(*)::bigint
from public.admin_users
where role = 'admin'
  and active = true;
