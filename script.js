/* ═══════════════════════════════════════════════════════════
   SUSTAINERS NEST — Core Interactions + Dynamic Content
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // ── Navbar scroll ──
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
    // ── Hamburger ──
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });
        navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            hamburger.classList.remove('active'); navLinks.classList.remove('open'); document.body.style.overflow = '';
        }));
    }
    // ── Active nav link ──
    const currentPage = location.pathname.split('/').pop() || '';
    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        const hrefPage = href === '/' ? '' : href.replace('/', '').replace('.html', '');
        if (hrefPage === currentPage || (currentPage === '' && (href === '/' || href === 'index.html'))) a.classList.add('active');
    });
    // ── Scroll reveal ──
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
        revealEls.forEach(el => observer.observe(el));
    }
    // ── Counter animation ──
    function animateCount(el) {
        const target = parseInt(el.dataset.count, 10);
        const dur = 2000, start = performance.now();
        function ease(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.floor(ease(p) * target).toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toLocaleString();
        }
        requestAnimationFrame(tick);
    }
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length) {
        const co = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); } });
        }, { threshold: 0.5 });
        counters.forEach(el => co.observe(el));
    }
    // ── Hero particles ──
    const particles = document.getElementById('heroParticles');
    if (particles) {
        const colors = ['#4ade80','#22d3ee','#f59e0b','#86efac'];
        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div'); p.className = 'particle';
            p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*10}s;animation-duration:${Math.random()*6+7}s;`;
            particles.appendChild(p);
        }
    }
    // ── Smooth anchor scroll ──
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            const t = document.querySelector(this.getAttribute('href'));
            if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - ((navbar ? navbar.offsetHeight : 0) + 20), behavior: 'smooth' }); }
        });
    });
    // ── FAQ accordion ──
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item'), answer = item.querySelector('.faq-answer'), isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-answer').style.maxHeight = '0'; });
            if (!isOpen) { item.classList.add('open'); answer.style.maxHeight = answer.scrollHeight + 'px'; }
        });
    });
    // ── Initialize Supabase and load content ──
    if (typeof window.initSupabase === 'function') {
        window.initSupabase().then(() => {
            if (typeof updateAuthUI === 'function') updateAuthUI();
            if (typeof loadPageContent === 'function') loadPageContent();
        });
    } else {
        if (typeof updateAuthUI === 'function') updateAuthUI();
        if (typeof loadPageContent === 'function') loadPageContent();
    }
});
