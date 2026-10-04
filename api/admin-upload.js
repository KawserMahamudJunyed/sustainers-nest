const crypto = require('crypto');
const { setJsonHeaders, requireCsrf, ensureSession, env, audit } = require('./_admin-auth');

const MIME = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const ALLOWED_FOLDERS = new Set(['activities', 'team', 'homepage', 'gallery', 'partners']);
const MAX_BYTES = 2_500_000;

function safeBaseName(name) {
  return String(name || 'image').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'image';
}

module.exports = async function handler(req, res) {
  setJsonHeaders(res);
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, message: 'Method not allowed.' });
    }
    requireCsrf(req);
    const session = await ensureSession(req, res, { role: 'editor' });
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const folder = String(body.folder || '');
    const mime = String(body.mime || '').toLowerCase();
    const base64 = String(body.data || '').replace(/^data:[^;]+;base64,/, '');
    if (!ALLOWED_FOLDERS.has(folder)) return res.status(400).json({ ok: false, message: 'Invalid upload destination.' });
    if (!MIME.has(mime)) return res.status(400).json({ ok: false, message: 'Only JPG, PNG and WebP images are allowed.' });
    let buffer;
    try { buffer = Buffer.from(base64, 'base64'); } catch { return res.status(400).json({ ok: false, message: 'Invalid image data.' }); }
    if (!buffer.length || buffer.length > MAX_BYTES) return res.status(413).json({ ok: false, message: 'Image is too large. Keep optimized uploads under 2.5 MB.' });
    const signatureOk = mime === 'image/jpeg' ? (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
      : mime === 'image/png' ? (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
      : (buffer.slice(0,4).toString('ascii') === 'RIFF' && buffer.slice(8,12).toString('ascii') === 'WEBP');
    if (!signatureOk) return res.status(400).json({ ok: false, message: 'The uploaded file does not match its image type.' });

    const ext = MIME.get(mime);
    const original = safeBaseName(body.fileName).replace(/\.[^.]+$/, '');
    const path = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${original}.${ext}`;
    const { url, secret } = env();
    const response = await fetch(`${url}/storage/v1/object/site-media/${path}`, {
      method: 'POST',
      headers: { apikey: secret, 'Content-Type': mime, 'x-upsert': 'false' },
      body: buffer,
    });
    if (!response.ok) {
      let detail = {};
      try { detail = await response.json(); } catch {}
      return res.status(502).json({ ok: false, message: detail.message || 'Image upload failed.' });
    }
    const publicUrl = `${url}/storage/v1/object/public/site-media/${path}`;
    await audit(session, 'upload_media', 'storage', path, { folder, mime, bytes: buffer.length });
    return res.status(201).json({ ok: true, url: publicUrl, path });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ ok: false, code: error.code || null, message: error.message || 'Upload failed.' });
  }
};
