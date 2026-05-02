/* Dynamic content loader for public pages */

// SVG icon templates
const ICONS = {
    nature: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3c-4 5-8 8-8 13a8 8 0 0016 0c0-5-4-8-8-13z"/></svg>',
    tech: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="2"/><circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/><line x1="12" y1="1" x2="12" y2="6" stroke-width="1.5" opacity="0.5"/><line x1="12" y1="18" x2="12" y2="23" stroke-width="1.5" opacity="0.5"/></svg>',
    science: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="8" r="5"/><path d="M2 21c0-3.87 3.13-7 7-7h2c3.87 0 7 3.13 7 7"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
};
const STAT_ICONS = { nature: 'stat-icon-green', science: 'stat-icon-cyan', tech: 'stat-icon-amber', people: 'stat-icon-white' };
const TAG_CLASSES = { 'Nature': 'tag-nature', 'Science': 'tag-science', 'Technology': 'tag-tech', 'Community': 'tag-community', 'Nature + Science': 'tag-nature', 'Education': 'tag-nature' };

// Detect current page
function getPageName() {
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    const p = path.split('/').pop() || 'index';
    return p.replace('.html', '').toLowerCase() || 'index';
}

async function loadPageContent() {
    const page = getPageName();
    try {
        if (page === 'index') await loadIndexPage();
        else if (page === 'about') await loadAboutPage();
        else if (page === 'programs') await loadProgramsPage();
        else if (page === 'events') await loadEventsPage();
        else if (page === 'contact') await loadContactPage();
        else if (page === 'get-involved') await loadGetInvolvedPage();
    } catch (err) { console.error('Content load error:', err); }
    // Wire forms
    wireContactForm();
    wireJoinForm();
    wireNewsletterForms();
}

// ── INDEX PAGE ──
async function loadIndexPage() {
    const [{ data: stats }, { data: programs }] = await Promise.all([
        supabase.from('site_stats').select('*').eq('page', 'index').order('sort_order'),
        supabase.from('programs').select('*').order('sort_order').limit(3)
    ]);
    // Hero stats
    const heroStats = (stats || []).filter(s => s.stat_group === 'hero');
    const impactCard = document.querySelector('.impact-card-float');
    if (impactCard && heroStats.length) {
        const itemsHtml = heroStats.map(s => `<div class="impact-item"><div class="impact-num"><span data-count="${s.value}">0</span></div><div class="impact-info"><strong>${s.value}+</strong><span>${s.label}</span></div></div>`).join('');
        impactCard.innerHTML = `<h3>Our Impact</h3>${itemsHtml}`;
        impactCard.querySelectorAll('[data-count]').forEach(el => { const co = new IntersectionObserver(e => { if(e[0].isIntersecting){animateC(el);co.unobserve(el);} },{threshold:0.5}); co.observe(el); });
    }
    // Main stats
    const mainStats = (stats || []).filter(s => s.stat_group === 'main');
    const statsRow = document.getElementById('statsRow');
    if (statsRow && mainStats.length) {
        statsRow.innerHTML = mainStats.map(s => `<div class="stat-box card reveal"><div class="stat-icon ${STAT_ICONS[s.icon_type]||'stat-icon-green'}">${ICONS[s.icon_type]||ICONS.nature}</div><span class="stat-number" data-count="${s.value}">0</span><span class="stat-label">${s.label}</span></div>`).join('');
    }
    // Featured programs
    const progGrid = document.getElementById('featuredPrograms');
    if (progGrid && programs) {
        progGrid.innerHTML = programs.map(p => `<div class="program-card card reveal"><span class="program-tag ${TAG_CLASSES[p.tag]||'tag-nature'}">${p.tag}</span><h3>${p.title}</h3><p>${p.description}</p><a href="/programs" class="program-link">Learn more <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a></div>`).join('');
    }
}
function animateC(el){const t=parseInt(el.dataset.count,10),d=2e3,s=performance.now();function e(t){return t===1?1:1-Math.pow(2,-10*t)}function k(n){const p=Math.min((n-s)/d,1);el.textContent=Math.floor(e(p)*t).toLocaleString();if(p<1)requestAnimationFrame(k);else el.textContent=t.toLocaleString()}requestAnimationFrame(k)}

// ── ABOUT PAGE ──
async function loadAboutPage() {
    const [{ data: sections }, { data: team }, { data: timeline }, { data: partners }] = await Promise.all([
        supabase.from('page_sections').select('*').eq('page', 'about'),
        supabase.from('team_members').select('*').order('sort_order'),
        supabase.from('timeline_items').select('*').order('sort_order'),
        supabase.from('partners').select('*').order('sort_order')
    ]);
    const sec = {};
    (sections||[]).forEach(s => sec[s.section_key] = s);
    // Story
    const storyEl = document.getElementById('aboutStory');
    if (storyEl && sec.about_story) storyEl.innerHTML = sec.about_story.content.replace(/\n/g, '</p><p style="font-size:1.05rem;color:var(--text-light);line-height:1.9;">');
    // Mission/Vision
    const mEl = document.getElementById('aboutMission');
    if (mEl && sec.about_mission) mEl.textContent = sec.about_mission.content;
    const vEl = document.getElementById('aboutVision');
    if (vEl && sec.about_vision) vEl.textContent = sec.about_vision.content;
    // Team
    const teamGrid = document.getElementById('teamGrid');
    if (teamGrid && team) {
        teamGrid.innerHTML = team.map(t => `<div class="team-card card reveal"><div class="team-avatar">${t.initials}</div><h4>${t.name}</h4><span>${t.role}</span></div>`).join('');
    }
    // Timeline
    const tlEl = document.getElementById('timelineList');
    if (tlEl && timeline) {
        tlEl.innerHTML = timeline.map(t => `<div class="timeline-item"><div class="timeline-dot"></div><span class="timeline-date">${t.year_label}</span><h4>${t.title}</h4><p>${t.description}</p></div>`).join('');
    }
    // Partners
    const pEl = document.getElementById('partnersList');
    if (pEl && partners) {
        pEl.innerHTML = partners.map(p => `<span>${p.name}</span>`).join('');
    }
}

// ── PROGRAMS PAGE ──
async function loadProgramsPage() {
    const [{ data: programs }, { data: stats }] = await Promise.all([
        supabase.from('programs').select('*').order('sort_order'),
        supabase.from('site_stats').select('*').eq('page', 'programs').order('sort_order')
    ]);
    const grid = document.getElementById('programsGrid');
    if (grid && programs) {
        grid.innerHTML = programs.map(p => `<div class="program-card card reveal"><span class="program-tag ${TAG_CLASSES[p.tag]||'tag-nature'}">${p.tag}</span><h3>${p.title}</h3><p>${p.description}</p></div>`).join('');
    }
    const sr = document.getElementById('programStats');
    if (sr && stats) {
        sr.innerHTML = stats.map(s => `<div class="stat-box card reveal"><div class="stat-icon ${STAT_ICONS[s.icon_type]||'stat-icon-green'}">${ICONS[s.icon_type]||ICONS.nature}</div><span class="stat-number" data-count="${s.value}">0</span><span class="stat-label">${s.label}</span></div>`).join('');
    }
}

// ── EVENTS PAGE ──
async function loadEventsPage() {
    const [{ data: events }, { data: announcements }] = await Promise.all([
        supabase.from('events').select('*').order('sort_order'),
        supabase.from('announcements').select('*').order('sort_order')
    ]);
    const upcoming = (events||[]).filter(e => e.is_upcoming);
    const past = (events||[]).filter(e => !e.is_upcoming);
    const uGrid = document.getElementById('upcomingEvents');
    if (uGrid) uGrid.innerHTML = upcoming.map(e => eventCardHtml(e, true)).join('') || '<p style="color:var(--text-muted);text-align:center">No upcoming events.</p>';
    const pGrid = document.getElementById('pastEvents');
    if (pGrid) pGrid.innerHTML = past.map(e => eventCardHtml(e, false)).join('');
    const aList = document.getElementById('announcementsList');
    if (aList) aList.innerHTML = (announcements||[]).map(a => `<div class="announcement-item card reveal"><span class="announcement-date">${a.date_label}</span><div><h4>${a.title}</h4><p>${a.description}</p></div></div>`).join('');
    // Wire register buttons
    document.querySelectorAll('.event-register-btn').forEach(btn => {
        btn.addEventListener('click', e => { e.preventDefault(); openRegisterModal(btn.dataset.eventId, btn.dataset.eventName); });
    });
}
function eventCardHtml(e, showRegister) {
    const icon = ICONS[e.icon_type] || ICONS.nature;
    return `<div class="event-card card reveal"><div class="event-card-img"><svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icon.replace(/<\/?svg[^>]*>/g,'')}</svg><span class="event-date-badge">${e.event_date}</span></div><div class="event-card-body"><h3>${e.title}</h3><p>${e.description}</p>${showRegister?`<a href="#" class="program-link event-register-btn" data-event-id="${e.id}" data-event-name="${e.title}">Register <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>`:''}</div></div>`;
}

// ── CONTACT PAGE ──
async function loadContactPage() {
    const { data: sections } = await supabase.from('page_sections').select('*').eq('page', 'contact').eq('section_group', 'contact_info').order('sort_order');
    const grid = document.getElementById('contactInfoGrid');
    if (grid && sections) {
        const iconMap = { 'contact_email': ICONS.mail, 'contact_phone': ICONS.phone, 'contact_address': ICONS.location };
        grid.innerHTML = sections.map(s => `<div class="contact-info-card card reveal"><div class="contact-info-icon">${iconMap[s.section_key]||ICONS.mail}</div><h4>${s.title}</h4><p>${s.content}</p></div>`).join('');
    }
}

// ── GET INVOLVED PAGE ──
async function loadGetInvolvedPage() {
    const [{ data: sections }, { data: faqs }] = await Promise.all([
        supabase.from('page_sections').select('*').eq('page', 'get-involved').order('sort_order'),
        supabase.from('faq_items').select('*').order('sort_order')
    ]);
    const pathways = (sections||[]).filter(s => s.section_group === 'pathways');
    const journey = (sections||[]).filter(s => s.section_group === 'journey');
    const pwGrid = document.getElementById('pathwayGrid');
    if (pwGrid && pathways.length) {
        const icons = ['👥','✨','❤️','💳'];
        pwGrid.innerHTML = pathways.map((p,i) => {
            const ed = p.extra_data || {};
            return `<div class="pathway-card card reveal"><div class="pathway-icon">${icons[i]||'🌱'}</div><h3>${p.title}</h3><p>${p.content}</p><a href="${ed.button_link||'#join-form'}" class="btn btn-outline" style="font-size:.82rem;padding:.6rem 1.2rem;">${ed.button_text||'Learn More'}</a></div>`;
        }).join('');
    }
    const jEl = document.getElementById('journeySteps');
    if (jEl && journey.length) {
        jEl.innerHTML = journey.map((j,i) => `<div class="journey-step card reveal"><div class="journey-step-num">${i+1}</div><h4>${j.title}</h4><p>${j.content}</p></div>`).join('');
    }
    const faqEl = document.getElementById('faqList');
    if (faqEl && faqs) {
        faqEl.innerHTML = faqs.map(f => `<div class="faq-item"><button class="faq-question">${f.question}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button><div class="faq-answer"><div class="faq-answer-inner">${f.answer}</div></div></div>`).join('');
        // Re-wire FAQ accordion
        faqEl.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.faq-item'), answer = item.querySelector('.faq-answer'), isOpen = item.classList.contains('open');
                faqEl.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-answer').style.maxHeight = '0'; });
                if (!isOpen) { item.classList.add('open'); answer.style.maxHeight = answer.scrollHeight + 'px'; }
            });
        });
    }
}

// ── FORM HANDLERS ──
function wireContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        setButtonLoading(btn, true);
        try {
            const { error } = await supabase.from('contact_submissions').insert({
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value
            });
            if (error) throw error;
            showToast('Message sent successfully! 🌱');
            form.reset();
        } catch (err) { showToast(err.message || 'Failed to send message.', 'error'); }
        finally { setButtonLoading(btn, false); }
    });
}
function wireJoinForm() {
    const form = document.getElementById('joinForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        setButtonLoading(btn, true);
        try {
            const { error } = await supabase.from('join_applications').insert({
                name: document.getElementById('joinName').value,
                email: document.getElementById('joinEmail').value,
                phone: document.getElementById('joinPhone')?.value || '',
                role: document.getElementById('joinRole').value,
                message: document.getElementById('joinMessage')?.value || ''
            });
            if (error) throw error;
            showToast('Application submitted! We\'ll get back to you within 48 hours. 🌱');
            form.reset();
        } catch (err) { showToast(err.message || 'Failed to submit application.', 'error'); }
        finally { setButtonLoading(btn, false); }
    });
}
function wireNewsletterForms() {
    document.querySelectorAll('.newsletter-form').forEach(form => {
        const btn = form.querySelector('button');
        const input = form.querySelector('input[type="email"]');
        if (!btn || !input) return;
        btn.addEventListener('click', async () => {
            if (!input.value || !input.value.includes('@')) { showToast('Please enter a valid email.', 'error'); return; }
            setButtonLoading(btn, true);
            try {
                const { error } = await supabase.from('newsletter_subscribers').insert({ email: input.value });
                if (error) { if (error.code === '23505') showToast('You\'re already subscribed!', 'info'); else throw error; }
                else { showToast('Subscribed successfully! 🎉'); input.value = ''; }
            } catch (err) { showToast(err.message || 'Subscription failed.', 'error'); }
            finally { setButtonLoading(btn, false); }
        });
    });
}

// ── EVENT REGISTRATION MODAL ──
function openRegisterModal(eventId, eventName) {
    let overlay = document.getElementById('registerModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'registerModal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal-box" style="position:relative"><button class="modal-close" onclick="closeRegisterModal()">&times;</button><h3>Register for Event</h3><p id="modalEventName"></p><form id="registerForm" class="form-grid" style="margin-top:0"><div class="form-group form-full"><label>Full Name</label><input type="text" id="regName" required placeholder="Your name"></div><div class="form-group form-full"><label>Email</label><input type="email" id="regEmail" required placeholder="you@example.com"></div><input type="hidden" id="regEventId"><input type="hidden" id="regEventName"><div class="form-group form-full"><button type="submit" class="btn btn-primary btn-full">Register</button></div></form></div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeRegisterModal(); });
        document.getElementById('registerForm').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = e.target.querySelector('[type="submit"]');
            setButtonLoading(btn, true);
            try {
                const { error } = await supabase.from('event_registrations').insert({
                    event_id: document.getElementById('regEventId').value || null,
                    event_name: document.getElementById('regEventName').value,
                    name: document.getElementById('regName').value,
                    email: document.getElementById('regEmail').value
                });
                if (error) throw error;
                showToast('Registered successfully! 🎉');
                closeRegisterModal();
                e.target.reset();
            } catch (err) { showToast(err.message || 'Registration failed.', 'error'); }
            finally { setButtonLoading(btn, false); }
        });
    }
    document.getElementById('modalEventName').textContent = eventName;
    document.getElementById('regEventId').value = eventId;
    document.getElementById('regEventName').value = eventName;
    overlay.classList.add('active');
}
function closeRegisterModal() { document.getElementById('registerModal')?.classList.remove('active'); }

// ── LOGOUT HANDLER ──
async function handleLogout(e) {
    e.preventDefault();
    await signOut();
    showToast('Signed out.');
    window.location.href = '/';
}
