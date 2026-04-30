-- =============================================
-- SUSTAINERS NEST — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- ─── HELPER FUNCTION: Check if current user is admin ───
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════
-- 1. PROFILES
-- ═══════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Auto-create profile on signup with admin check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.email IN ('poralekhatokorina@gmail.com') THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════
-- 2. EVENTS
-- ═══════════════════════════════════════
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT,
  icon_type TEXT DEFAULT 'nature',
  is_upcoming BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 3. PROGRAMS
-- ═══════════════════════════════════════
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT DEFAULT 'Nature',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admins can insert programs" ON public.programs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete programs" ON public.programs FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 4. TEAM MEMBERS
-- ═══════════════════════════════════════
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT,
  department TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read team" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins can insert team" ON public.team_members FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update team" ON public.team_members FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete team" ON public.team_members FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 5. TIMELINE ITEMS
-- ═══════════════════════════════════════
CREATE TABLE public.timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read timeline" ON public.timeline_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert timeline" ON public.timeline_items FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update timeline" ON public.timeline_items FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete timeline" ON public.timeline_items FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 6. PARTNERS
-- ═══════════════════════════════════════
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Admins can insert partners" ON public.partners FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update partners" ON public.partners FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete partners" ON public.partners FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 7. FAQ ITEMS
-- ═══════════════════════════════════════
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read faqs" ON public.faq_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert faqs" ON public.faq_items FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update faqs" ON public.faq_items FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete faqs" ON public.faq_items FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 8. ANNOUNCEMENTS
-- ═══════════════════════════════════════
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date_label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 9. SITE STATS
-- ═══════════════════════════════════════
CREATE TABLE public.site_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value INTEGER NOT NULL,
  icon_type TEXT DEFAULT 'nature',
  page TEXT NOT NULL DEFAULT 'index',
  stat_group TEXT DEFAULT 'main',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read stats" ON public.site_stats FOR SELECT USING (true);
CREATE POLICY "Admins can insert stats" ON public.site_stats FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update stats" ON public.site_stats FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete stats" ON public.site_stats FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 10. PAGE SECTIONS (flexible key-value content)
-- ═══════════════════════════════════════
CREATE TABLE public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  page TEXT NOT NULL,
  section_group TEXT,
  title TEXT,
  content TEXT,
  icon_svg TEXT,
  extra_data JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read sections" ON public.page_sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert sections" ON public.page_sections FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update sections" ON public.page_sections FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete sections" ON public.page_sections FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 11. CONTACT SUBMISSIONS
-- ═══════════════════════════════════════
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read contacts" ON public.contact_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update contacts" ON public.contact_submissions FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete contacts" ON public.contact_submissions FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 12. JOIN APPLICATIONS
-- ═══════════════════════════════════════
CREATE TABLE public.join_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.join_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit application" ON public.join_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read applications" ON public.join_applications FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update applications" ON public.join_applications FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete applications" ON public.join_applications FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 13. NEWSLETTER SUBSCRIBERS
-- ═══════════════════════════════════════
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read subscribers" ON public.newsletter_subscribers FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- 14. EVENT REGISTRATIONS
-- ═══════════════════════════════════════
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_name TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can register" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read registrations" ON public.event_registrations FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can delete registrations" ON public.event_registrations FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- GRANT API ACCESS
-- ═══════════════════════════════════════
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- CMS tables: public read, admin write
GRANT SELECT ON public.events, public.programs, public.team_members, public.timeline_items,
  public.partners, public.faq_items, public.announcements, public.site_stats, public.page_sections
  TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events, public.programs, public.team_members, public.timeline_items,
  public.partners, public.faq_items, public.announcements, public.site_stats, public.page_sections
  TO authenticated;

-- Submission tables: public insert, admin read
GRANT INSERT ON public.contact_submissions, public.join_applications, public.newsletter_subscribers, public.event_registrations
  TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_submissions, public.join_applications, public.newsletter_subscribers, public.event_registrations
  TO authenticated;

-- Profiles
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- ═══════════════════════════════════════════════════
-- SEED DATA — Migrated from static HTML
-- ═══════════════════════════════════════════════════

-- ─── EVENTS ───
INSERT INTO public.events (title, description, event_date, icon_type, is_upcoming, sort_order) VALUES
('Green Campus Workshop', 'Hands-on workshop for students to learn rooftop gardening, composting, and biodiversity mapping techniques.', 'Apr 15, 2026', 'nature', true, 1),
('EcoTech Hackathon 2.0', '48-hour innovation sprint - teams build AI-powered sustainability solutions. Open to all university students.', 'May 10-11, 2026', 'tech', true, 2),
('Annual Sustainability Summit', 'A full-day conference featuring keynotes, panel discussions, and networking with sustainability leaders and youth innovators.', 'Jun 5, 2026', 'science', true, 3),
('Winter Tree Planting Drive', '500 trees planted across 3 districts with over 200 volunteers participating in this community drive.', 'Jan 2026', 'nature', false, 1),
('Youth Research Symposium', 'Young scientists presented 30 research posters on topics from water quality to urban biodiversity mapping.', 'Nov 2025', 'science', false, 2),
('EcoTech Hackathon 1.0', 'Our inaugural hackathon with 200+ participants building IoT and AI solutions for environmental challenges.', 'Sep 2025', 'tech', false, 3);

-- ─── PROGRAMS ───
INSERT INTO public.programs (title, description, tag, sort_order) VALUES
('Green Campus Initiative', 'Transforming school environments into living laboratories with rooftop gardens, composting systems, biodiversity zones, and environmental monitoring stations run by students.', 'Nature', 1),
('Youth Research Lab', 'A mentorship-driven program where young scientists tackle real environmental challenges - from water quality testing to soil health analysis - through experimentation and discovery.', 'Science', 2),
('EcoTech Hackathons', '48-hour innovation sprints where teams design and prototype technology solutions - IoT sensors, AI models, mobile apps - for pressing sustainability problems.', 'Technology', 3),
('Earth Champions Program', 'A comprehensive environmental stewardship program equipping youth with knowledge and leadership capacity to become agents of change in their communities.', 'Nature + Science', 4),
('Sustainability Summits', 'Annual gatherings bringing together young leaders, experts, and policymakers to co-create actionable sustainability blueprints and forge lasting partnerships.', 'Community', 5),
('Kids for Nature', 'Fostering a connection between children and the natural world through carefully designed interactive sessions, group activities, and learning materials.', 'Education', 6);

-- ─── TEAM MEMBERS ───
INSERT INTO public.team_members (name, initials, role, department, sort_order) VALUES
('Founder', 'F', 'President & Founder', '', 1),
('Vice President', 'VP', 'Strategy & Partnerships', '', 2),
('Director of Tech', 'DT', 'Technology & Innovation', '', 3),
('Director of Outreach', 'DO', 'Community & Programs', '', 4);

-- ─── TIMELINE ───
INSERT INTO public.timeline_items (year_label, title, description, sort_order) VALUES
('2024', 'The Seed Was Planted', 'Sustainers NEST was founded by a group of passionate young environmentalists and technologists in Bangladesh.', 1),
('Early 2025', 'First Green Campus Pilot', 'Launched the Green Campus Initiative in 3 schools, establishing rooftop gardens and composting systems.', 2),
('Mid 2025', 'EcoTech Hackathon 1.0', 'Organized our first 48-hour hackathon with 200+ participants building sustainability-focused tech prototypes.', 3),
('2026', 'Scaling Impact', 'Expanded to 12 countries, launched the Youth Research Lab, and grew our community to 1,200+ members.', 4);

-- ─── PARTNERS ───
INSERT INTO public.partners (name, sort_order) VALUES
('Partner 1', 1), ('Partner 2', 2), ('Partner 3', 3), ('Partner 4', 4), ('Partner 5', 5);

-- ─── FAQ ───
INSERT INTO public.faq_items (question, answer, sort_order) VALUES
('Who can join Sustainers NEST?', 'Anyone passionate about sustainability can join! We welcome students (Grade 8 and above), university students, educators, researchers, and professionals. Our programs are designed for diverse skill levels and backgrounds.', 1),
('Is there a membership fee?', 'Most of our programs and volunteer opportunities are free. Some specialized workshops and certifications may have a nominal fee to cover materials and logistics. We believe cost should never be a barrier to participation.', 2),
('How much time commitment is required?', 'It depends on the program! Hackathons are 48-hour events, the Green Campus Initiative involves weekly sessions, and volunteering can be as flexible as a few hours per month. We work around your schedule.', 3),
('Can organizations partner with Sustainers NEST?', 'Absolutely! We actively seek partnerships with schools, universities, NGOs, and businesses. We co-design programs and initiatives that align with both our mission and your goals. Reach out via our Contact page.', 4),
('Do I get a certificate?', 'Yes! All program participants and volunteers receive official certificates upon completion. Hackathon winners and research contributors receive special recognition and awards.', 5);

-- ─── ANNOUNCEMENTS ───
INSERT INTO public.announcements (title, description, date_label, sort_order) VALUES
('Website Launch!', E'We''re excited to launch our new website - your one-stop destination for all things Sustainers NEST.', 'Mar 2026', 1),
('New Partnership Announcement', 'Sustainers NEST has partnered with environmental organizations to expand our Green Campus Initiative.', 'Feb 2026', 2),
('Volunteer Applications Open', 'Join our growing volunteer network! Applications are now open for all programs and events.', 'Jan 2026', 3);

-- ─── SITE STATS ───
-- Index page hero stats
INSERT INTO public.site_stats (label, value, icon_type, page, stat_group, sort_order) VALUES
('Young Innovators', 500, 'people', 'index', 'hero', 1),
('Projects Launched', 50, 'tech', 'index', 'hero', 2),
('Countries Reached', 12, 'science', 'index', 'hero', 3);
-- Index page main stats
INSERT INTO public.site_stats (label, value, icon_type, page, stat_group, sort_order) VALUES
('Trees Planted', 2500, 'nature', 'index', 'main', 1),
('Research Papers', 85, 'science', 'index', 'main', 2),
('Tech Solutions Deployed', 30, 'tech', 'index', 'main', 3),
('Community Members', 1200, 'people', 'index', 'main', 4);
-- Programs page stats
INSERT INTO public.site_stats (label, value, icon_type, page, stat_group, sort_order) VALUES
('Schools Reached', 15, 'nature', 'programs', 'main', 1),
('Hackathon Participants', 200, 'science', 'programs', 'main', 2),
('Workshops Delivered', 25, 'tech', 'programs', 'main', 3),
('Projects Completed', 40, 'people', 'programs', 'main', 4);

-- ─── PAGE SECTIONS ───
-- Index hero
INSERT INTO public.page_sections (section_key, page, section_group, title, content) VALUES
('hero_badge', 'index', 'hero', 'Empowering the Next Generation', NULL),
('hero_title', 'index', 'hero', 'Integrating <span class="gradient-text">Nature, Science & Technology</span> for a Sustainable Future', NULL),
('hero_subtitle', 'index', 'hero', NULL, 'We nurture young innovators to harmonize ecological wisdom with cutting-edge technology - creating solutions that sustain our planet for generations to come.');

-- Index pillars
INSERT INTO public.page_sections (section_key, page, section_group, title, content, extra_data, sort_order) VALUES
('pillar_nature', 'index', 'pillars', 'Nature', 'Understanding and working with ecological systems - biomimicry, regenerative agriculture, and ecosystem restoration.', '{"features":["Ecosystem Restoration","Biomimicry Design","Regenerative Agriculture"],"number":"01"}', 1),
('pillar_science', 'index', 'pillars', 'Science', 'Evidence-based research and innovation - from climate science to material engineering, grounded in rigorous inquiry.', '{"features":["Climate Research","Material Innovation","Data-Driven Solutions"],"number":"02"}', 2),
('pillar_tech', 'index', 'pillars', 'Technology', 'Harnessing digital tools and engineering for good - AI, IoT, renewable systems that heal rather than harm.', '{"features":["AI for Sustainability","IoT & Smart Systems","Renewable Engineering"],"number":"03"}', 3);

-- Index mission/vision brief
INSERT INTO public.page_sections (section_key, page, section_group, title, content) VALUES
('mission_brief', 'index', 'mission', 'Our Mission', 'To empower young people with the knowledge, skills, and collaborative platforms to build innovative, nature-inspired solutions for a sustainable world through the integration of science and technology.'),
('vision_brief', 'index', 'mission', 'Our Vision', 'A world where every young person is equipped to be an agent of sustainable change - where ecological wisdom and technological innovation work hand-in-hand to restore and protect our planet.');

-- Index CTA
INSERT INTO public.page_sections (section_key, page, section_group, title, content) VALUES
('cta_main', 'index', 'cta', 'Ready to Shape a <span class="gradient-text">Sustainable</span> Future?', E'Whether you''re a student, educator, researcher, or changemaker - there''s a place for you in the NEST.');

-- About page
INSERT INTO public.page_sections (section_key, page, section_group, title, content) VALUES
('about_story', 'about', 'story', 'Who We Are', E'<strong style="color:var(--text-white);">Sustainers NEST</strong> (Nature, Environment, Science & Technology) is a youth-driven organization dedicated to empowering the next generation of sustainability leaders. Founded with a belief that the solutions to our planet''s greatest challenges lie at the intersection of nature, science, and technology, we create immersive programs, foster research, and build communities of young changemakers.\n\nFrom grassroots environmental projects to cutting-edge technology initiatives, we provide young people with the tools, mentorship, and platforms they need to drive real, measurable impact in their communities and beyond.'),
('about_mission', 'about', 'mission', 'Our Mission', 'To empower young people with the knowledge, skills, and collaborative platforms to build innovative, nature-inspired solutions for a sustainable world through the integration of science and technology.'),
('about_vision', 'about', 'mission', 'Our Vision', 'A world where every young person is equipped to be an agent of sustainable change - harmonizing ecological wisdom and technological innovation to restore and protect our planet for future generations.');

-- About approach cards
INSERT INTO public.page_sections (section_key, page, section_group, title, content, sort_order) VALUES
('approach_educate', 'about', 'approach', 'Educate', 'We run workshops, curricula, and online learning that blend environmental science with emerging technologies.', 1),
('approach_innovate', 'about', 'approach', 'Innovate', 'Through hackathons, labs, and collaborative projects, youth design real solutions that address pressing environmental issues.', 2),
('approach_connect', 'about', 'approach', 'Connect', 'We build communities of like-minded young leaders, mentors, and partners who amplify impact through collaboration.', 3);

-- Get-involved pathways
INSERT INTO public.page_sections (section_key, page, section_group, title, content, extra_data, sort_order) VALUES
('pathway_volunteer', 'get-involved', 'pathways', 'Volunteer', 'Join our programs on the ground. Help run workshops, plant trees, mentor youth, or support events.', '{"button_text":"Apply Now","button_link":"#join-form"}', 1),
('pathway_partner', 'get-involved', 'pathways', 'Partner', 'Collaborate with us as an institution, school, or organization. We co-create programs tailored to your community.', '{"button_text":"Let''s Talk","button_link":"contact.html"}', 2),
('pathway_donate', 'get-involved', 'pathways', 'Donate', 'Your contribution directly funds tree planting, research equipment, and educational materials for youth programs.', '{"button_text":"Contribute","button_link":"contact.html"}', 3),
('pathway_member', 'get-involved', 'pathways', 'Become a Member', 'Get exclusive access to workshops, networks, and resources. Be part of a global community of young changemakers.', '{"button_text":"Join Now","button_link":"#join-form"}', 4);

-- Get-involved journey steps
INSERT INTO public.page_sections (section_key, page, section_group, title, content, sort_order) VALUES
('journey_1', 'get-involved', 'journey', 'Apply', 'Fill out the form below with your details and interests.', 1),
('journey_2', 'get-involved', 'journey', 'Interview', 'A short conversation to understand your goals and match you to the right program.', 2),
('journey_3', 'get-involved', 'journey', 'Onboard', 'Join your cohort, receive training materials, and connect with your mentor.', 3),
('journey_4', 'get-involved', 'journey', 'Serve & Grow', 'Contribute to real projects, build your portfolio, and grow as a sustainability leader.', 4);

-- Contact info
INSERT INTO public.page_sections (section_key, page, section_group, title, content, sort_order) VALUES
('contact_email', 'contact', 'contact_info', 'Email Us', 'info@sustainersnest.org', 1),
('contact_phone', 'contact', 'contact_info', 'Call Us', '+880 1XXX-XXXXXX', 2),
('contact_address', 'contact', 'contact_info', 'Visit Us', 'Dhaka, Bangladesh', 3);

-- About CTA
INSERT INTO public.page_sections (section_key, page, section_group, title, content) VALUES
('cta_about', 'about', 'cta', 'Want to Be Part of Our Story?', 'Join the growing community of young leaders shaping a sustainable world.'),
('cta_programs', 'programs', 'cta', 'Interested in Our Programs?', E'Whether you want to participate, volunteer, or partner - we''d love to hear from you.'),
('cta_events', 'events', 'cta', E'Don''t Miss Out!', 'Subscribe to our newsletter and be the first to know about upcoming events and opportunities.');
