/* =========================
   Utils (compat larges navigateurs)
   ========================= */
(function(){
  window.__u = {
    qs: function(sel, parent){ return (parent || document).querySelector(sel); },
    qsa: function(sel, parent){ return Array.prototype.slice.call((parent || document).querySelectorAll(sel)); }
  };
})();

/* =========================
   Header : ombre au scroll
   ========================= */
(function(){
  var qs = __u.qs;
  var header = qs('.header');
  if (!header) return;

  function onScroll(){
    var y = window.scrollY || window.pageYOffset || 0;
    if (y > 6) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

/* =========================
   Menu hamburger (toggle + a11y)
   ========================= */
(function(){
  var qs = __u.qs, qsa = __u.qsa;
  var ham = qs('#hamburger');
  var menu = qs('#menu');
  var closeBtn = qs('#menuClose');

  function openMenu(){
    if (!menu) return;
    menu.classList.add('open');
    if (ham){ ham.classList.add('active'); ham.setAttribute('aria-expanded','true'); }
    document.body.style.overflow = 'hidden';
    var firstLink = qs('.menu__links a', menu);
    if (firstLink){ try{ firstLink.focus(); }catch(_){ } }
  }
  function closeMenu(){
    if (!menu) return;
    menu.classList.remove('open');
    if (ham){ ham.classList.remove('active'); ham.setAttribute('aria-expanded','false'); try{ ham.focus(); }catch(_){ } }
    document.body.style.overflow = '';
  }

  if (ham && menu){
    ham.addEventListener('click', function(){
      if (menu.classList.contains('open')) closeMenu(); else openMenu();
    });
    menu.addEventListener('click', function(e){
      if (e.target === menu) closeMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
    });
    qsa('.menu__links a', menu).forEach(function(a){ a.addEventListener('click', closeMenu); });
  }
})();

/* =========================
   Routage vers #devis / #contact (fix sous-pages)
   ========================= */
(function(){
  var qsa = __u.qsa;
  var path = (location.pathname || '').replace(/\/+$/,'');
  var onHome = path === '' || /(?:^|\/)index\.html$/i.test(path);

  function wireToHomeAnchor(anchorId, legacyFile){
    var links = qsa('a[href$="'+legacyFile+'"], a[href="#'+anchorId+'"]');
    links.forEach(function(a){
      a.setAttribute('href', onHome ? ('#'+anchorId) : ('index.html#'+anchorId));
    });
  }

  wireToHomeAnchor('devis', 'devis.html');
  wireToHomeAnchor('contact', 'contact.html');
})();

/* =========================
   Année footer
   ========================= */
(function(){
  var yearEl = __u.qs('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* =========================
   Reveal on scroll (avec fallback si IO absent)
   ========================= */
(function(){
  var qsa = __u.qsa;
  var targets = qsa('.a-reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)){
    targets.forEach(function(el){ el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function(entries, observer){
    entries.forEach(function(e){
      if (e.isIntersecting){
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function(el){ io.observe(el); });
})();

/* =========================
   Formulaires — email OU téléphone requis
   ========================= */
(function(){
  var qs = __u.qs, qsa = __u.qsa;
  var forms = qsa('#form-devis, #quoteForm');
  if (!forms.length) return;

  function setIfEmpty(el, txt){ if (el && !el.textContent.trim()) el.textContent = txt; }

  var legend = qs('#form-title');
  var path = location.pathname || '';
  if (legend){
    if (/entretien/i.test(path)) setIfEmpty(legend, 'Demande d’entretien');
    else if (/depannage/i.test(path)) setIfEmpty(legend, 'Demande de dépannage');
    else if (/installation/i.test(path)) setIfEmpty(legend, 'Demande d’info');
    else setIfEmpty(legend, 'Demande de devis gratuit');
  }

  forms.forEach(function(form){
    var src = form.querySelector('#page_source');
    if (src) src.value = document.title + ' — ' + location.href;

    var success = form.querySelector('#formSuccess') || qs('#formSuccess');
    var email   = form.querySelector('#email');
    var phone   = form.querySelector('#phone');

    function hasVal(el){ return !!(el && el.value && el.value.trim() !== ''); }
    function validateContact(){
      var ok = hasVal(email) || hasVal(phone);
      if (!ok && email){
        email.setCustomValidity('Indiquez au moins un email ou un téléphone.');
        email.reportValidity();
      } else if (email){
        email.setCustomValidity('');
      }
      return ok;
    }
    if (email) email.addEventListener('input', function(){ email.setCustomValidity(''); });
    if (phone) phone.addEventListener('input', function(){ if (email) email.setCustomValidity(''); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (!form.checkValidity()){ form.reportValidity(); return; }
      if (!validateContact()) return;

      var fd = new FormData(form);
      var endpoint = form.getAttribute('action') || '';
      var method   = (form.getAttribute('method') || 'POST').toUpperCase();

      if (endpoint.indexOf('https://formspree.io') === 0 && method === 'POST' && 'fetch' in window){
        fetch(endpoint, { method:'POST', body:fd, headers:{ 'Accept':'application/json' }})
          .then(function(){ /* ok/nok: on affiche le succès pour UX */ })
          .catch(function(){ /* silencieux */ })
          .finally(function(){
            form.reset();
            if (success){
              success.hidden = false;
              try{ success.scrollIntoView({ behavior:'smooth', block:'center' }); }catch(_){}
            }
          });
      } else {
        form.reset();
        if (success){
          success.hidden = false;
          try{ success.scrollIntoView({ behavior:'smooth', block:'center' }); }catch(_){}
        }
      }
    });
  });
})();

/* =========================
   Back to top (supporte #myBtn et #backToTop)
   ========================= */
(function(){
  var btn = document.getElementById('myBtn') || document.getElementById('backToTop');
  if (!btn) return;

  // si le HTML a [hidden], on le retire pour laisser le JS gérer l’affichage
  if (btn.hasAttribute('hidden')) btn.removeAttribute('hidden');
  btn.style.display = 'none';

  function toggle(){
    var scrolled = window.scrollY || window.pageYOffset || 0;
    btn.style.display = scrolled > 100 ? 'grid' : 'none';
  }

  window.addEventListener('scroll', toggle, { passive:true });
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', toggle);
  } else {
    toggle();
  }

  btn.addEventListener('click', function(e){
    e.preventDefault();
    var prefersReduced = false;
    try{ prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(_){}
    window.scrollTo({ top:0, left:0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
})();

/* =========================
   Devis modal — ouverture globale pour .open-devis
   ========================= */
(function(){
  var modal = document.getElementById('devisModal');
  if (!modal) return;

  var closer = modal.querySelector('[data-close-modal]');

  function openModal(){
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    var first = modal.querySelector('#fullname');
    if (first){ setTimeout(function(){ try{ first.focus(); }catch(_){ } }, 50); }
  }

  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
  }

  document.addEventListener('click', function(e){
    var t = e.target;
    var btn = (t && t.closest) ? t.closest('.open-devis') : null;
    if (btn){ e.preventDefault(); openModal(); }
  });

  if (closer) closer.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
})();
