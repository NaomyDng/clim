/* =========================
   Utils
   ========================= */
const qs  = (s, p=document) => p.querySelector(s);
const qsa = (s, p=document) => [...p.querySelectorAll(s)];

/* =========================
   Header shadow au scroll
   ========================= */
(() => {
  const header = qs('.header');
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 6) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

/* =========================
   Menu hamburger (toggle + a11y)
   ========================= */
(() => {
  const ham = qs('#hamburger');
  const menu = qs('#menu');
  const closeBtn = qs('#menuClose');

  function openMenu(){
    if (!menu) return;
    menu.classList.add('open');
    ham?.classList.add('active');
    ham?.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
    qs('.menu__links a', menu)?.focus();
  }
  function closeMenu(){
    if (!menu) return;
    menu.classList.remove('open');
    ham?.classList.remove('active');
    ham?.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
    ham?.focus();
  }

  if (ham && menu){
    ham.addEventListener('click', () => menu.classList.contains('open') ? closeMenu() : openMenu());
    menu.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
    closeBtn?.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu(); });
    qsa('.menu__links a', menu).forEach(a => a.addEventListener('click', closeMenu));
  }
})();

/* =========================
   Routage intelligent vers #devis / #contact (fix Samsung)
   ========================= */
(() => {
  const path = location.pathname.replace(/\/+$/,'');
  const onHome = path === '' || /(?:^|\/)index\.html$/i.test(path);

  function wireToHomeAnchor(anchorId, legacyFile){
    const links = qsa(`a[href$="${legacyFile}"], a[href="#${anchorId}"]`);
    links.forEach(a=>{
      a.setAttribute('href', onHome ? `#${anchorId}` : `index.html#${anchorId}`);
    });
  }

  wireToHomeAnchor('devis', 'devis.html');
  wireToHomeAnchor('contact', 'contact.html');
})();

/* =========================
   Année footer
   ========================= */
(() => {
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* =========================
   Reveal on scroll
   ========================= */
(() => {
  const targets = qsa('.a-reveal');
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries, observer)=>{
    entries.forEach(e=>{
      if (e.isIntersecting){
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold:.12 });

  targets.forEach(el=> io.observe(el));
})();

/* =========================
   Formulaires — unifié + validation email OU téléphone
   ========================= */
(() => {
  const forms = qsa('#form-devis, #quoteForm');
  if (!forms.length) return;

  const setIfEmpty = (el, txt)=>{ if (el && !el.textContent.trim()) el.textContent = txt; };

  const legend = qs('#form-title');
  const path = location.pathname;
  if (legend){
    if (/entretien/i.test(path)) setIfEmpty(legend, 'Demande d’entretien');
    else if (/depannage/i.test(path)) setIfEmpty(legend, 'Demande de dépannage');
    else if (/installation/i.test(path)) setIfEmpty(legend, 'Demande d’info');
    else setIfEmpty(legend, 'Demande de devis gratuit');
  }

  forms.forEach(form=>{
    const src = form.querySelector('#page_source');
    if (src) src.value = `${document.title} — ${location.href}`;

    const success = form.querySelector('#formSuccess') || qs('#formSuccess');
    const email   = form.querySelector('#email');
    const phone   = form.querySelector('#phone');

    const hasVal = el => !!(el && el.value && el.value.trim() !== '');
    const validateContact = () => {
      const ok = hasVal(email) || hasVal(phone);
      if (!ok && email){
        email.setCustomValidity('Indiquez au moins un email ou un téléphone.');
        email.reportValidity();
      } else if (email){
        email.setCustomValidity('');
      }
      return ok;
    };
    email?.addEventListener('input', ()=> email.setCustomValidity(''));
    phone?.addEventListener('input', ()=> email?.setCustomValidity(''));

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!validateContact()) return;

      const fd = new FormData(form);
      const endpoint = form.getAttribute('action') || '';
      const method   = (form.getAttribute('method') || 'POST').toUpperCase();

      try{
        let sent = false;
        if (endpoint.startsWith('https://formspree.io') && method === 'POST'){
          const res = await fetch(endpoint, { method:'POST', body:fd, headers:{ 'Accept':'application/json' }});
          sent = res.ok;
        }
        form.reset();
        if (success){
          success.hidden = false;
          success.scrollIntoView({ behavior:'smooth', block:'center' });
        }
        if (!sent && endpoint) console.warn('Form submit non confirmé (vérifie l’endpoint).');
      }catch(err){
        console.error(err);
        // on reste discret : pas d'alert bloquante
      }
    });
  });
})();

/* =========================
   Back to top (affiche après 100px)
   ========================= */
(() => {
  const btn = document.getElementById('myBtn');
  if (!btn) return;

  btn.removeAttribute('hidden');
  btn.style.display = 'none';

  const toggle = () => {
    const scrolled = window.scrollY || window.pageYOffset || 0;
    btn.style.display = scrolled > 100 ? 'grid' : 'none';
  };

  window.addEventListener('scroll', toggle, { passive:true });
  document.addEventListener('DOMContentLoaded', toggle);

  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top:0, left:0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
})();

/* =========================
   Devis modal — ouverture globale pour .open-devis
   ========================= */
(() => {
  const modal = document.getElementById('devisModal');
  if (!modal) return;

  const closer = modal.querySelector('[data-close-modal]');

  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    const first = modal.querySelector('#fullname');
    if (first) setTimeout(()=> first.focus(), 50);
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
  };

  // Délégation : tout élément .open-devis ouvre le modal
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.open-devis');
    if (btn) { e.preventDefault(); openModal(); }
  }, { passive:false });

  closer?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
})();
