(()=>{
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let cfg=null;
async function rest(table,query){const r=await fetch(`${cfg.url}/rest/v1/${table}?${query}`,{headers:{apikey:cfg.key}});if(!r.ok)throw new Error(`CMS ${table} unavailable`);return r.json();}
async function getConfig(){const r=await fetch('/api/public-config');return r.json();}
function publicUrl(url){return url||'';}

async function applyImpact(){if(!document.querySelector('[data-impact-key]'))return;const rows=await rest('impact_metrics','select=metric_key,label,value_number,suffix&published=eq.true&order=sort_order.asc');const map=Object.fromEntries(rows.map(r=>[r.metric_key,r]));document.querySelectorAll('[data-impact-key]').forEach(el=>{const r=map[el.dataset.impactKey];if(!r)return;const strong=el.matches('strong')?el:el.querySelector('strong');const label=el.querySelector?.('span');if(strong){strong.textContent=`${Number(r.value_number).toLocaleString()}${r.suffix||''}`;strong.dataset.count=String(r.value_number);strong.dataset.suffix=r.suffix||'';}if(label)label.textContent=r.label;});}

function teamCard(r){const photo=r.photo_url?`<figure class="executive-photo"><img src="${esc(publicUrl(r.photo_url))}" alt="${esc(r.name)}" loading="lazy" style="object-position:${esc(r.photo_position||'center 25%')}"/></figure>`:`<figure class="executive-photo executive-photo-empty" aria-hidden="true"></figure>`;return `<article class="executive-profile reveal">${photo}<div class="executive-profile-body"><p class="executive-role">${esc(r.role_title)}</p><h3>${esc(r.name)}</h3>${r.motto?`<blockquote>“${esc(r.motto)}”</blockquote>`:'<blockquote aria-hidden="true">&nbsp;</blockquote>'}</div></article>`;}
function secondaryTeamSection(group,label,rows){if(!rows.length)return '';return `<section class="section cms-team-section"><div class="container"><div class="section-head reveal"><div><div class="eyebrow">${esc(label)}</div><h2>${esc(label)}</h2></div><p>Current ${esc(label.toLowerCase())} members documented by Sustainers NEST.</p></div><div class="executive-grid cms-secondary-team-grid">${rows.map(teamCard).join('')}</div></div></section>`;}
async function applyTeam(){const grid=document.querySelector('.executive-grid');if(!grid)return;const rows=await rest('team_members','select=*&published=eq.true&order=team_group.asc,sort_order.asc');const exec=rows.filter(r=>r.team_group==='executive');if(exec.length)grid.innerHTML=exec.map(teamCard).join('');document.querySelectorAll('.cms-team-section').forEach(x=>x.remove());const execSection=document.querySelector('#executive-team');if(execSection){const html=secondaryTeamSection('coordinator','Coordinator Team',rows.filter(r=>r.team_group==='coordinator'))+secondaryTeamSection('volunteer','Volunteers',rows.filter(r=>r.team_group==='volunteer'));execSection.insertAdjacentHTML('afterend',html);}}

function activityCard(r){const href=r.detail_url||'updates.html#all-activities';return `<article class="all-activity-card reveal"><a class="all-activity-thumb" href="${esc(href)}"><img alt="${esc(`${r.project_label}: ${r.title}`)}" loading="lazy" src="${esc(r.thumbnail_url||'assets/sustainers-nest-social-preview.jpg')}"/><span class="activity-status">${esc(r.status_label||'Completed')}</span></a><div class="all-activity-body"><div class="eyebrow">${esc(r.project_label)}</div><h3><a href="${esc(href)}">${esc(r.title)}</a></h3><p class="activity-date">${esc(r.date_label)}</p><p>${esc(r.description)}</p><a class="text-link" href="${esc(href)}">View activity →</a></div></article>`;}
async function applyUpdates(){const grid=document.querySelector('.all-activities-grid');if(!grid)return;const rows=await rest('activities','select=*&published=eq.true&order=sort_date.desc');if(!rows.length)return;grid.innerHTML=rows.map(activityCard).join('');const summary=document.querySelector('.all-activities-summary');if(summary){const projects=new Set(rows.filter(r=>r.project_key!=='organization').map(r=>r.project_key)).size;const institutes=new Set(rows.map(r=>r.institute).filter(Boolean)).size;summary.innerHTML=`<span><strong>${rows.length}</strong> documented activities</span><span><strong>${projects}</strong> projects documented</span><span><strong>${institutes}</strong> institutes + organization-wide action</span>`;}}

function initRecentCarousel(box){
  const track=box.querySelector('.sn-carousel-track');
  const originals=[...box.querySelectorAll('.sn-slide')];
  const dots=[...box.querySelectorAll('.sn-dot')];
  const prev=box.querySelector('.prev'),next=box.querySelector('.next');
  if(!track||!originals.length)return;
  const count=originals.length;
  let index=0,physical=count>1?1:0,timer=null,transitioning=false,touchStart=0,touchDelta=0;
  let firstClone,lastClone;
  if(count>1){
    firstClone=originals[0].cloneNode(true);lastClone=originals[count-1].cloneNode(true);
    firstClone.classList.add('sn-clone');lastClone.classList.add('sn-clone');
    [firstClone,lastClone].forEach(c=>{c.setAttribute('aria-hidden','true');c.querySelectorAll('a,button').forEach(x=>x.tabIndex=-1)});
    track.insertBefore(lastClone,originals[0]);track.appendChild(firstClone);
  }
  const sync=()=>{dots.forEach((d,j)=>d.classList.toggle('active',j===index));originals.forEach((sl,j)=>sl.setAttribute('aria-hidden',j===index?'false':'true'))};
  const move=(pos,animate=true)=>{physical=pos;track.style.transition=animate?'transform 1.05s cubic-bezier(.22,.61,.36,1)':'none';track.style.transform=`translate3d(${-physical*100}%,0,0)`;transitioning=animate};
  const normalize=()=>{if(count<2)return;if(physical===count+1){physical=1;track.style.transition='none';track.style.transform='translate3d(-100%,0,0)';void track.offsetWidth}if(physical===0){physical=count;track.style.transition='none';track.style.transform=`translate3d(${-count*100}%,0,0)`;void track.offsetWidth}};
  const nextSlide=()=>{if(count<2||transitioning)return;if(index===count-1){index=0;sync();move(count+1,true)}else{index++;sync();move(physical+1,true)}};
  const prevSlide=()=>{if(count<2||transitioning)return;if(index===0){index=count-1;sync();move(0,true)}else{index--;sync();move(physical-1,true)}};
  const go=n=>{if(count<2||transitioning||n===index)return;index=Math.max(0,Math.min(count-1,n));sync();move(index+1,true)};
  const start=()=>{clearInterval(timer);if(count>1)timer=setInterval(nextSlide,5000)};
  move(count>1?1:0,false);sync();
  track.addEventListener('transitionend',e=>{if(e.propertyName!=='transform')return;transitioning=false;normalize()});
  prev?.addEventListener('click',()=>{prevSlide();start()});next?.addEventListener('click',()=>{nextSlide();start()});dots.forEach((d,j)=>d.addEventListener('click',()=>{go(j);start()}));
  box.addEventListener('touchstart',e=>{if(transitioning)return;touchStart=e.touches[0].clientX;touchDelta=0;clearInterval(timer);track.style.transition='none'},{passive:true});
  box.addEventListener('touchmove',e=>{touchDelta=e.touches[0].clientX-touchStart;const pct=(touchDelta/(box.clientWidth||1))*100;track.style.transform=`translate3d(${-physical*100+pct}%,0,0)`},{passive:true});
  box.addEventListener('touchend',()=>{if(Math.abs(touchDelta)>45){touchDelta<0?nextSlide():prevSlide()}else move(physical,true);start()},{passive:true});
  start();
}
function recentSlide(r,active=false){const href=r.detail_url||'updates.html#all-activities';return `<article class="recent-activity-slide sn-slide${active?' is-active':''}"><a class="recent-activity-media" href="${esc(href)}"><img alt="${esc(r.title)}" loading="${active?'eager':'lazy'}" src="${esc(r.thumbnail_url||'assets/sustainers-nest-social-preview.jpg')}"/><span class="recent-activity-badge">${esc((r.status_label||'Completed').toUpperCase())}</span></a><div class="recent-activity-copy"><div class="eyebrow">${esc(r.project_label.toUpperCase())}</div><h3>${esc(r.title)}</h3><p class="recent-activity-date">${esc(r.date_label)}</p><p>${esc(r.description)}</p><a class="text-link" href="${esc(href)}">View activity →</a></div></article>`;}
async function applyHomepageActivities(){const old=document.querySelector('.recent-activity-carousel');if(!old)return;const rows=await rest('activities','select=*&published=eq.true&featured_home=eq.true&order=sort_date.desc&limit=8');if(!rows.length)return;const fresh=old.cloneNode(false);fresh.className=old.className;fresh.dataset.interval='5000';fresh.dataset.snCarousel='';fresh.innerHTML=`<div class="sn-carousel-track">${rows.map((r,i)=>recentSlide(r,i===0)).join('')}</div><button aria-label="Previous activity" class="sn-carousel-arrow prev">‹</button><button aria-label="Next activity" class="sn-carousel-arrow next">›</button><div class="sn-carousel-dots">${rows.map((_,i)=>`<button aria-label="Show activity ${i+1}" class="sn-dot${i===0?' active':''}"></button>`).join('')}</div>`;old.replaceWith(fresh);initRecentCarousel(fresh);}

async function applyHomepageFeature(){const section=document.querySelector('.home-brand-signature');if(!section)return;const rows=await rest('site_settings','select=setting_key,value&setting_key=eq.homepage_feature');const v=rows?.[0]?.value;if(!v)return;if(v.enabled===false||!v.image_url){section.hidden=true;return;}const img=section.querySelector('img');if(img){img.src=v.image_url;img.alt=v.alt||'Sustainers NEST';section.hidden=false;}}

(async()=>{try{cfg=await getConfig();if(!cfg.enabled)return;await Promise.allSettled([applyImpact(),applyTeam(),applyUpdates(),applyHomepageActivities(),applyHomepageFeature()]);}catch(e){console.warn('Sustainers NEST CMS fallback active:',e.message);}})();
})();
