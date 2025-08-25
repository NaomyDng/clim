/* ========= Utils ========= */
const qs  = (s,p=document)=>p.querySelector(s);
const qsa = (s,p=document)=>[...p.querySelectorAll(s)];

/* ========= Header shadow ========= */
(() => {
  const header = qs('.header');
  if(!header) return;
  const onScroll=()=>{ (window.scrollY>6)?header.classList.add('scrolled'):header.classList.remove('scrolled'); };
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
})();

/* ========= Menu hamburger ========= */
(() => {
  const ham=qs('#hamburger'), menu=qs('#menu'), closeBtn=qs('#menuClose');
  const open=()=>{menu.classList.add('open');ham&&ham.classList.add('active');ham&&ham.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';};
  const close=()=>{menu.classList.remove('open');ham&&ham.classList.remove('active');ham&&ham.setAttribute('aria-expanded','false');document.body.style.overflow='';};
  if(ham&&menu){
    ham.addEventListener('click',()=>menu.classList.contains('open')?close():open());
    closeBtn&&closeBtn.addEventListener('click',close);
    menu.addEventListener('click',e=>{if(e.target===menu)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open'))close();});
    qsa('.menu__links a',menu).forEach(a=>a.addEventListener('click',close));
  }
})();

/* ========= Routage devis/contact ========= */
(() => {
  const path=(location.pathname||'').replace(/\/+$/,'');
  const onHome=path===''||/(?:^|\/)index\.html$/i.test(path);
  const wire=(id,file)=>qsa(`a[href$="${file}"],a[href="#${id}"]`).forEach(a=>a.setAttribute('href',onHome?`#${id}`:`index.html#${id}`));
  wire('devis','devis.html'); wire('contact','contact.html');
})();

/* ========= Année footer ========= */
(() => { const y=qs('#year'); if(y) y.textContent=new Date().getFullYear(); })();

/* ========= Reveal on scroll ========= */
(() => {
  const els=qsa('.a-reveal'); if(!els.length) return;
  if(!('IntersectionObserver'in window)){els.forEach(el=>el.classList.add('is-visible'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target);}}),{threshold:.12});
  els.forEach(el=>io.observe(el));
})();

/* ========= Formulaires ========= */
(() => {
  const forms=qsa('#form-devis,#quoteForm'); if(!forms.length) return;
  const setIfEmpty=(el,txt)=>{if(el&&!el.textContent.trim())el.textContent=txt;};
  const legend=qs('#form-title'), path=location.pathname||'';
  if(legend){
    if(/entretien/i.test(path))setIfEmpty(legend,'Demande d’entretien');
    else if(/depannage/i.test(path))setIfEmpty(legend,'Demande de dépannage');
    else if(/installation/i.test(path))setIfEmpty(legend,'Demande d’info');
    else setIfEmpty(legend,'Demande de devis gratuit');
  }
  forms.forEach(f=>{
    const src=f.querySelector('#page_source'); if(src) src.value=document.title+' — '+location.href;
    const success=f.querySelector('#formSuccess')||qs('#formSuccess');
    const email=f.querySelector('#email'), phone=f.querySelector('#phone');
    const hasVal=el=>el&&el.value.trim()!=='';
    const validate=()=>{const ok=hasVal(email)||hasVal(phone);if(!ok&&email){email.setCustomValidity('Indiquez au moins un email ou un téléphone.');email.reportValidity();}else if(email){email.setCustomValidity('');}return ok;};
    email&&email.addEventListener('input',()=>email.setCustomValidity(''));
    phone&&phone.addEventListener('input',()=>email&&email.setCustomValidity(''));
    f.addEventListener('submit',e=>{
      e.preventDefault(); if(!f.checkValidity()){f.reportValidity();return;} if(!validate())return;
      const fd=new FormData(f), endpoint=f.getAttribute('action')||'', method=(f.getAttribute('method')||'POST').toUpperCase();
      if(endpoint.indexOf('https://formspree.io')===0&&method==='POST'&&'fetch'in window){
        fetch(endpoint,{method:'POST',body:fd,headers:{'Accept':'application/json'}}).catch(()=>{}).finally(()=>{
          f.reset(); if(success){success.hidden=false;try{success.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){}}});
      } else {f.reset(); if(success){success.hidden=false;}}
    });
  });
})();

/* ========= Back to top (#myBtn ou #backToTop) ========= */
(() => {
  const btn=document.getElementById('myBtn')||document.getElementById('backToTop'); if(!btn)return;
  if(btn.hasAttribute('hidden'))btn.removeAttribute('hidden'); btn.style.display='none';
  const toggle=()=>{btn.style.display=(window.scrollY>100)?'grid':'none';};
  window.addEventListener('scroll',toggle,{passive:true}); document.addEventListener('DOMContentLoaded',toggle);
  btn.addEventListener('click',e=>{e.preventDefault();const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;window.scrollTo({top:0,left:0,behavior:reduce?'auto':'smooth'});});
})();

/* ========= Devis modal ========= */
(() => {
  const modal=document.getElementById('devisModal'); if(!modal)return;
  const closer=modal.querySelector('[data-close-modal]');
  const open=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';const first=modal.querySelector('#fullname');if(first)setTimeout(()=>{try{first.focus();}catch(_){}} ,50);};
  const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';};
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.open-devis');if(b){e.preventDefault();open();}});
  closer&&closer.addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close();});
})();
