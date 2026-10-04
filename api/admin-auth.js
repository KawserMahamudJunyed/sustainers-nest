const {
  env, setJsonHeaders, setSession, clearSession, requireSameOrigin, requireCsrf,
  authRequest, serviceRequest, rest, profileFor, ensureSession, audit, strongPassword,
} = require('./_admin-auth');

const attempts = new Map();
function loginKey(req, email) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  return `${ip}:${String(email || '').toLowerCase()}`;
}
function checkRate(req, email) {
  const key = loginKey(req, email);
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, reset: now + 15 * 60 * 1000 };
  if (entry.reset < now) { entry.count = 0; entry.reset = now + 15 * 60 * 1000; }
  if (entry.count >= 8) {
    const error = new Error('Too many sign-in attempts. Please wait before trying again.');
    error.statusCode = 429;
    throw error;
  }
  entry.count += 1;
  attempts.set(key, entry);
  return () => attempts.delete(key);
}

module.exports = async function handler(req, res) {
  setJsonHeaders(res);
  try {
    if (req.method === 'GET') {
      const session = await ensureSession(req, res, { role: 'editor', allowPasswordChange: true });
      return res.status(200).json({
        ok: true,
        csrf: session.csrf,
        user: { id: session.user.id, email: session.user.email },
        profile: session.profile,
        security: { aal: session.aal, cookieSession: true },
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, message: 'Method not allowed.' });
    }

    requireSameOrigin(req);
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const action = String(body.action || 'login');

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
      const password = String(body.password || '');
      const success = checkRate(req, email);
      if (!email || !password || password.length > 300) {
        return res.status(400).json({ ok: false, message: 'Enter your admin email and password.' });
      }

      const { response, data } = await authRequest('/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok || !data?.access_token) {
        return res.status(401).json({ ok: false, message: 'Unable to sign in with those credentials.' });
      }

      const profile = await profileFor(data.user?.id);
      if (!profile || profile.active === false) {
        clearSession(res);
        return res.status(403).json({ ok: false, message: 'This account is not authorized to manage the website.' });
      }

      success();
      const csrf = setSession(req, res, data);
      await rest('admin_users', {
        method: 'PATCH',
        query: `user_id=eq.${encodeURIComponent(data.user.id)}`,
        body: { last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        prefer: 'return=minimal',
      });
      await audit({ user: data.user, profile }, 'sign_in', 'session', data.user.id, { role: profile.role });
      return res.status(200).json({
        ok: true,
        csrf,
        profile,
        user: { id: data.user.id, email: data.user.email },
        security: { aal: 'aal1', cookieSession: true },
      });
    }

    if (action === 'logout') {
      requireCsrf(req);
      let session = null;
      try { session = await ensureSession(req, res, { role: 'editor', allowPasswordChange: true }); } catch {}
      if (session) await audit(session, 'sign_out', 'session', session.user.id);
      clearSession(res);
      return res.status(200).json({ ok: true });
    }

    if (action === 'change-password') {
      requireCsrf(req);
      const session = await ensureSession(req, res, { role: 'editor', allowPasswordChange: true });
      const password = String(body.password || '');
      const confirmation = String(body.confirmation || '');
      if (password !== confirmation) return res.status(400).json({ ok: false, message: 'The password confirmation does not match.' });
      if (!strongPassword(password)) {
        return res.status(400).json({ ok: false, message: 'Use at least 12 characters with uppercase, lowercase, a number and a symbol.' });
      }
      const { url, secret } = env();
      const updated = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(session.user.id)}`, {
        method: 'PUT',
        headers: { apikey: secret, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!updated.ok) {
        let detail = {};
        try { detail = await updated.json(); } catch {}
        return res.status(502).json({ ok: false, message: detail.msg || detail.message || 'Could not update the password.' });
      }
      await rest('admin_users', {
        method: 'PATCH', query: `user_id=eq.${encodeURIComponent(session.user.id)}`,
        body: { must_change_password: false, updated_at: new Date().toISOString() }, prefer: 'return=minimal',
      });
      await audit(session, 'change_password', 'admin_user', session.user.id);
      clearSession(res);
      return res.status(200).json({ ok: true, message: 'Password updated. Sign in again with the new password.', relogin: true });
    }

    return res.status(400).json({ ok: false, message: 'Unknown authentication action.' });
  } catch (error) {
    if (error.statusCode === 401) clearSession(res);
    return res.status(error.statusCode || 500).json({ ok: false, code: error.code || null, message: error.message || 'Authentication request failed.' });
  }
};
