/* AUREO COFFEE: comportamiento de la pagina (revelados, menu, interaccion, formulario, hebra dorada). */
(function () {
  'use strict';
  var A = window.AUREO = window.AUREO || {};
  var $ = function (id) { return document.getElementById(id); };
  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealIO = null, wired = false;
  var grindApi = null;

  /* ---------- revelados con escalon, que se retira al terminar ---------- */
  function observeReveals() {
    var items = [].slice.call(document.querySelectorAll('.reveal:not(.in), .rule:not(.in)'));
    if (reducedMQ.matches) { items.forEach(function (n) { n.classList.add('in', 'done'); }); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var n = e.target;
          n.classList.add('in');
          revealIO.unobserve(n);
          /* retiro de los retrasos del escalon: si no, cada hover posterior llega tarde */
          var delay = parseFloat(getComputedStyle(n).transitionDelay) || 0;
          setTimeout(function () { n.classList.add('done'); }, 1100 + delay * 1000);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    items.forEach(function (n) { revealIO.observe(n); });
  }

  /* ---------- cabecera, menu movil y hebra ---------- */
  function initChrome() {
    var header = $('siteHeader'), toggle = $('navToggle'), nav = $('siteNav');
    function setMenu(open) {
      header.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      var C = A.content || {}, n = C.nav || {};
      $('navToggleLabel').textContent = open ? (n.menuClose || 'Cerrar menú') : (n.menuOpen || 'Abrir menú');
    }
    if (!wired) {
      toggle.addEventListener('click', function () { setMenu(!header.classList.contains('open')); });
      nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('open')) { setMenu(false); toggle.focus(); } });
      var ticking = false, lastTp = -1, lastSolid = null;
      function frame() {
        ticking = false;
        var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
        var tp = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        if (Math.abs(tp - lastTp) > 0.002) { lastTp = tp; document.documentElement.style.setProperty('--tp', tp.toFixed(4)); }
        /* sobre el hero la cabecera es transparente; se vuelve solida al terminar el recorrido */
        var hero = $('inicio');
        var solid = (A.hero && A.hero.isScrub() && hero) ? y > hero.offsetHeight - window.innerHeight + 60 : y > 40;
        if (solid !== lastSolid) { lastSolid = solid; header.classList.toggle('scrolled', solid); }
      }
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
      window.addEventListener('resize', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
      frame();
    }
  }

  /* ---------- interaccion unica: mantener para moler ---------- */
  function initGrind() {
    var btn = $('grindBtn'), box = $('grind'), status = $('grindStatus');
    if (!btn) { grindApi = null; return; }
    var p = 0, holding = false, done = false, pinned = false, raf = null, last = 0, shownP = -1;
    function setP(v) { if (Math.abs(v - shownP) > 0.004 || v === 0 || v === 1) { shownP = v; btn.style.setProperty('--gp', v.toFixed(3)); } }
    function finish() { done = true; box.classList.add('is-done'); box.classList.remove('is-holding'); status.textContent = status.getAttribute('data-done') || ''; }
    function step(now) {
      var dt = Math.min(60, now - (last || now)); last = now;
      if (holding) p = Math.min(1, p + dt / 2600); else p = Math.max(0, p - dt / 1800);   /* al soltar vuelve suave, nunca salta a cero */
      setP(p);
      if (p >= 1) { finish(); raf = null; last = 0; return; }
      if (p > 0 || holding) raf = requestAnimationFrame(step); else { raf = null; last = 0; }
    }
    function start() { if (done) return; holding = true; box.classList.add('is-holding'); if (raf === null) raf = requestAnimationFrame(step); }
    function stop() { holding = false; box.classList.remove('is-holding'); if (raf === null && p > 0 && !done) raf = requestAnimationFrame(step); }
    btn.addEventListener('pointerdown', function (e) { if (e.button > 0) return; try { btn.setPointerCapture(e.pointerId); } catch (_) {} start(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { btn.addEventListener(t, stop); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
    btn.addEventListener('blur', stop);
    grindApi = {
      pin: function () { if (done) return; pinned = true; p = 1; setP(1); finish(); },
      unpin: function () { if (!pinned) return; pinned = false; done = false; p = 0; setP(0); box.classList.remove('is-done'); status.textContent = ''; }
    };
    if (reducedMQ.matches) grindApi.pin();
  }

  /* ---------- formulario: el destino real se declara en el contenido ---------- */
  function initForm() {
    var form = $('contactForm'); if (!form) return;
    var C = A.content.contact, F = C.form, status = $('formStatus'), btn = $('formSubmit');
    function setErr(id, msg) {
      var input = $(id), err = $(id + 'Err');
      err.textContent = msg || '';
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    function validate() {
      var ok = true, v = { name: form.name.value.trim(), email: form.email.value.trim(), message: form.message.value.trim() };
      setErr('name', v.name ? '' : F.required); if (!v.name) ok = false;
      var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
      setErr('email', v.email ? (okMail ? '' : F.invalidEmail) : F.required); if (!okMail) ok = false;
      setErr('message', v.message ? '' : F.required); if (!v.message) ok = false;
      if (!ok) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); }
      return ok ? v : null;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = ''; status.className = 'form-status';
      var v = validate(); if (!v) return;
      if (form.website && form.website.value) { status.textContent = F.success; status.classList.add('ok'); form.reset(); return; }   /* trampa para bots */
      btn.disabled = true; status.textContent = F.sending;
      function ok(msg) { status.textContent = msg; status.classList.add('ok'); form.reset(); btn.disabled = false; }
      function fail() { status.textContent = F.error; status.classList.add('bad'); btn.disabled = false; }
      if (C.formEndpoint) {
        fetch(C.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); ok(F.success); }).catch(fail);
      } else if (C.email) {
        var body = encodeURIComponent(v.message + '\n\n' + v.name + ' (' + v.email + ')');
        window.location.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(A.content.brand.name) + '&body=' + body;
        ok(F.successMailto);
      } else {
        ok(F.successDemo);   /* sin destino configurado: se dice la verdad, no se finge un envio */
      }
    });
  }

  /* ---------- movimiento reducido: en ambos sentidos ---------- */
  function pinToFinalStates() {
    [].slice.call(document.querySelectorAll('.reveal, .rule')).forEach(function (n) { n.classList.add('in', 'done'); });
    if (grindApi) grindApi.pin();
  }
  function unpinFinalStates() { if (grindApi) grindApi.unpin(); }

  A.onRendered = function (C) {
    A.hero.setup(C);
    initChrome();
    observeReveals();
    initGrind();
    initForm();
    if (!wired) {
      wired = true;
      reducedMQ.addEventListener('change', function (e) {
        if (e.matches) pinToFinalStates();
        else { unpinFinalStates(); A.hero.applyMode(); }   /* el movimiento vuelve: se rearma el scrub */
      });
    }
  };
})();
