const { setJsonHeaders, requireCsrf, ensureSession, rest, audit } = require('./_admin-auth');

const PROJECTS = new Set(['seeds-of-change-artists','planting-for-the-future','chasing-green','trash-to-treasure','organization']);
const TEAM_GROUPS = new Set(['executive','coordinator','volunteer']);
const CONTACT_STATUS = new Set(['new','reviewed','replied','archived']);
const VOLUNTEER_STATUS = new Set(['new','reviewing','contacted','accepted','declined','archived']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const text = (v, n = 3000) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const bool = v => v === true || v === 'true' || v === 1 || v === '1';
const integer = (v, fallback = 0) => Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : fallback;
const slug = v => text(v, 120).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90) || 'item';
function safeUrl(v, n = 800) {
  const value = text(v, n);
  if (!value) return null;
  if (/^(assets\/|[a-z0-9-]+\.html(?:[#?].*)?$|\/)/i.test(value)) return value;
  try {
    const u = new URL(value);
    if (u.protocol === 'https:') return value;
  } catch {}
  throw Object.assign(new Error('Only HTTPS or local website links are allowed.'), { statusCode: 400 });
}
function requireUuid(v) {
  if (!UUID.test(String(v || ''))) throw Object.assign(new Error('Invalid item identifier.'), { statusCode: 400 });
  return String(v);
}
function date(v) {
  const value = text(v, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Object.assign(new Error('A valid sort date is required.'), { statusCode: 400 });
  return value;
}
function activityRow(body) {
  const title = text(body.title, 180);
  const projectKey = text(body.project_key, 80);
  if (!title || !PROJECTS.has(projectKey)) throw Object.assign(new Error('Activity title and project are required.'), { statusCode: 400 });
  return {
    slug: slug(body.slug || `${title}-${body.sort_date}`),
    project_key: projectKey,
    project_label: text(body.project_label, 120) || title,
    title,
    institute: text(body.institute, 180) || null,
    date_label: text(body.date_label, 120),
    sort_date: date(body.sort_date),
    description: text(body.description, 4000),
    detail_url: safeUrl(body.detail_url),
    status_label: text(body.status_label, 60) || 'Completed',
    thumbnail_url: safeUrl(body.thumbnail_url),
    featured_home: bool(body.featured_home),
    published: bool(body.published),
    updated_at: new Date().toISOString(),
  };
}
function teamRow(body) {
  const name = text(body.name, 140);
  const group = text(body.team_group, 30);
  if (!name || !TEAM_GROUPS.has(group)) throw Object.assign(new Error('Name and a valid team group are required.'), { statusCode: 400 });
  return {
    slug: slug(body.slug || name),
    team_group: group,
    name,
    role_title: text(body.role_title, 160),
    motto: text(body.motto, 300) || null,
    photo_url: safeUrl(body.photo_url),
    photo_position: (()=>{ const pos=text(body.photo_position,60)||'center 25%'; if(!/^(?:left|center|right|(?:100|[0-9]{1,2})%)(?:\s+(?:top|center|bottom|(?:100|[0-9]{1,2})%))?$/.test(pos)) throw Object.assign(new Error('Photo focus must look like center 25%, center center, or 50% 20%.'),{statusCode:400}); return pos; })(),
    sort_order: Math.max(0, Math.min(9999, integer(body.sort_order, 100))),
    published: bool(body.published),
    updated_at: new Date().toISOString(),
  };
}
function impactRow(body) {
  const key = text(body.metric_key, 60).toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'');
  if (!key || !text(body.label,120)) throw Object.assign(new Error('Metric key and label are required.'), { statusCode: 400 });
  return {
    metric_key: key,
    label: text(body.label, 120),
    value_number: Math.max(0, integer(body.value_number, 0)),
    suffix: text(body.suffix, 12),
    sort_order: Math.max(0, Math.min(9999, integer(body.sort_order, 100))),
    published: bool(body.published),
    updated_at: new Date().toISOString(),
  };
}

async function getResource(resource, session) {
  switch (resource) {
    case 'overview': {
      const [activities, team, impact] = await Promise.all([
        rest('activities',{query:'select=id,published'}),
        rest('team_members',{query:'select=id,published'}),
        rest('impact_metrics',{query:'select=metric_key,published'}),
      ]);
      let contacts = [], volunteers = [];
      if (session.profile.role === 'admin') {
        [contacts, volunteers] = await Promise.all([
          rest('contact_submissions',{query:'select=id&status=eq.new'}),
          rest('volunteer_applications',{query:'select=id&status=eq.new'}),
        ]);
      }
      return { activities: activities.length, team: team.length, impact: impact.length, newInbox: contacts.length + volunteers.length };
    }
    case 'activities': return rest('activities',{query:'select=*&order=sort_date.desc'});
    case 'team': return rest('team_members',{query:'select=*&order=team_group.asc,sort_order.asc'});
    case 'impact': return rest('impact_metrics',{query:'select=*&order=sort_order.asc'});
    case 'homepage': return rest('site_settings',{query:'select=setting_key,value,is_public,updated_at&setting_key=eq.homepage_feature&limit=1'});
    case 'contacts':
      if (session.profile.role !== 'admin') throw Object.assign(new Error('Administrator access is required.'), { statusCode: 403 });
      return rest('contact_submissions',{query:'select=*&order=created_at.desc&limit=100'});
    case 'volunteers':
      if (session.profile.role !== 'admin') throw Object.assign(new Error('Administrator access is required.'), { statusCode: 403 });
      return rest('volunteer_applications',{query:'select=*&order=created_at.desc&limit=100'});
    case 'access':
      if (session.profile.role !== 'admin') throw Object.assign(new Error('Administrator access is required.'), { statusCode: 403 });
      return rest('admin_users',{query:'select=user_id,display_name,email,role,active,must_change_password,last_login_at,created_at,updated_at&order=created_at.asc'});
    case 'audit':
      if (session.profile.role !== 'admin') throw Object.assign(new Error('Administrator access is required.'), { statusCode: 403 });
      return rest('admin_audit_log',{query:'select=id,actor_email,action,resource_type,resource_id,details,created_at&order=created_at.desc&limit=150'});
    default: throw Object.assign(new Error('Unknown admin resource.'), { statusCode: 404 });
  }
}

module.exports = async function handler(req, res) {
  setJsonHeaders(res);
  try {
    const resource = text(req.query?.resource, 40);
    const neededRole = ['contacts','volunteers','access','audit'].includes(resource) ? 'admin' : 'editor';
    const session = await ensureSession(req, res, { role: neededRole });

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, data: await getResource(resource, session) });
    }

    if (!['POST','PATCH','DELETE'].includes(req.method)) {
      res.setHeader('Allow','GET, POST, PATCH, DELETE');
      return res.status(405).json({ ok:false, message:'Method not allowed.' });
    }
    requireCsrf(req);
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');

    if (resource === 'activities') {
      if (req.method === 'POST') {
        const row = activityRow(body);
        const data = await rest('activities',{method:'POST',body:row});
        await audit(session,'create','activity',data?.[0]?.id,{title:row.title});
        return res.status(201).json({ok:true,data:data?.[0]||null});
      }
      if (req.method === 'PATCH') {
        const id = requireUuid(body.id); const row = activityRow(body);
        const data = await rest('activities',{method:'PATCH',query:`id=eq.${id}`,body:row});
        await audit(session,'update','activity',id,{title:row.title});
        return res.status(200).json({ok:true,data:data?.[0]||null});
      }
      if (session.profile.role !== 'admin') return res.status(403).json({ok:false,message:'Only administrators can permanently remove activities. Editors can hide them by turning off Published.'});
      const id = requireUuid(body.id); await rest('activities',{method:'DELETE',query:`id=eq.${id}`,prefer:'return=minimal'}); await audit(session,'delete','activity',id); return res.status(200).json({ok:true});
    }

    if (resource === 'team') {
      if (req.method === 'POST') { const row=teamRow(body); const data=await rest('team_members',{method:'POST',body:row}); await audit(session,'create','team_member',data?.[0]?.id,{name:row.name}); return res.status(201).json({ok:true,data:data?.[0]||null}); }
      if (req.method === 'PATCH') { const id=requireUuid(body.id); const row=teamRow(body); const data=await rest('team_members',{method:'PATCH',query:`id=eq.${id}`,body:row}); await audit(session,'update','team_member',id,{name:row.name}); return res.status(200).json({ok:true,data:data?.[0]||null}); }
      if (session.profile.role !== 'admin') return res.status(403).json({ok:false,message:'Only administrators can permanently remove team profiles. Editors can hide them by turning off Published.'});
      const id=requireUuid(body.id); await rest('team_members',{method:'DELETE',query:`id=eq.${id}`,prefer:'return=minimal'}); await audit(session,'delete','team_member',id); return res.status(200).json({ok:true});
    }

    if (resource === 'impact') {
      if (req.method === 'POST') { const row=impactRow(body); const data=await rest('impact_metrics',{method:'POST',query:'on_conflict=metric_key',body:row,prefer:'resolution=merge-duplicates,return=representation'}); await audit(session,'upsert','impact_metric',row.metric_key,{label:row.label}); return res.status(200).json({ok:true,data:data?.[0]||null}); }
      if (req.method === 'PATCH') { const original=text(body.original_key,60); const row=impactRow(body); if(original && original!==row.metric_key){ if(session.profile.role!=='admin') return res.status(403).json({ok:false,message:'Only administrators can rename metric keys.'}); await rest('impact_metrics',{method:'DELETE',query:`metric_key=eq.${encodeURIComponent(original)}`,prefer:'return=minimal'}); } const data=await rest('impact_metrics',{method:'POST',query:'on_conflict=metric_key',body:row,prefer:'resolution=merge-duplicates,return=representation'}); await audit(session,'update','impact_metric',row.metric_key,{label:row.label}); return res.status(200).json({ok:true,data:data?.[0]||null}); }
      if (session.profile.role !== 'admin') return res.status(403).json({ok:false,message:'Only administrators can permanently remove impact metrics.'});
      const key=text(body.metric_key,60); await rest('impact_metrics',{method:'DELETE',query:`metric_key=eq.${encodeURIComponent(key)}`,prefer:'return=minimal'}); await audit(session,'delete','impact_metric',key); return res.status(200).json({ok:true});
    }

    if (resource === 'homepage' && ['POST','PATCH'].includes(req.method)) {
      const value = { enabled: bool(body.enabled), image_url: safeUrl(body.image_url), alt: text(body.alt,220) };
      const row = { setting_key:'homepage_feature', value, is_public:true, updated_at:new Date().toISOString() };
      const data = await rest('site_settings',{method:'POST',query:'on_conflict=setting_key',body:row,prefer:'resolution=merge-duplicates,return=representation'});
      await audit(session,'update','site_setting','homepage_feature',{enabled:value.enabled});
      return res.status(200).json({ok:true,data:data?.[0]||null});
    }

    if (resource === 'contacts' && req.method === 'PATCH') {
      if (!CONTACT_STATUS.has(body.status)) return res.status(400).json({ok:false,message:'Invalid contact status.'});
      const id=requireUuid(body.id); await rest('contact_submissions',{method:'PATCH',query:`id=eq.${id}`,body:{status:body.status},prefer:'return=minimal'}); await audit(session,'update_status','contact_submission',id,{status:body.status}); return res.status(200).json({ok:true});
    }
    if (resource === 'volunteers' && req.method === 'PATCH') {
      if (!VOLUNTEER_STATUS.has(body.status)) return res.status(400).json({ok:false,message:'Invalid volunteer status.'});
      const id=requireUuid(body.id); await rest('volunteer_applications',{method:'PATCH',query:`id=eq.${id}`,body:{status:body.status},prefer:'return=minimal'}); await audit(session,'update_status','volunteer_application',id,{status:body.status}); return res.status(200).json({ok:true});
    }

    return res.status(400).json({ok:false,message:'Unsupported admin operation.'});
  } catch (error) {
    return res.status(error.statusCode || 500).json({ok:false,code:error.code||null,message:error.message||'Admin data request failed.'});
  }
};
