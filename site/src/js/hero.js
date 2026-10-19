/* AUREO COFFEE: hero controlado por scroll (scrub). Estandar de scrub-pipeline.md.
   - video por Blob en streaming con anillo de carga y vigilancia de 20 s
   - tiempo mostrado suavizado con rAF normalizado por dt, que descansa al converger
   - seeks con puerta (nunca solapados) y escape ante error
   - escrituras al DOM solo cuando cambia el valor
   - 5 condiciones de hero estatico, iguales en CSS y JS, evaluadas en vivo */
(function () {
  'use strict';
  var A = window.AUREO = window.AUREO || {};

  /* Estas 5 cadenas deben ser identicas a las media queries de main.css */
  var GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  var MQLS = GATES.map(function (q) { return window.matchMedia(q); });
  var STAGE_STARTS = [0, 0.207, 0.415, 0.605, 0.79];   /* inicio de cada clip dentro del video unido */

  var cfg = null;
  var heroEl, stageEl, video, posterEl, loaderEl, ringEl, cueEl, staticEl, progEl;
  var bands = [], stageItems = [], finalWrap = null;
  var target = 0, shown = 0, rafId = null, lastTick = 0;
  var heroOnScreen = true, io = null;
  var scrubOn = false, started = false, wired = false;
  var seekBusy = false, pendingTime = null;
  var loadK = 0, rampRaf = null;
  var objectUrl = null, abortCtrl = null;
  var lastStage = -1, lastSp = -1;

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function smooth(p, e0, e1) { var t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function $(id) { return document.getElementById(id); }
  function gateActive() { return MQLS.some(function (m) { return m.matches; }); }

  function heroProgress() {
    var r = heroEl.getBoundingClientRect();
    var range = heroEl.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp(-r.top / range, 0, 1);
  }

  /* ---------- bandas de texto ---------- */
  function collect() {
    bands = [];
    var nodes = [].slice.call(document.querySelectorAll('#heroBands .band')).concat([].slice.call(document.querySelectorAll('#heroFinal .band')));
    nodes.forEach(function (n, i) {
      var a = parseFloat(n.getAttribute('data-a')), b = parseFloat(n.getAttribute('data-b'));
      var ramp = parseFloat(n.getAttribute('data-ramp')) || Math.min(0.025, (b - a) * 0.35);
      bands.push({ el: n, a: a, b: b, ramp: ramp, first: i === 0, last: n.classList.contains('final'), op: -1, k: -1, live: null });
    });
    finalWrap = $('heroFinal');
    stageItems = [].slice.call(document.querySelectorAll('#stageList li'));
    lastStage = -1; lastSp = -1;
  }

  function updateCaptions(p) {
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var f = Math.min(0.02, (b.b - b.a) / 3);
      var op = (b.first ? 1 : smooth(p, b.a, b.a + f)) * (b.last ? 1 : 1 - smooth(p, b.b - f, b.b));
      if (p < b.a && !b.first) op = 0;
      var k = clamp((p - b.a) / b.ramp, 0, 1);
      if (b.first) k = Math.max(k, loadK);
      if (Math.abs(op - b.op) > 0.004 || ((op === 0 || op === 1) && op !== b.op)) {
        b.el.style.opacity = op.toFixed(3); b.op = op;
        if (b.last) {
          var live = op > 0.5;
          if (live !== b.live) {
            b.live = live;
            b.el.classList.toggle('live', live);
            if (finalWrap) { if (live) finalWrap.removeAttribute('inert'); else finalWrap.setAttribute('inert', ''); }
            stageEl.classList.toggle('settled', live);   /* el cierre ocupa la escena: el indicador se retira */
          }
        }
      }
      if (Math.abs(k - b.k) > 0.008 || ((k === 0 || k === 1) && k !== b.k)) {
        b.el.style.setProperty('--k', k.toFixed(3)); b.k = k;
      }
    }
    /* indicador de etapa y progreso */
    var idx = 0;
    for (var s = 0; s < STAGE_STARTS.length; s++) if (p >= STAGE_STARTS[s]) idx = s;
    if (idx !== lastStage) {
      lastStage = idx;
      stageItems.forEach(function (li, n) {
        li.classList.toggle('is-active', n === idx);
        li.classList.toggle('is-done', n < idx);
        if (n === idx) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
    }
    if (Math.abs(p - lastSp) > 0.004) { lastSp = p; progEl.style.setProperty('--sp', p.toFixed(3)); }
    /* indicador de scroll: se retira apenas empieza el recorrido */
    var cueHide = p > 0.02;
    if (cueEl && cueEl._h !== cueHide) { cueEl._h = cueHide; cueEl.classList.toggle('gone', cueHide); }
  }

  /* ---------- tiempo mostrado: lerp que descansa ---------- */
  function requestSeek(t) {
    if (!video || !video.duration) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    video.currentTime = clamp(t, 0, video.duration - 0.001);
  }
  function tick(now) {
    var dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    var k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    requestSeek(shown * (video.duration || 0));
    updateCaptions(shown);
  }
  function onScroll() {
    target = heroProgress();
    if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
  }

  /* entrada de la primera banda: rampa por tiempo, luego manda el scroll */
  function startLoadRamp() {
    cancelAnimationFrame(rampRaf);
    loadK = 0;
    var t0 = performance.now();
    (function step(now) {
      var t = clamp((now - t0 - 350) / 1500, 0, 1);
      loadK = 1 - Math.pow(1 - t, 3);
      updateCaptions(shown);
      if (t < 1 && scrubOn) rampRaf = requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- carga del video: Blob en streaming ---------- */
  function setRing(frac) { ringEl.style.setProperty('--ld', Math.round(126 * (1 - frac))); }
  function failVideo() {
    stageEl.classList.add('video-failed');
    stageEl.classList.remove('video-ready');
    loaderEl.hidden = true;
  }
  function loadHeroBlob() {
    var url = cfg.media.video, bytes = cfg.media.videoBytes || 0;
    abortCtrl = new AbortController();
    var ctrl = abortCtrl;
    var watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
    return fetch(url, { priority: 'low', signal: ctrl.signal }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('video HTTP ' + res.status);
      var total = Number(res.headers.get('Content-Length')) || bytes || 1;
      var reader = res.body.getReader(), chunks = [], got = 0, lastRing = 0;
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          clearTimeout(watchdog); watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
          chunks.push(r.value); got += r.value.length;
          var frac = Math.min(1, got / total), now = performance.now();
          if (now - lastRing > 100 || frac === 1) { lastRing = now; setRing(frac); }
          return pump();
        });
      }
      return pump().then(function () {
        clearTimeout(watchdog); setRing(1);
        objectUrl = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.src = objectUrl;
        video.load();
        video.addEventListener('canplay', function () {
          loaderEl.hidden = true;
          stageEl.classList.add('video-ready');
          requestSeek(heroProgress() * video.duration);
        }, { once: true });
      });
    }).catch(function (err) { clearTimeout(watchdog); throw err; });
  }
  function initHeroOnce() {
    if (started) return;
    started = true;
    loaderEl.hidden = false;
    posterEl.style.backgroundImage = "url('" + cfg.media.poster + "')";
    var go = (function () { var d = false; return function () { if (d) return; d = true; loadHeroBlob().catch(failVideo); }; })();
    var img = new Image();
    img.onload = go; img.onerror = go;
    img.src = cfg.media.poster;
    setTimeout(go, 4000);
  }

  /* ---------- activar y desactivar el scrub ---------- */
  function resetCaches() { bands.forEach(function (b) { b.op = -1; b.k = -1; b.live = null; }); lastStage = -1; lastSp = -1; }
  function enableScrub() {
    if (scrubOn) { resetCaches(); target = shown = heroProgress(); updateCaptions(shown); return; }
    scrubOn = true;
    initHeroOnce();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    resetCaches();
    target = shown = heroProgress();
    updateCaptions(shown);
    startLoadRamp();
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    cancelAnimationFrame(rampRaf);
  }
  function ensureStaticImage() {
    var hs = staticEl && staticEl.querySelector('.hs-img');
    if (hs && !hs.style.backgroundImage && hs.getAttribute('data-src')) hs.style.backgroundImage = "url('" + hs.getAttribute('data-src') + "')";
  }
  function applyHeroMode() {
    if (gateActive()) { disableScrub(); ensureStaticImage(); }
    else enableScrub();
  }

  function cleanup() {
    cancelAnimationFrame(rafId); cancelAnimationFrame(rampRaf);
    if (abortCtrl) abortCtrl.abort();
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    if (io) io.disconnect();
  }

  /* ---------- montaje ---------- */
  function setup(C) {
    cfg = C.hero;
    heroEl = $('inicio'); stageEl = $('stage'); video = $('heroVideo'); posterEl = $('poster');
    loaderEl = $('heroLoader'); ringEl = loaderEl.querySelector('.ring'); cueEl = $('scrollCue');
    staticEl = $('heroStatic'); progEl = $('stageProgress');
    collect();
    if (!wired) {
      wired = true;
      video.addEventListener('seeked', function () {
        seekBusy = false;
        if (pendingTime !== null) { var t = pendingTime; pendingTime = null; requestSeek(t); }
      });
      video.addEventListener('error', function () { seekBusy = false; pendingTime = null; if (!video.currentSrc) return; failVideo(); });
      io = new IntersectionObserver(function (en) {
        heroOnScreen = en[0].isIntersecting;
        if (heroOnScreen && scrubOn) onScroll();
      }, { threshold: 0 });
      io.observe(heroEl);
      MQLS.forEach(function (m) { m.addEventListener('change', applyHeroMode); });
      window.addEventListener('pagehide', cleanup);
      document.addEventListener('visibilitychange', function () { document.body.classList.toggle('paused', document.hidden); });
    }
    if (scrubOn) { resetCaches(); updateCaptions(shown); } else applyHeroMode();
  }

  A.hero = { setup: setup, applyMode: applyHeroMode, isScrub: function () { return scrubOn; }, progress: function () { return heroProgress(); }, gates: GATES };
})();
