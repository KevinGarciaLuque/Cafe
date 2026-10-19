/* AUREO COFFEE: carga siteContent.json y pinta la web. Ningun texto vive en el HTML o el CSS. */
(function () {
  'use strict';
  var A = window.AUREO = window.AUREO || {};
  var CONTENT_URL = 'src/content/siteContent.json';

  /* ---------- utilidades ---------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === false || v === null || v === undefined) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function safeHref(u) {
    u = String(u || '').trim();
    if (!u) return '#';
    if (/^(javascript|data|vbscript):/i.test(u)) return '#';
    return u;
  }
  function safeSrc(u) {
    u = String(u || '').trim();
    if (/^(javascript|vbscript):/i.test(u)) return '';
    if (/^data:/i.test(u) && !/^data:image\//i.test(u)) return '';
    return u;
  }
  function $(id) { return document.getElementById(id); }
  function rng(seed) { var s = seed >>> 0; return function () { return (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }; }

  /* titulares divididos en palabras, con umbrales fijos para que la animacion sea identica en cada carga */
  function splitWords(text, seed, spread) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    var rand = rng(seed || 7);
    var vis = el('span', { class: 'vis', 'aria-hidden': 'true' });
    words.forEach(function (w, i) {
      var th = (i / Math.max(1, words.length)) * (spread || 0.55) + rand() * 0.05;
      var s = el('span', { class: 'w', text: w });
      s.style.setProperty('--th', th.toFixed(3));
      vis.appendChild(s);
      if (i < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    return vis;
  }
  function headline(tag, text, entrance, seed) {
    var h = el(tag, { class: 'hl' });
    h.appendChild(el('span', { class: 'sr-only', text: text }));
    if (entrance === 'blur') {
      var soft = splitWords(text, seed, 0.2); soft.classList.add('soft');
      var sharp = splitWords(text, seed, 0.2); sharp.classList.add('sharp');
      h.appendChild(soft); h.appendChild(sharp);
    } else {
      h.appendChild(splitWords(text, seed, entrance === 'rise' ? 0.6 : 0.5));
    }
    return h;
  }
  function button(cls, label, href) {
    var a = el('a', { class: 'btn ' + cls, href: safeHref(href) });
    a.appendChild(el('span', { class: 'btn-label', text: label }));
    return a;
  }
  function secHead(id, c, extra) {
    var wrap = el('div', { class: 'sec-head reveal' });
    wrap.appendChild(el('p', { class: 'kicker', text: c.kicker }));
    wrap.appendChild(el('h2', { id: id, class: 'sec-title', text: c.title }));
    if (c.intro) wrap.appendChild(el('p', { class: 'lede', text: c.intro }));
    if (extra) wrap.appendChild(extra);
    return wrap;
  }
  function rule() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'rule'); s.setAttribute('viewBox', '0 0 240 12'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M0 6 H96 q12 0 12 -4 q0 4 12 4 q12 0 12 4 q0 -4 12 -4 H240');
    p.setAttribute('pathLength', '1');
    s.appendChild(p);
    return s;
  }
  function steam() {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('class', 'steam'); s.setAttribute('viewBox', '0 0 80 120'); s.setAttribute('aria-hidden', 'true');
    ['M20 118 C8 96 32 84 20 62 C10 44 28 34 20 14', 'M40 118 C28 94 52 80 40 56 C30 36 48 26 40 6', 'M60 118 C48 98 72 86 60 66 C50 50 68 40 60 22'].forEach(function (d) {
      var p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.appendChild(p);
    });
    return s;
  }

  /* ---------- tema y metadatos ---------- */
  var COLOR_VARS = { canvas: '--canvas', panel: '--panel', panel2: '--panel-2', accent: '--accent', accentHover: '--accent-hover', textPrimary: '--text-primary', textSecondary: '--text-secondary' };
  function applyTheme(C) {
    var colors = (C.theme && C.theme.colors) || {};
    Object.keys(COLOR_VARS).forEach(function (k) {
      if (colors[k] && /^#[0-9a-f]{3,8}$/i.test(colors[k])) document.documentElement.style.setProperty(COLOR_VARS[k], colors[k]);
    });
    var meta = C.meta || {};
    if (meta.title) document.title = meta.title;
    document.documentElement.lang = meta.lang || 'es';
    var d = document.querySelector('meta[name="description"]'); if (d && meta.description) d.setAttribute('content', meta.description);
    var t = document.querySelector('meta[name="theme-color"]'); if (t) t.setAttribute('content', meta.themeColor || (colors.canvas || '#17110E'));
    [['og:title', meta.title], ['og:description', meta.description]].forEach(function (p) {
      var m = document.querySelector('meta[property="' + p[0] + '"]'); if (m && p[1]) m.setAttribute('content', p[1]);
    });
  }

  /* ---------- cabecera y pie ---------- */
  function renderHeader(C) {
    $('brandName').textContent = C.brand.name;
    $('skipLink').textContent = C.nav.skip || 'Saltar al contenido';
    $('navToggleLabel').textContent = C.nav.menuOpen || 'Abrir menú';
    var nav = $('siteNav'); clear(nav);
    var ul = el('ul');
    (C.nav.links || []).forEach(function (l) { ul.appendChild(el('li', null, [el('a', { href: safeHref(l.href), text: l.label })])); });
    nav.appendChild(ul);
    if (C.nav.cta && C.nav.cta.label) nav.appendChild(button('btn-small btn-primary', C.nav.cta.label, C.nav.cta.href));
  }
  function renderFooter(C) {
    var f = C.footer || {}, n = $('siteFooter'); clear(n);
    var top = el('div', { class: 'foot-top' });
    top.appendChild(el('div', null, [el('p', { class: 'foot-brand', text: C.brand.name }), el('p', { class: 'foot-text', text: f.text || '' })]));
    var ul = el('ul', { class: 'foot-links' });
    (f.links || []).forEach(function (l) { ul.appendChild(el('li', null, [el('a', { href: safeHref(l.href), text: l.label })])); });
    top.appendChild(el('nav', { 'aria-label': 'Pie de página' }, [ul]));
    n.appendChild(top);
    n.appendChild(el('p', { class: 'foot-note', text: f.disclosure || '' }));
    n.appendChild(el('p', { class: 'foot-copy', text: f.copyright || '' }));
  }

  /* ---------- hero ---------- */
  function renderHero(C) {
    var H = C.hero;
    $('stage').setAttribute('data-ready', '0');
    $('inicio').setAttribute('aria-label', C.brand.name);
    $('heroStatic').setAttribute('aria-label', C.brand.name);
    $('loaderLabel').textContent = H.loadingLabel || '';
    $('cueLabel').textContent = H.scrollCue || '';
    $('stageProgress').setAttribute('aria-label', H.progressLabel || '');

    var list = $('stageList'); clear(list);
    (H.stages || []).forEach(function (s, i) {
      var li = el('li', null, [el('span', { class: 'tick', 'aria-hidden': 'true' }), el('span', { class: 'num', text: String(i + 1).padStart(2, '0') }), el('span', { class: 'lab', text: s })]);
      list.appendChild(li);
    });

    var bands = $('heroBands'); clear(bands);
    (H.bands || []).forEach(function (b, i) {
      var art = el('article', { class: 'band align-' + (b.align || 'left') + ' ent-' + (b.entrance || 'drift'), 'data-a': b.range[0], 'data-b': b.range[1], 'data-entrance': b.entrance || 'drift', 'data-ramp': b.ramp || false });
      if (b.scrim) art.style.setProperty('--sa', String(Math.min(1.4, Math.max(0.6, +b.scrim))));
      var copy = el('div', { class: 'copy' });
      copy.appendChild(headline('h2', b.title, b.entrance, 11 + i * 13));
      if (b.text) copy.appendChild(el('p', { class: 'sub', text: b.text }));
      art.appendChild(copy);
      bands.appendChild(art);
    });

    var fin = H.final || {}, fw = $('heroFinal'); clear(fw);
    var fa = el('article', { class: 'band final align-left ent-rise', 'data-a': (fin.range || [0.82, 1])[0], 'data-b': (fin.range || [0.82, 1])[1], 'data-ramp': '0.07' });
    var fc = el('div', { class: 'copy' });
    fc.appendChild(headline('h1', fin.title || C.brand.name, 'rise', 41));
    fc.appendChild(el('p', { class: 'sub', text: fin.subtitle || '' }));
    var row = el('div', { class: 'cta-row' });
    if (fin.primary) row.appendChild(button('btn-primary', fin.primary.label, fin.primary.href));
    if (fin.secondary) row.appendChild(button('btn-ghost', fin.secondary.label, fin.secondary.href));
    fc.appendChild(row);
    fa.appendChild(fc); fw.appendChild(fa);

    /* hero estatico: la imagen se asigna solo si el modo estatico esta activo (ver hero.js) */
    var st = $('heroStatic'); clear(st);
    st.appendChild(el('div', { class: 'hs-img', 'data-src': H.media.staticImage || '', role: 'img', 'aria-label': H.media.staticAlt || '' }));
    st.appendChild(el('div', { class: 'hs-scrim', 'aria-hidden': 'true' }));
    var sc = el('div', { class: 'copy' });
    sc.appendChild(el('h1', { class: 'hs-title', text: fin.title || C.brand.name }));
    sc.appendChild(el('p', { class: 'sub', text: fin.subtitle || '' }));
    var srow = el('div', { class: 'cta-row' });
    if (fin.primary) srow.appendChild(button('btn-primary', fin.primary.label, fin.primary.href));
    if (fin.secondary) srow.appendChild(button('btn-ghost', fin.secondary.label, fin.secondary.href));
    sc.appendChild(srow);
    st.appendChild(sc);
  }

  /* ---------- secciones ---------- */
  function renderStory(C) {
    var S = C.story, n = $('historia'); clear(n);
    var grid = el('div', { class: 'story-grid' });
    var left = el('div', { class: 'story-text' });
    left.appendChild(secHead('historia-t', S));
    (S.paragraphs || []).forEach(function (p) { left.appendChild(el('p', { class: 'body reveal', text: p })); });
    var fig = el('figure', { class: 'story-fig reveal' }, [
      el('img', { src: safeSrc(S.image), alt: S.imageAlt || '', loading: 'lazy', decoding: 'async', width: '1600', height: '900' })
    ]);
    grid.appendChild(left); grid.appendChild(fig);
    n.appendChild(grid);
    n.appendChild(rule());
    var vals = el('ul', { class: 'values' });
    (S.values || []).forEach(function (v, i) {
      vals.appendChild(el('li', { class: 'reveal', style: '--i:' + i }, [el('span', { class: 'v-num', text: String(i + 1).padStart(2, '0') }), el('h3', { text: v.title }), el('p', { text: v.text })]));
    });
    n.appendChild(vals);
  }

  function contactHref(C) {
    var wa = (C.contact.whatsapp || '').replace(/[^\d]/g, '');
    if (wa) return 'https://wa.me/' + wa;
    return '#contacto';
  }
  function renderCoffees(C) {
    var K = C.coffees, n = $('cafes'); clear(n);
    n.appendChild(secHead('cafes-t', K));
    var grid = el('ul', { class: 'cards' });
    (K.items || []).forEach(function (it, i) {
      var li = el('li', { class: 'card reveal', style: '--i:' + i });
      var img = el('div', { class: 'card-img' }, [el('img', { src: safeSrc(it.image), alt: it.imageAlt || '', loading: 'lazy', decoding: 'async', width: '1000', height: '1000' })]);
      var body = el('div', { class: 'card-body' }, [
        el('p', { class: 'tag', text: it.tag || '' }),
        el('h3', { class: 'card-name', text: it.name }),
        el('p', { class: 'notes', text: it.notes || '' }),
        el('p', { class: 'desc', text: it.description || '' }),
        el('div', { class: 'price-row' }, [el('span', { class: 'price', text: it.price || '' }), el('span', { class: 'unit', text: it.unit || '' })]),
        button('btn-ghost btn-small', K.cta || '', contactHref(C))
      ]);
      li.appendChild(img); li.appendChild(body); grid.appendChild(li);
    });
    n.appendChild(grid);
  }

  function renderProcess(C) {
    var P = C.process, n = $('proceso'); clear(n);
    n.appendChild(secHead('proceso-t', P));
    var steps = el('ol', { class: 'steps' });
    (P.steps || []).forEach(function (s, i) {
      var li = el('li', { class: 'step reveal' + (i % 2 ? ' flip' : '') });
      li.appendChild(el('div', { class: 'step-img' }, [el('img', { src: safeSrc(s.image), alt: s.alt || '', loading: 'lazy', decoding: 'async', width: '1600', height: '900' })]));
      li.appendChild(el('div', { class: 'step-text' }, [el('span', { class: 'step-num', text: s.number }), el('h3', { text: s.name }), el('p', { text: s.text })]));
      steps.appendChild(li);
    });
    n.appendChild(steps);

    var I = P.interaction || {};
    var box = el('div', { class: 'grind reveal', id: 'grind' });
    box.appendChild(el('h3', { class: 'grind-title', text: I.title || '' }));
    box.appendChild(el('p', { class: 'grind-hint', text: I.hint || '' }));
    var btn = el('button', { class: 'grind-btn', type: 'button', id: 'grindBtn', 'aria-describedby': 'grindStatus' });
    btn.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="g-bg" cx="60" cy="60" r="54" fill="none" stroke-width="2"/><circle class="g-fg" cx="60" cy="60" r="54" fill="none" stroke-width="4" pathLength="1"/></svg>';
    btn.appendChild(el('span', { class: 'grind-label', text: I.button || '' }));
    box.appendChild(btn);
    box.appendChild(el('p', { class: 'grind-status', id: 'grindStatus', 'aria-live': 'polite', 'data-done': I.done || '' }));
    var notes = el('ul', { class: 'notes-list', id: 'grindNotes' });
    (I.notes || []).forEach(function (t, i) { notes.appendChild(el('li', { style: '--n:' + i, text: t })); });
    box.appendChild(notes);
    n.appendChild(box);
  }

  function renderExperience(C) {
    var E = C.experience, n = $('experiencia'); clear(n);
    n.appendChild(secHead('experiencia-t', E));
    var g = el('div', { class: 'gallery' });
    (E.gallery || []).forEach(function (it, i) {
      g.appendChild(el('figure', { class: 'shot shot-' + (i + 1) + ' reveal' }, [
        el('img', { src: safeSrc(it.src), alt: it.alt || '', loading: 'lazy', decoding: 'async', width: '1600', height: '900' }),
        el('figcaption', { text: it.caption || '' })
      ]));
    });
    n.appendChild(g);
  }

  function renderMenu(C) {
    var M = C.menu, n = $('menu'); clear(n);
    n.appendChild(secHead('menu-t', M, steam()));
    var cols = el('div', { class: 'menu-cols' });
    (M.categories || []).forEach(function (cat, i) {
      var col = el('section', { class: 'menu-col reveal', style: '--i:' + i, 'aria-label': cat.name });
      col.appendChild(el('h3', { class: 'menu-cat', text: cat.name }));
      var ul = el('ul');
      (cat.items || []).forEach(function (it) {
        ul.appendChild(el('li', null, [
          el('div', { class: 'm-line' }, [el('span', { class: 'm-name', text: it.name }), el('span', { class: 'm-dots', 'aria-hidden': 'true' }), el('span', { class: 'm-price', text: it.price || '' })]),
          it.description ? el('p', { class: 'm-desc', text: it.description }) : null
        ]));
      });
      col.appendChild(ul); cols.appendChild(col);
    });
    n.appendChild(cols);
  }

  function renderContact(C) {
    var T = C.contact, F = T.form, n = $('contacto'); clear(n);
    var grid = el('div', { class: 'contact-grid' });
    var info = el('div', { class: 'contact-info' });
    info.appendChild(secHead('contacto-t', T));
    var dl = el('dl', { class: 'info-list reveal' });
    function row(label, valueNode) { dl.appendChild(el('dt', { text: label })); dl.appendChild(el('dd', null, [valueNode])); }
    var L = T.labels || {};
    if (T.address) row(L.address || '', document.createTextNode(T.address));
    if (T.hours) row(L.hours || '', document.createTextNode(T.hours));
    if (T.email) row(L.email || '', el('a', { href: 'mailto:' + T.email, text: T.email }));
    if ((T.socials || []).length) {
      var ul = el('ul', { class: 'socials' });
      T.socials.forEach(function (s) { ul.appendChild(el('li', null, [el('a', { href: safeHref(s.url), text: s.label, rel: 'noopener', target: '_blank' })])); });
      row(L.social || '', ul);
    }
    if (dl.children.length) info.appendChild(dl);
    var wa = (T.whatsapp || '').replace(/[^\d]/g, '');
    if (wa) {
      var msg = encodeURIComponent(T.whatsappMessage || '');
      info.appendChild(button('btn-ghost', T.whatsappLabel || 'WhatsApp', 'https://wa.me/' + wa + (msg ? '?text=' + msg : '')));
    }
    grid.appendChild(info);

    var form = el('form', { class: 'form reveal', id: 'contactForm', novalidate: true, 'aria-labelledby': 'contacto-t' });
    function field(id, label, type, ph, tag) {
      var wrap = el('div', { class: 'field' });
      wrap.appendChild(el('label', { for: id, text: label }));
      var input = tag === 'textarea' ? el('textarea', { id: id, name: id, rows: '5', placeholder: ph, required: true }) : el('input', { id: id, name: id, type: type, placeholder: ph, required: true, autocomplete: id === 'email' ? 'email' : (id === 'name' ? 'name' : 'off') });
      wrap.appendChild(input);
      wrap.appendChild(el('p', { class: 'err', id: id + 'Err', 'aria-live': 'polite' }));
      input.setAttribute('aria-describedby', id + 'Err');
      return wrap;
    }
    form.appendChild(field('name', F.name, 'text', F.namePlaceholder));
    form.appendChild(field('email', F.email, 'email', F.emailPlaceholder));
    form.appendChild(field('message', F.message, 'text', F.messagePlaceholder, 'textarea'));
    form.appendChild(el('div', { class: 'hp', 'aria-hidden': 'true' }, [el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off' })]));
    var submit = el('button', { class: 'btn btn-primary', type: 'submit', id: 'formSubmit' }, [el('span', { class: 'btn-label', text: F.submit })]);
    form.appendChild(submit);
    form.appendChild(el('p', { class: 'form-status', id: 'formStatus', role: 'status', 'aria-live': 'polite' }));
    grid.appendChild(form);
    n.appendChild(grid);
  }

  function renderFaq(C) {
    var Q = C.faq, n = $('faq'); clear(n);
    n.appendChild(secHead('faq-t', Q));
    var wrap = el('div', { class: 'faq-list' });
    (Q.items || []).forEach(function (it) {
      var d = el('details', { class: 'reveal' });
      d.appendChild(el('summary', null, [el('span', { text: it.q }), el('i', { 'aria-hidden': 'true' })]));
      d.appendChild(el('div', { class: 'faq-a' }, [el('p', { text: it.a })]));
      wrap.appendChild(d);
    });
    n.appendChild(wrap);
  }

  /* ---------- orquestacion ---------- */
  function renderAll(C) {
    A.content = C;
    applyTheme(C);
    renderHeader(C); renderHero(C); renderStory(C); renderCoffees(C); renderProcess(C);
    renderExperience(C); renderMenu(C); renderContact(C); renderFaq(C); renderFooter(C);
    document.documentElement.setAttribute('data-rendered', '1');
    if (A.onRendered) A.onRendered(C);
  }
  A.renderAll = renderAll;

  function failNotice(msg) {
    var p = el('p', { class: 'load-fail', role: 'alert', text: msg });
    document.getElementById('main').insertBefore(p, document.getElementById('main').firstChild);
  }

  function boot() {
    fetch(CONTENT_URL, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(renderAll)
      .catch(function () {
        /* al abrir index.html con doble clic el navegador bloquea fetch: se explica sin romper la pagina */
        failNotice('No se pudo cargar el contenido. Abre la web desde un servidor (por ejemplo: npx http-server site) o publícala en un hosting.');
      });
  }

  /* modo vista previa: el panel /admin envia el contenido por postMessage, sin guardar nada */
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'aureo-content') return;
    if (new URLSearchParams(location.search).get('preview') !== '1') return;
    try { renderAll(e.data.content); } catch (err) { /* contenido incompleto mientras se edita: se ignora */ }
  });

  A.el = el; A.$ = $;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
