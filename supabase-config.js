/* ═══════════════════════════════════════════════════════════
   SUSTAINERS NEST — Supabase Configuration & Auth Helpers
   ═══════════════════════════════════════════════════════════ */

const FALLBACK_URL = 'https://cgpvrmcqpmznmnrsqyay.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHZybWNxcG16bm1ucnNxeWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzU5MDMsImV4cCI6MjA5Mjc1MTkwM30.T9Urw9hZ07mljLK547f70LyztNV0FwNdG4DHMiHcR2k';

// Initialize Supabase client
// Save CDN library reference before var declaration overwrites window.supabase
var _sbLib = window.supabase;
var supabase = null;
var supabaseInitPromise = null;

window.initSupabase = async function() {
    if (supabase) return supabase;
    if (supabaseInitPromise) return supabaseInitPromise;

    supabaseInitPromise = (async () => {
        let url = FALLBACK_URL;
        let key = FALLBACK_KEY;
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const config = await res.json();
                if (config.SUPABASE_URL || config.NEXT_PUBLIC_SUPABASE_URL) {
                    url = config.SUPABASE_URL || config.NEXT_PUBLIC_SUPABASE_URL;
                    key = config.SUPABASE_ANON_KEY || config.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                }
            }
        } catch (e) {
            console.warn('Could not load dynamic config, using fallback.');
        }

        if (_sbLib && _sbLib.createClient) {
            supabase = _sbLib.createClient(url, key);
            
            // Listen for auth state changes
            supabase.auth.onAuthStateChange((event, session) => {
                if (typeof updateAuthUI === 'function') updateAuthUI();
            });
        } else {
            console.error('Supabase JS library not loaded. Check your CDN script tag.');
        }
        return supabase;
    })();

    return supabaseInitPromise;
};

// ── Auth Helpers ──

async function signIn(email, password) {
    if (window.initSupabase) await window.initSupabase();
    if (!supabase) throw new Error('Not connected. Please refresh.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function signUp(email, password, fullName) {
    if (window.initSupabase) await window.initSupabase();
    if (!supabase) throw new Error('Not connected. Please refresh.');
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
}

async function signOut() {
    if (window.initSupabase) await window.initSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

async function getCurrentUser() {
    if (window.initSupabase) await window.initSupabase();
    if (!supabase) return null;
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

// Auth state listener is now initialized within window.initSupabase

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
