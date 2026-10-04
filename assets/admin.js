(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={session:null,csrf:'',data:{},lastActivity:Date.now(),idleTimer:null};
const loginPanel=$('#loginPanel'), app=$('#adminApp'), warning=$('#setupWarning');
const titles={overview:'Overview',activities:'Activities',homepage:'Homepage',team:'Team',impact:'Impact',contacts:'Contact inbox',volunteers:'Volunteer applications',access:'Admin access',audit:'Audit log',security:'Security'};
const projectLabels={'seeds-of-change-artists':'Seeds of Change Artists','planting-for-the-future':'Planting For The Future','chasing-green':'Chasing Green','trash-to-treasure':'Trash To Treasure','organization':'Organization-wide Advocacy'};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const setMsg=(form,text,type='')=>{const el=$('.form-message',form);if(el){el.textContent=text;el.className=`form-message ${type}`.trim();}};
const toast=(text,type='')=>{const el=document.createElement('div');el.className=`toast ${type}`.trim();el.textContent=text;$('#toastRegion').append(el);setTimeout(()=>el.remove(),4200);};
const fmtDate=v=>{try{return new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}catch{return String(v||'')}};

async function jsonRequest(url,options={}){
  const silent401=Boolean(options.silent401);
  const requestOptions={...options};delete requestOptions.silent401;
  const method=(requestOptions.method||'GET').toUpperCase();
  const headers={...(requestOptions.headers||{})};
  if(options.body!==undefined && !headers['Content-Type'])headers['Content-Type']='application/json';
  if(method!=='GET'&&method!=='HEAD'&&state.csrf)headers['X-CSRF-Token']=state.csrf;
  const response=await fetch(url,{...requestOptions,method,headers,credentials:'same-origin'});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok){
    const error=new Error(data.message||`Request failed (${response.status}).`);error.status=response.status;error.code=data.code;
    if(response.status===401&&!silent401){showLogin('Your session ended. Please sign in again.');}
    if(response.status===428){state.session.profile.must_change_password=true;applyPasswordGate();openView('security',false);}
    throw error;
  }
  return data;
}
function adminData(resource,{method='GET',body}={}){return jsonRequest(`/api/admin-data?resource=${encodeURIComponent(resource)}`,{method,body:body===undefined?undefined:JSON.stringify(body)}).then(x=>x.data);}

function showLogin(message=''){
  state.session=null;state.csrf='';app.hidden=true;loginPanel.hidden=false;
  if(message)setMsg($('#loginForm'),message,'error');
}
function showError(error){console.error(error);warning.hidden=false;warning.textContent=error.message||'Something went wrong.';}
function clearWarning(){warning.hidden=true;warning.textContent='';}
function role(){return state.session?.profile?.role||'editor';}
function isAdmin(){return role()==='admin';}
function applyIdentity(){
  const p=state.session.profile,u=state.session.user;
  $('#adminIdentityName').textContent=p.display_name||u.email||'Website user';
  $('#adminIdentity').textContent=`${u.email||p.email||''} · ${p.role}`;
  $('#roleChip').textContent=p.role;
  $('#securityEmail').textContent=u.email||p.email||'—';
  $('#securityRole').textContent=p.role==='admin'?'Administrator':'Editor';
  $$('[data-admin-only]').forEach(el=>el.hidden=!isAdmin());
  $('#permissionTitle').textContent=isAdmin()?'Website administrator':'Website editor';
  $('#permissionCopy').textContent=isAdmin()?'You can manage public content, private submissions, access permissions and permanent removals.':'You can add, edit, publish and hide public content. Private submissions, access controls and permanent deletion stay with administrators.';
}
function applyPasswordGate(){
  const required=Boolean(state.session?.profile?.must_change_password);
  $$('#adminNav button').forEach(b=>{if(b.dataset.view!=='security')b.disabled=required;});
  if(required){warning.hidden=false;warning.textContent='This account is using a temporary password. Change it in Security before managing website content.';}
  else clearWarning();
}
function openView(name,load=true){
  if(state.session?.profile?.must_change_password && name!=='security')name='security';
  $$('[data-view-panel]').forEach(x=>x.classList.toggle('active',x.dataset.viewPanel===name));
  $$('#adminNav button').forEach(x=>x.classList.toggle('active',x.dataset.view===name));
  $('#viewTitle').textContent=titles[name]||name;
  $('#adminSidebar').classList.remove('open');$('#mobileNavBtn').setAttribute('aria-expanded','false');
  clearWarning();
  if(state.session?.profile?.must_change_password){warning.hidden=false;warning.textContent='Change your temporary password before continuing.';}
  if(load&&loaders[name])loaders[name]().catch(showError);
}

async function init(){
  try{
    const result=await jsonRequest('/api/admin-auth',{silent401:true});
    state.session=result;state.csrf=result.csrf||'';
    loginPanel.hidden=true;app.hidden=false;applyIdentity();applyPasswordGate();startIdleTimer();
    openView(result.profile.must_change_password?'security':'overview');
  }catch(error){if(error.status===401){showLogin();}else{showLogin(error.message);}}
}
async function login(email,password){
  const result=await jsonRequest('/api/admin-auth',{method:'POST',body:JSON.stringify({action:'login',email,password})});
  state.session=result;state.csrf=result.csrf||'';loginPanel.hidden=true;app.hidden=false;setMsg($('#loginForm'),'');applyIdentity();applyPasswordGate();startIdleTimer();openView(result.profile.must_change_password?'security':'overview');
}
async function logout(silent=false){
  try{if(state.csrf)await jsonRequest('/api/admin-auth',{method:'POST',body:JSON.stringify({action:'logout'})});}catch{}
  if(state.idleTimer)clearInterval(state.idleTimer);state.session=null;state.csrf='';app.hidden=true;loginPanel.hidden=false;
  if(!silent)setMsg($('#loginForm'),'You have been signed out.','success');
}
function startIdleTimer(){
  const mark=()=>state.lastActivity=Date.now();
  ['pointerdown','keydown','touchstart'].forEach(e=>document.addEventListener(e,mark,{passive:true}));
  state.lastActivity=Date.now();if(state.idleTimer)clearInterval(state.idleTimer);
  state.idleTimer=setInterval(()=>{if(Date.now()-state.lastActivity>20*60*1000){logout(true);setMsg($('#loginForm'),'Signed out after 20 minutes of inactivity.','error');}},60000);
}

async function prepareImage(file){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use a JPG, PNG or WebP image.');
  const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the image.'));r.readAsDataURL(file);});
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not process the image.'));img.src=dataUrl;});
  const max=1800,scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));
  if(!blob)throw new Error('Could not optimize the image.');
  if(blob.size>2400000)throw new Error('The optimized image is still too large. Please use a smaller source image.');
  const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(new Error('Could not prepare the image.'));r.readAsDataURL(blob);});
  return {data:base64,mime:'image/webp',fileName:(file.name||'image').replace(/\.[^.]+$/,'.webp')};
}
async function upload(file,folder){
  if(!file)return '';
  const payload=await prepareImage(file);
  const result=await jsonRequest('/api/admin-upload',{method:'POST',body:JSON.stringify({folder,...payload})});
  return result.url;
}
function buttonBusy(button,busy,label='Saving...'){if(!button)return;if(busy){button.dataset.original=button.textContent;button.textContent=label;button.disabled=true;}else{button.textContent=button.dataset.original||button.textContent;button.disabled=false;}}

async function loadOverview(){const d=await adminData('overview');$('#overviewStats').innerHTML=[['Activities',d.activities,'CMS records'],['Team profiles',d.team,'Published + hidden'],['Impact metrics',d.impact,'Tracked figures'],['New inbox items',d.newInbox,isAdmin()?'Needs review':'Admin only']].map(([l,n,s])=>`<div class="stat"><strong>${esc(n)}</strong><span>${esc(l)}</span><small>${esc(s)}</small></div>`).join('');}

async function loadActivities(){
  const rows=await adminData('activities');state.data.activities=rows;
  $('#activitiesList').innerHTML=rows.length?`<div class="data-list">${rows.map(r=>`<div class="data-row"><div class="thumb-row">${r.thumbnail_url?`<img class="mini-thumb" src="${esc(r.thumbnail_url)}" alt="" loading="lazy"/>`:'<div class="mini-thumb empty">No photo</div>'}<div><strong>${esc(r.title)}</strong><small>${esc(r.project_label)} · ${esc(r.date_label)}${r.featured_home?' · Homepage featured':''}</small></div></div><span class="pill ${r.published?'':'draft'}">${r.published?'Published':'Hidden'}</span><div class="row-actions"><button data-edit-activity="${r.id}">Edit</button>${isAdmin()?`<button class="delete" data-delete-activity="${r.id}">Remove</button>`:''}</div></div>`).join('')}</div>`:'<div class="empty">No activities yet.</div>';
  $$('[data-edit-activity]').forEach(b=>b.onclick=()=>editActivity(b.dataset.editActivity));$$('[data-delete-activity]').forEach(b=>b.onclick=()=>deleteActivity(b.dataset.deleteActivity));
}
function editActivity(id=''){
  const r=state.data.activities?.find(x=>x.id===id),f=$('#activityForm');f.hidden=false;f.reset();
  if(r){for(const k of ['id','project_key','project_label','title','institute','date_label','sort_date','description','detail_url','status_label','thumbnail_url'])if(f.elements[k])f.elements[k].value=r[k]??'';f.elements.featured_home.checked=!!r.featured_home;f.elements.published.checked=!!r.published;$('#activityFormTitle').textContent='Edit activity';}
  else{$('#activityFormTitle').textContent='Add activity';f.elements.published.checked=true;f.elements.project_label.value=projectLabels[f.elements.project_key.value]||'';}
  f.scrollIntoView({behavior:'smooth',block:'start'});
}
async function deleteActivity(id){if(!confirm('Permanently remove this activity? This cannot be undone from the dashboard.'))return;await adminData('activities',{method:'DELETE',body:{id}});toast('Activity removed.');await loadActivities();await loadOverview();}
$('#newActivityBtn').onclick=()=>editActivity();
$('#activityForm').elements.project_key.onchange=e=>{$('#activityForm').elements.project_label.value=projectLabels[e.target.value]||'';};
$('#activityForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$('button[type="submit"]',f);try{buttonBusy(button,true);setMsg(f,'Preparing update...');const d=Object.fromEntries(new FormData(f));const file=f.elements.thumbnail_file.files[0];if(file)d.thumbnail_url=await upload(file,'activities');const body={...d,featured_home:f.elements.featured_home.checked,published:f.elements.published.checked};await adminData('activities',{method:d.id?'PATCH':'POST',body});setMsg(f,'Activity saved.','success');toast('Activity saved.');f.hidden=true;await loadActivities();}catch(err){setMsg(f,err.message,'error')}finally{buttonBusy(button,false)}};

async function loadHomepage(){const rows=await adminData('homepage'),value=rows?.[0]?.value||{};const f=$('#homepageForm');f.elements.image_url.value=value.image_url||'';f.elements.alt.value=value.alt||'';f.elements.enabled.checked=value.enabled!==false;renderHomepagePreview(value.image_url||'');}
function renderHomepagePreview(url){const p=$('#homepagePreview');p.innerHTML=url?`<img src="${esc(url)}" alt="Homepage preview"/>`:'<span>No image selected</span>';}
$('#homepageForm').elements.image_url.oninput=e=>renderHomepagePreview(e.target.value.trim());
$('#homepageForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$('button[type="submit"]',f);try{buttonBusy(button,true);setMsg(f,'Saving homepage...');let image=f.elements.image_url.value.trim();const file=f.elements.image_file.files[0];if(file)image=await upload(file,'homepage');await adminData('homepage',{method:'POST',body:{enabled:f.elements.enabled.checked,image_url:image,alt:f.elements.alt.value.trim()}});f.elements.image_url.value=image;renderHomepagePreview(image);setMsg(f,'Homepage updated.','success');toast('Homepage updated.');}catch(err){setMsg(f,err.message,'error')}finally{buttonBusy(button,false)}};
$('#removeHomepageImage').onclick=()=>{const f=$('#homepageForm');if(!confirm('Hide the homepage feature image? The image file will not be deleted from storage.'))return;f.elements.enabled.checked=false;f.requestSubmit();};

async function loadTeam(){
  const rows=await adminData('team');state.data.team=rows;
  $('#teamList').innerHTML=rows.length?`<div class="data-list">${rows.map(r=>`<div class="data-row"><div class="thumb-row">${r.photo_url?`<img class="mini-thumb" src="${esc(r.photo_url)}" alt="" loading="lazy"/>`:'<div class="mini-thumb empty">Photo free</div>'}<div><strong>${esc(r.name)}</strong><small>${esc(r.role_title)} · ${esc(r.team_group)}</small></div></div><span class="pill ${r.published?'':'draft'}">${r.published?'Published':'Hidden'}</span><div class="row-actions"><button data-edit-team="${r.id}">Edit</button>${isAdmin()?`<button class="delete" data-delete-team="${r.id}">Remove</button>`:''}</div></div>`).join('')}</div>`:'<div class="empty">No team members yet.</div>';
  $$('[data-edit-team]').forEach(b=>b.onclick=()=>editTeam(b.dataset.editTeam));$$('[data-delete-team]').forEach(b=>b.onclick=()=>deleteTeam(b.dataset.deleteTeam));
}
function editTeam(id=''){const r=state.data.team?.find(x=>x.id===id),f=$('#teamForm');f.hidden=false;f.reset();if(r){for(const k of ['id','team_group','name','role_title','motto','photo_url','photo_position','sort_order'])if(f.elements[k])f.elements[k].value=r[k]??'';f.elements.published.checked=!!r.published;$('#teamFormTitle').textContent='Edit team member';}else{$('#teamFormTitle').textContent='Add team member';f.elements.sort_order.value=100;f.elements.photo_position.value='center 25%';f.elements.published.checked=true;}f.scrollIntoView({behavior:'smooth',block:'start'});}
async function deleteTeam(id){if(!confirm('Permanently remove this team profile?'))return;await adminData('team',{method:'DELETE',body:{id}});toast('Team profile removed.');await loadTeam();}
$('#newTeamBtn').onclick=()=>editTeam();
$('#teamForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$('button[type="submit"]',f);try{buttonBusy(button,true);setMsg(f,'Saving member...');const d=Object.fromEntries(new FormData(f));const file=f.elements.photo_file.files[0];if(file)d.photo_url=await upload(file,'team');await adminData('team',{method:d.id?'PATCH':'POST',body:{...d,published:f.elements.published.checked}});setMsg(f,'Team member saved.','success');toast('Team member saved.');f.hidden=true;await loadTeam();}catch(err){setMsg(f,err.message,'error')}finally{buttonBusy(button,false)}};

async function loadImpact(){const rows=await adminData('impact');state.data.impact=rows;$('#impactList').innerHTML=rows.length?`<div class="data-list">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.value_number)}${esc(r.suffix)} · ${esc(r.label)}</strong><small>${esc(r.metric_key)}</small></div><span class="pill ${r.published?'':'draft'}">${r.published?'Published':'Hidden'}</span><div class="row-actions"><button data-edit-impact="${esc(r.metric_key)}">Edit</button>${isAdmin()?`<button class="delete" data-delete-impact="${esc(r.metric_key)}">Remove</button>`:''}</div></div>`).join('')}</div>`:'<div class="empty">No impact metrics yet.</div>';$$('[data-edit-impact]').forEach(b=>b.onclick=()=>editImpact(b.dataset.editImpact));$$('[data-delete-impact]').forEach(b=>b.onclick=()=>deleteImpact(b.dataset.deleteImpact));}
function editImpact(key=''){const r=state.data.impact?.find(x=>x.metric_key===key),f=$('#impactForm');f.hidden=false;f.reset();if(r){f.elements.original_key.value=r.metric_key;for(const k of ['metric_key','label','value_number','suffix','sort_order'])f.elements[k].value=r[k]??'';f.elements.published.checked=!!r.published;}else{f.elements.sort_order.value=100;f.elements.published.checked=true;}f.scrollIntoView({behavior:'smooth',block:'start'});}
async function deleteImpact(key){if(!confirm('Permanently remove this impact metric?'))return;await adminData('impact',{method:'DELETE',body:{metric_key:key}});toast('Impact metric removed.');await loadImpact();}
$('#newImpactBtn').onclick=()=>editImpact();
$('#impactForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$('button[type="submit"]',f);try{buttonBusy(button,true);const d=Object.fromEntries(new FormData(f));await adminData('impact',{method:d.original_key?'PATCH':'POST',body:{...d,published:f.elements.published.checked}});setMsg(f,'Impact metric saved.','success');toast('Impact metric saved.');f.hidden=true;await loadImpact();}catch(err){setMsg(f,err.message,'error')}finally{buttonBusy(button,false)}};

async function loadContacts(){const rows=await adminData('contacts');$('#contactsList').innerHTML=rows.length?`<div class="data-list">${rows.map(r=>`<article class="message-card"><div class="message-meta"><strong>${esc(r.name)} · ${esc(r.email)}</strong><span>${esc(fmtDate(r.created_at))}</span></div><p><b>${esc(r.topic)}</b></p><p>${esc(r.message)}</p><select class="status-select" data-contact-status="${r.id}">${['new','reviewed','replied','archived'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></article>`).join('')}</div>`:'<div class="empty">No contact messages yet.</div>';$$('[data-contact-status]').forEach(s=>s.onchange=async()=>{try{await adminData('contacts',{method:'PATCH',body:{id:s.dataset.contactStatus,status:s.value}});toast('Contact status updated.');}catch(e){showError(e)}});}
async function loadVolunteers(){const rows=await adminData('volunteers');$('#volunteersList').innerHTML=rows.length?`<div class="data-list">${rows.map(r=>`<article class="message-card"><div class="message-meta"><strong>${esc(r.name)} · ${esc(r.email)}</strong><span>${esc(fmtDate(r.created_at))}</span></div><p><b>${esc(r.area_of_interest)}</b></p><p>${esc(r.about||'No additional note.')}</p><select class="status-select" data-volunteer-status="${r.id}">${['new','reviewing','contacted','accepted','declined','archived'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></article>`).join('')}</div>`:'<div class="empty">No volunteer applications yet.</div>';$$('[data-volunteer-status]').forEach(s=>s.onchange=async()=>{try{await adminData('volunteers',{method:'PATCH',body:{id:s.dataset.volunteerStatus,status:s.value}});toast('Volunteer status updated.');}catch(e){showError(e)}});}

async function loadAccess(){
  const rows=await adminData('access');state.data.access=rows;
  $('#accessList').innerHTML=rows.length?`<div class="data-list">${rows.map(r=>{const self=r.user_id===state.session.user.id;return `<div class="data-row"><div><strong>${esc(r.display_name||r.email||'Website user')}</strong><small>${esc(r.email||'')} · ${r.last_login_at?`Last sign in ${esc(fmtDate(r.last_login_at))}`:'Never signed in'}${r.must_change_password?' · Password change required':''}</small></div><span class="pill ${r.active?'':'inactive'}">${r.active?esc(r.role):'Access disabled'}</span><div class="row-actions">${self?'<button disabled>Your account</button>':`<select class="status-select" data-access-role="${r.user_id}" ${r.active?'':'disabled'}><option value="editor" ${r.role==='editor'?'selected':''}>Editor</option><option value="admin" ${r.role==='admin'?'selected':''}>Admin</option></select><button data-access-toggle="${r.user_id}" data-active="${r.active?'true':'false'}">${r.active?'Disable':'Restore'}</button>`}</div></div>`}).join('')}</div>`:'<div class="empty">No authorized accounts.</div>';
  $$('[data-access-role]').forEach(s=>s.onchange=()=>updateAccess(s.dataset.accessRole,{role:s.value,active:true}));$$('[data-access-toggle]').forEach(b=>b.onclick=()=>updateAccess(b.dataset.accessToggle,{role:state.data.access.find(x=>x.user_id===b.dataset.accessToggle)?.role||'editor',active:b.dataset.active!=='true'}));
}
async function updateAccess(userId,changes){if(!confirm('Apply this access change?')){await loadAccess();return;}try{await jsonRequest('/api/admin-user',{method:'POST',body:JSON.stringify({action:'update',userId,...changes})});toast('Access updated.');await loadAccess();}catch(e){toast(e.message,'error');await loadAccess();}}
$('#accessForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$('button[type="submit"]',f);try{buttonBusy(button,true,'Creating...');const body=Object.fromEntries(new FormData(f));await jsonRequest('/api/admin-user',{method:'POST',body:JSON.stringify({action:'create',...body})});f.reset();setMsg(f,'Access created. Share the temporary password privately. The user must replace it after first sign-in.','success');toast('New website access created.');await loadAccess();}catch(err){setMsg(f,err.message,'error')}finally{buttonBusy(button,false)}};
$('#generatePasswordBtn').onclick=()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';const arr=new Uint32Array(18);crypto.getRandomValues(arr);let p=Array.from(arr,n=>chars[n%chars.length]).join('');p=`Aa9!${p}`;const input=$('#accessForm').elements.password;input.value=p;input.type='text';toast('Strong temporary password generated. Copy it securely.');};

async function loadAudit(){const rows=await adminData('audit');$('#auditList').innerHTML=rows.length?`<div>${rows.map(r=>`<div class="audit-row"><time>${esc(fmtDate(r.created_at))}</time><div><strong>${esc(r.action.replaceAll('_',' '))}</strong><span>${esc(r.resource_type)}${r.resource_id?` · ${esc(r.resource_id)}`:''}</span></div><span>${esc(r.actor_email||'System')}</span></div>`).join('')}</div>`:'<div class="empty">No administrative changes recorded yet.</div>';}
async function loadSecurity(){applyIdentity();}
$('#passwordForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$('button[type="submit"]',f);try{buttonBusy(button,true,'Updating...');const d=Object.fromEntries(new FormData(f));const result=await jsonRequest('/api/admin-auth',{method:'POST',body:JSON.stringify({action:'change-password',...d})});state.session.profile.must_change_password=false;f.reset();setMsg(f,result.message||'Password updated.','success');if(result.relogin){state.session=null;state.csrf='';app.hidden=true;loginPanel.hidden=false;setMsg($('#loginForm'),result.message,'success');return;}applyPasswordGate();toast('Password updated.');$$('#adminNav button').forEach(b=>b.disabled=false);}catch(err){setMsg(f,err.message,'error')}finally{buttonBusy(button,false)}};

const loaders={overview:loadOverview,activities:loadActivities,homepage:loadHomepage,team:loadTeam,impact:loadImpact,contacts:loadContacts,volunteers:loadVolunteers,access:loadAccess,audit:loadAudit,security:loadSecurity};
$$('#adminNav button').forEach(b=>b.onclick=()=>openView(b.dataset.view));
$('#logoutBtn').onclick=()=>logout();
$('#mobileNavBtn').onclick=()=>{const open=$('#adminSidebar').classList.toggle('open');$('#mobileNavBtn').setAttribute('aria-expanded',String(open));};
$$('[data-cancel-form]').forEach(b=>b.onclick=()=>$('#'+b.dataset.cancelForm).hidden=true);
$$('[data-password-toggle]').forEach(b=>b.onclick=()=>{const input=b.closest('.password-wrap').querySelector('input');const visible=input.type==='text';input.type=visible?'password':'text';b.textContent=visible?'Show':'Hide';b.setAttribute('aria-label',visible?'Show password':'Hide password');});
$('#loginForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$('button[type="submit"]',f);try{buttonBusy(button,true,'Signing in...');setMsg(f,'Checking access...');const d=Object.fromEntries(new FormData(f));await login(d.email,d.password);}catch(err){setMsg(f,err.message,'error')}finally{buttonBusy(button,false)}};

init();
})();
