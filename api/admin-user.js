const { setJsonHeaders, requireCsrf, ensureSession, env, rest, audit, strongPassword } = require('./_admin-auth');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')) && String(value).length <= 254;

async function activeAdminCount(excludeUserId = '') {
  let query = 'select=user_id&role=eq.admin&active=eq.true';
  if (excludeUserId) query += `&user_id=neq.${encodeURIComponent(excludeUserId)}`;
  const rows = await rest('admin_users',{query});
  return rows.length;
}

module.exports = async function handler(req,res){
  setJsonHeaders(res);
  try{
    if(req.method!=='POST'){
      res.setHeader('Allow','POST');
      return res.status(405).json({ok:false,message:'Method not allowed.'});
    }
    requireCsrf(req);
    const session=await ensureSession(req,res,{role:'admin'});
    const body=typeof req.body==='object'?req.body:JSON.parse(req.body||'{}');
    const action=String(body.action||'create');
    const {url,secret}=env();

    if(action==='create'){
      const email=String(body.email||'').trim().toLowerCase();
      const password=String(body.password||'');
      const displayName=String(body.displayName||'').replace(/\s+/g,' ').trim().slice(0,100);
      const role=body.role==='admin'?'admin':'editor';
      if(!emailOk(email)||!displayName)return res.status(400).json({ok:false,message:'A valid name and email are required.'});
      if(!strongPassword(password))return res.status(400).json({ok:false,message:'Temporary password must have at least 12 characters, uppercase, lowercase, a number and a symbol.'});

      const created=await fetch(`${url}/auth/v1/admin/users`,{
        method:'POST',
        headers:{apikey:secret,'Content-Type':'application/json'},
        body:JSON.stringify({email,password,email_confirm:true,user_metadata:{display_name:displayName}})
      });
      const user=await created.json();
      if(!created.ok)return res.status(created.status).json({ok:false,message:user.msg||user.message||'Could not create the Supabase user.'});

      try{
        await rest('admin_users',{
          method:'POST',
          body:{user_id:user.id,display_name:displayName,email,role,active:true,must_change_password:true,updated_at:new Date().toISOString()},
          prefer:'return=minimal'
        });
      }catch(error){
        try{await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,{method:'DELETE',headers:{apikey:secret,'Content-Type':'application/json'},body:JSON.stringify({should_soft_delete:true})});}catch{}
        throw error;
      }
      await audit(session,'create_access','admin_user',user.id,{email,role});
      return res.status(201).json({ok:true,message:'Access created. The user must change the temporary password after signing in.'});
    }

    if(action==='update'){
      const target=String(body.userId||'');
      if(!UUID.test(target))return res.status(400).json({ok:false,message:'Invalid user identifier.'});
      if(target===session.user.id)return res.status(400).json({ok:false,message:'You cannot change your own role or deactivate your own account here.'});
      const rows=await rest('admin_users',{query:`select=user_id,email,role,active&user_id=eq.${encodeURIComponent(target)}&limit=1`});
      const current=rows?.[0];
      if(!current)return res.status(404).json({ok:false,message:'Admin account not found.'});
      const role=body.role==='admin'?'admin':'editor';
      const active=body.active!==false && body.active!=='false';
      if(current.role==='admin' && current.active && (role!=='admin'||!active) && await activeAdminCount(target)===0){
        return res.status(400).json({ok:false,message:'You cannot remove or demote the last active administrator.'});
      }
      await rest('admin_users',{method:'PATCH',query:`user_id=eq.${encodeURIComponent(target)}`,body:{role,active,updated_at:new Date().toISOString()},prefer:'return=minimal'});
      await audit(session,'update_access','admin_user',target,{role,active,email:current.email});
      return res.status(200).json({ok:true});
    }

    return res.status(400).json({ok:false,message:'Unknown access-management action.'});
  }catch(error){
    return res.status(error.statusCode||500).json({ok:false,code:error.code||null,message:error.message||'Admin access request failed.'});
  }
};
