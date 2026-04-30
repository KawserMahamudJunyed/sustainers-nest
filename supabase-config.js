/* ═══════════════════════════════════════════════════════════
   SUSTAINERS NEST — Supabase Configuration & Auth Helpers
   ═══════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://cgpvrmcqpmznmnrsqyay.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHZybWNxcG16bm1ucnNxeWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzU5MDMsImV4cCI6MjA5Mjc1MTkwM30.T9Urw9hZ07mljLK547f70LyztNV0FwNdG4DHMiHcR2k';

// Initialize Supabase client
let supabase;
try {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        throw new Error('Supabase JS library not loaded. Check your CDN script tag.');
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.error('Supabase init error:', e.message);
}

// ── Auth Helpers ──

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return data;
}

async function isAdmin() {
    const profile = await getUserProfile();
    return profile?.role === 'admin';
}

// ── Auth State UI ──
// Updates navbar to show/hide Login/Admin/Logout links

async function updateAuthUI() {
    const user = await getCurrentUser();
    const adminStatus = user ? await isAdmin() : false;

    // Get all auth-related nav items
    document.querySelectorAll('.auth-login-link').forEach(el => {
        el.style.display = user ? 'none' : '';
    });
    document.querySelectorAll('.auth-admin-link').forEach(el => {
        el.style.display = adminStatus ? '' : 'none';
    });
    document.querySelectorAll('.auth-logout-btn').forEach(el => {
        el.style.display = user ? '' : 'none';
    });
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    updateAuthUI();
});

// ── Toast Notification System ──

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ── Loading State Helpers ──

function setButtonLoading(btn, loading) {
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-spinner"></span> Please wait...';
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
        btn.style.pointerEvents = '';
    }
}
