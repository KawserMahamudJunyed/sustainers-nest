
const botanicalSVG = `
<svg viewBox="0 0 200 255" fill="none" aria-hidden="true">
  <path d="M34 245C72 184 96 125 111 42" stroke="currentColor" stroke-width="3"/>
  <path d="M109 47C139 33 162 16 171 2C139 6 118 20 109 47Z" fill="currentColor"/>
  <path d="M93 91C59 78 35 57 23 37C60 42 84 59 93 91Z" fill="currentColor"/>
  <path d="M83 126C120 114 145 94 158 71C120 74 92 92 83 126Z" fill="currentColor"/>
  <path d="M61 171C33 158 15 141 5 122C36 126 56 142 61 171Z" fill="currentColor"/>
  <path d="M54 195C85 186 107 170 121 150C87 151 63 167 54 195Z" fill="currentColor"/>
</svg>`;
document.querySelectorAll('[data-botanical]').forEach(el=>el.innerHTML=botanicalSVG);

const sproutSVG = `
<svg viewBox="0 0 220 260" fill="none" aria-hidden="true">
 <path d="M110 245C110 184 111 123 111 62" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
 <path d="M110 105C77 101 48 81 38 49C75 49 102 69 110 105Z" fill="#6c9f49"/>
 <path d="M112 77C142 72 168 52 177 21C144 24 120 43 112 77Z" fill="#96bf66"/>
 <path d="M112 153C145 148 170 128 181 101C147 102 121 121 112 153Z" fill="#6c9f49"/>
 <path d="M108 177C80 173 57 157 46 134C76 135 99 151 108 177Z" fill="#96bf66"/>
 <path d="M66 245C82 214 95 193 110 177C124 195 138 217 153 245H66Z" fill="#c8dba7"/>
</svg>`;
document.querySelectorAll('[data-sprout]').forEach(el=>el.innerHTML=sproutSVG);

// mobile menu
const menuBtn=document.querySelector('.menu-btn');
const navLinks=document.querySelector('.nav-links');
if(menuBtn && navLinks){
  menuBtn.addEventListener('click',()=>{
    navLinks.classList.toggle('open');
    document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded',navLinks.classList.contains('open'));
  });
}

// reveal
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}
}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// count-up
const metrics=document.querySelectorAll('[data-count]');
const mio=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(!e.isIntersecting)return;
 const el=e.target, end=Number(el.dataset.count), suffix=el.dataset.suffix||'', t0=performance.now(), dur=850;
 function tick(t){const p=Math.min((t-t0)/dur,1),v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=v+suffix;if(p<1)requestAnimationFrame(tick)}
 requestAnimationFrame(tick);mio.unobserve(el);
}),{threshold:.5});
metrics.forEach(el=>mio.observe(el));

// anniversary modal - homepage only
const modal=document.getElementById('anniversaryModal');
const closeModal=document.getElementById('closeAnniversary');
const reopen=document.querySelectorAll('[data-open-anniversary]');
function hideModal(){if(modal){modal.classList.remove('show');sessionStorage.setItem('snAnniversaryClosed','1')}}
function showModal(){if(modal){modal.classList.add('show')}}
if(modal && !sessionStorage.getItem('snAnniversaryClosed')) setTimeout(showModal,550);
if(closeModal) closeModal.addEventListener('click',hideModal);
if(modal) modal.addEventListener('click',e=>{if(e.target===modal)hideModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideModal()});
reopen.forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showModal()}));

// production forms
document.querySelectorAll('form[data-api-form]').forEach(form=>{
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const msg=form.querySelector('.alert');
    const submit=form.querySelector('button[type="submit"]');
    const endpoint=form.dataset.apiForm;

    if(!form.checkValidity()){form.reportValidity();return;}

    const data=Object.fromEntries(new FormData(form).entries());
    data.sourcePath=window.location.pathname;

    if(msg){msg.classList.remove('show','error','success');msg.textContent='';}
    const originalText=submit?submit.textContent:'';
    if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');submit.textContent='Sending...';}

    try{
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
      });
      let result={};
      try{result=await response.json();}catch(_){}
      if(!response.ok||!result.ok) throw new Error(result.message||'Submission failed.');

      if(msg){msg.classList.add('show','success');msg.textContent=result.message||'Thanks. Your submission has been received.';}
      form.reset();
    }catch(error){
      if(msg){msg.classList.add('show','error');msg.textContent=error.message||'We could not submit the form right now. Please try again.';}
    }finally{
      if(submit){submit.disabled=false;submit.removeAttribute('aria-busy');submit.textContent=originalText;}
    }
  });
});


/* SN UNIFIED CAROUSEL START */
document.querySelectorAll('[data-sn-carousel]').forEach(box=>{
  const track=box.querySelector('.sn-carousel-track');
  const originals=[...box.querySelectorAll('.sn-slide')];
  const dots=[...box.querySelectorAll('.sn-dot')];
  const prev=box.querySelector('.sn-carousel-arrow.prev');
  const next=box.querySelector('.sn-carousel-arrow.next');
  if(!track || !originals.length) return;

  const count=originals.length;
  let index=0;
  let physicalIndex=count>1?1:0;
  let timer=null;
  let touchStartX=0;
  let touchDeltaX=0;
  let dragging=false;
  let transitioning=false;
  const interval=Number(box.dataset.interval||5200);

  // Remove stale clones if this script is initialized again.
  track.querySelectorAll('.sn-clone').forEach(el=>el.remove());

  let firstClone=null,lastClone=null;
  if(count>1){
    firstClone=originals[0].cloneNode(true);
    lastClone=originals[count-1].cloneNode(true);

    firstClone.classList.add('sn-clone');
    lastClone.classList.add('sn-clone');
    firstClone.classList.remove('is-active');
    lastClone.classList.remove('is-active');

    [firstClone,lastClone].forEach(clone=>{
      clone.setAttribute('aria-hidden','true');
      clone.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el=>{
        el.setAttribute('tabindex','-1');
      });
    });

    track.insertBefore(lastClone, originals[0]);
    track.appendChild(firstClone);
  }

  originals.forEach((slide,i)=>{
    slide.classList.remove('is-active','sn-enter-right','sn-enter-left','sn-exit-left','sn-exit-right');
    slide.classList.toggle('is-active',i===0);
    slide.setAttribute('aria-hidden',i===0?'false':'true');
  });

  function syncState(){
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===index));
    originals.forEach((slide,i)=>{
      slide.classList.toggle('is-active',i===index);
      slide.setAttribute('aria-hidden',i===index?'false':'true');
    });
  }

  function moveToPhysical(position,animate=true){
    physicalIndex=position;
    track.style.transition=animate
      ? 'transform 1.05s cubic-bezier(.22,.61,.36,1)'
      : 'none';
    track.style.transform=`translate3d(${-physicalIndex*100}%,0,0)`;
    if(animate) transitioning=true;
  }

  function normalizeLoop(){
    if(count<2) return;

    // We animated from the final real slide into a clone of slide 1.
    // Jump invisibly to the real slide 1 after the movement finishes.
    if(physicalIndex===count+1){
      physicalIndex=1;
      track.style.transition='none';
      track.style.transform='translate3d(-100%,0,0)';
      void track.offsetWidth;
    }

    // Same idea in the opposite direction for Previous/swipe-right.
    if(physicalIndex===0){
      physicalIndex=count;
      track.style.transition='none';
      track.style.transform=`translate3d(${-count*100}%,0,0)`;
      void track.offsetWidth;
    }
  }

  function goNext(){
    if(count<2 || transitioning) return;
    if(index===count-1){
      index=0;
      syncState();
      moveToPhysical(count+1,true);
    }else{
      index+=1;
      syncState();
      moveToPhysical(physicalIndex+1,true);
    }
  }

  function goPrev(){
    if(count<2 || transitioning) return;
    if(index===0){
      index=count-1;
      syncState();
      moveToPhysical(0,true);
    }else{
      index-=1;
      syncState();
      moveToPhysical(physicalIndex-1,true);
    }
  }

  function goTo(target){
    if(count<2 || transitioning) return;
    target=Math.max(0,Math.min(count-1,target));
    if(target===index) return;
    index=target;
    syncState();
    moveToPhysical(index+1,true);
  }

  function start(){
    clearInterval(timer);
    if(count>1) timer=setInterval(goNext,interval);
  }

  if(count<2){
    if(prev) prev.hidden=true;
    if(next) next.hidden=true;
    const dotbox=box.querySelector('.sn-carousel-dots');
    if(dotbox) dotbox.hidden=true;
    moveToPhysical(0,false);
  }else{
    // Start on the first REAL slide, with a last-slide clone sitting before it.
    moveToPhysical(1,false);

    track.addEventListener('transitionend',e=>{
      if(e.propertyName!=='transform') return;
      transitioning=false;
      normalizeLoop();
    });

    prev?.addEventListener('click',()=>{
      goPrev();
      start();
    });

    next?.addEventListener('click',()=>{
      goNext();
      start();
    });

    dots.forEach((dot,i)=>dot.addEventListener('click',()=>{
      goTo(i);
      start();
    }));

    box.addEventListener('touchstart',e=>{
      if(transitioning) return;
      dragging=true;
      touchStartX=e.touches[0].clientX;
      touchDeltaX=0;
      clearInterval(timer);
      track.style.transition='none';
    },{passive:true});

    box.addEventListener('touchmove',e=>{
      if(!dragging) return;
      touchDeltaX=e.touches[0].clientX-touchStartX;
      const dragPct=(touchDeltaX/(box.clientWidth||1))*100;
      track.style.transform=`translate3d(${-physicalIndex*100+dragPct}%,0,0)`;
    },{passive:true});

    box.addEventListener('touchend',()=>{
      if(!dragging) return;
      dragging=false;

      if(Math.abs(touchDeltaX)>45){
        if(touchDeltaX<0) goNext();
        else goPrev();
      }else{
        moveToPhysical(physicalIndex,true);
      }
      start();
    },{passive:true});

    box.addEventListener('mouseenter',()=>clearInterval(timer));
    box.addEventListener('mouseleave',start);
  }

  syncState();
  start();
});
/* SN UNIFIED CAROUSEL END */

/* MOBILE CAROUSEL CONTROLS START */
document.querySelectorAll('[data-sn-carousel]').forEach(box=>{
  let controlsTimer=null;

  function revealControls(){
    if(window.matchMedia('(max-width: 700px)').matches){
      box.classList.add('show-controls');
      clearTimeout(controlsTimer);
      controlsTimer=setTimeout(()=>box.classList.remove('show-controls'),2600);
    }
  }

  box.addEventListener('touchstart',revealControls,{passive:true});
  box.addEventListener('click',revealControls);

  box.querySelectorAll('.sn-carousel-arrow,.sn-dot').forEach(control=>{
    control.addEventListener('focus',()=>{
      box.classList.add('show-controls');
      clearTimeout(controlsTimer);
    });
    control.addEventListener('blur',()=>{
      controlsTimer=setTimeout(()=>box.classList.remove('show-controls'),800);
    });
  });
});
/* MOBILE CAROUSEL CONTROLS END */
