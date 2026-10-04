const TABLES = new Set(['contact_submissions', 'volunteer_applications']);

function getEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error('Supabase environment variables are not configured.');
    err.statusCode = 503;
    throw err;
  }
  return { url: url.replace(/\/+$/, ''), key };
}
function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}
function cleanText(value, maxLength=3000) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g,' ').trim().slice(0,maxLength);
}
function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function isSameOrigin(req) {
  const origin=req.headers.origin;
  if (!origin) return true;
  const host=req.headers['x-forwarded-host'] || req.headers.host;
  const proto=req.headers['x-forwarded-proto'] || 'https';
  return !!host && origin === `${proto}://${host}`;
}
function setCommonHeaders(res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
}
async function insertRow(table,row) {
  if (!TABLES.has(table)) throw new Error('Invalid table.');
  const {url,key}=getEnv();
  const response=await fetch(`${url}/rest/v1/${table}`,{
    method:'POST',
    headers:{
      apikey:key,
      'Content-Type':'application/json',
      Prefer:'return=minimal'
    },
    body:JSON.stringify(row)
  });
  if (!response.ok) {
    console.error(`Supabase insert failed for ${table}:`, response.status, await response.text());
    const err=new Error('Could not save submission.');
    err.statusCode=502;
    throw err;
  }
}
module.exports={parseBody,cleanText,validEmail,isSameOrigin,setCommonHeaders,insertRow};
