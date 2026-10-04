const crypto = require('crypto');

const ACCESS_COOKIE = '__Host-sn_admin_access';
const REFRESH_COOKIE = '__Host-sn_admin_refresh';
const CSRF_COOKIE = '__Host-sn_admin_csrf';
const REFRESH_MAX_AGE = 12 * 60 * 60;

function env() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !publishable || !secret) {
    const error = new Error('Admin backend configuration is incomplete.');
    error.statusCode = 503;
    throw error;
  }
  return { url, publishable, secret };
}

function setJsonHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').map(x => x.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    if (index < 0) return [part, ''];
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value || '')}`, 'Path=/', 'SameSite=Strict', 'Secure'];
  if (options.httpOnly) parts.push('HttpOnly');
  if (Number.isFinite(options.maxAge)) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  return parts.join('; ');
}

function setCookies(res, values) {
  const current = res.getHeader('Set-Cookie');
  const list = Array.isArray(current) ? current.slice() : current ? [current] : [];
  res.setHeader('Set-Cookie', list.concat(values));
}

function clearSession(res) {
  setCookies(res, [
    cookie(ACCESS_COOKIE, '', { httpOnly: true, maxAge: 0 }),
    cookie(REFRESH_COOKIE, '', { httpOnly: true, maxAge: 0 }),
    cookie(CSRF_COOKIE, '', { maxAge: 0 }),
  ]);
}

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function setSession(req, res, session, existingCsrf = '') {
  const csrf = existingCsrf || randomToken();
  const accessAge = Math.min(Number(session.expires_in) || 3600, 3600);
  setCookies(res, [
    cookie(ACCESS_COOKIE, session.access_token, { httpOnly: true, maxAge: accessAge }),
    cookie(REFRESH_COOKIE, session.refresh_token, { httpOnly: true, maxAge: REFRESH_MAX_AGE }),
    cookie(CSRF_COOKIE, csrf, { maxAge: REFRESH_MAX_AGE }),
  ]);
  return csrf;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return Boolean(host) && origin === `${proto}://${host}`;
}

function requireSameOrigin(req) {
  if (!sameOrigin(req)) {
    const error = new Error('Request origin is not allowed.');
    error.statusCode = 403;
    throw error;
  }
}

function requireCsrf(req) {
  requireSameOrigin(req);
  const cookies = parseCookies(req);
  const cookieToken = cookies[CSRF_COOKIE] || '';
  const headerToken = String(req.headers['x-csrf-token'] || '');
  if (!cookieToken || !headerToken || cookieToken.length < 30 || cookieToken.length !== headerToken.length || !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    const error = new Error('Security token expired. Refresh the page and try again.');
    error.statusCode = 403;
    throw error;
  }
}

function decodeJwtClaims(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return {};
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

async function authRequest(path, options = {}) {
  const { url, publishable } = env();
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...options,
    headers: { apikey: publishable, ...(options.headers || {}) },
  });
  let data = null;
  try { data = await response.json(); } catch {}
  return { response, data };
}

async function serviceRequest(path, options = {}) {
  const { url, secret } = env();
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: { apikey: secret, ...(options.headers || {}) },
  });
  let data = null;
  if (response.status !== 204) {
    try { data = await response.json(); } catch { try { data = await response.text(); } catch {} }
  }
  return { response, data };
}

async function rest(table, { method = 'GET', query = '', body, prefer = 'return=representation' } = {}) {
  const { response, data } = await serviceRequest(`/rest/v1/${table}${query ? `?${query}` : ''}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const rawMessage = data?.message || data?.hint || `Database request failed (${response.status}).`;
    const schemaProblem = data?.code === '42P01' || data?.code === '42703' || data?.code === 'PGRST204' || /does not exist|schema cache|could not find.*column/i.test(String(rawMessage));
    const error = new Error(schemaProblem
      ? 'The Admin database schema is not ready. Run the new Supabase setup files in the supabase folder in order: 01, 02, then 03.'
      : rawMessage);
    error.statusCode = schemaProblem ? 503 : (response.status >= 400 && response.status < 500 ? response.status : 502);
    error.code = schemaProblem ? 'CMS_SCHEMA_OUTDATED' : (data?.code || null);
    throw error;
  }
  return data;
}

async function getUser(accessToken) {
  const { response, data } = await authRequest('/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.ok ? data : null;
}

async function refresh(refreshToken) {
  const { response, data } = await authRequest('/token?grant_type=refresh_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return response.ok ? data : null;
}

async function profileFor(userId) {
  const rows = await rest('admin_users', {
    query: `select=user_id,display_name,email,role,active,must_change_password,created_at,updated_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  });
  return rows?.[0] || null;
}

async function ensureSession(req, res, options = {}) {
  const cookies = parseCookies(req);
  let accessToken = cookies[ACCESS_COOKIE] || '';
  let user = accessToken ? await getUser(accessToken) : null;
  let csrf = cookies[CSRF_COOKIE] || '';

  if (!user && cookies[REFRESH_COOKIE]) {
    const refreshed = await refresh(cookies[REFRESH_COOKIE]);
    if (refreshed?.access_token && refreshed?.refresh_token) {
      accessToken = refreshed.access_token;
      user = refreshed.user || await getUser(accessToken);
      csrf = setSession(req, res, refreshed, csrf);
    }
  }

  if (!user) {
    clearSession(res);
    const error = new Error('Your admin session has expired. Please sign in again.');
    error.statusCode = 401;
    throw error;
  }

  const profile = await profileFor(user.id);
  if (!profile || profile.active === false) {
    clearSession(res);
    const error = new Error('This account does not have active website access.');
    error.statusCode = 403;
    throw error;
  }

  if (options.role === 'admin' && profile.role !== 'admin') {
    const error = new Error('Administrator access is required.');
    error.statusCode = 403;
    throw error;
  }
  if (options.role === 'editor' && !['admin', 'editor'].includes(profile.role)) {
    const error = new Error('Website editor access is required.');
    error.statusCode = 403;
    throw error;
  }
  if (profile.must_change_password && !options.allowPasswordChange) {
    const error = new Error('You must change your temporary password before managing website content.');
    error.statusCode = 428;
    error.code = 'PASSWORD_CHANGE_REQUIRED';
    throw error;
  }

  if (!csrf) {
    csrf = randomToken();
    setCookies(res, [cookie(CSRF_COOKIE, csrf, { maxAge: REFRESH_MAX_AGE })]);
  }

  const claims = decodeJwtClaims(accessToken);
  return { user, profile, accessToken, csrf, aal: claims.aal || 'aal1' };
}

async function audit(actor, action, resourceType, resourceId = null, details = {}) {
  try {
    await rest('admin_audit_log', {
      method: 'POST',
      body: {
        actor_user_id: actor?.user?.id || null,
        actor_email: actor?.user?.email || actor?.profile?.email || null,
        action: String(action).slice(0, 80),
        resource_type: String(resourceType).slice(0, 80),
        resource_id: resourceId ? String(resourceId).slice(0, 160) : null,
        details,
      },
      prefer: 'return=minimal',
    });
  } catch (error) {
    console.error('Audit log write failed:', error.message);
  }
}

function strongPassword(value) {
  const password = String(value || '');
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  CSRF_COOKIE,
  env,
  setJsonHeaders,
  parseCookies,
  clearSession,
  setSession,
  sameOrigin,
  requireSameOrigin,
  requireCsrf,
  decodeJwtClaims,
  authRequest,
  serviceRequest,
  rest,
  profileFor,
  ensureSession,
  audit,
  strongPassword,
};
