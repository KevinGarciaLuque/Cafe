/* AUREO COFFEE: panel de contenido, Modalidad A (demostracion estatica).
   Edita siteContent.json en el navegador, muestra una vista previa en vivo y permite exportar e importar.
   NO publica nada: los cambios viven en este navegador hasta que se exporta el JSON y se reemplaza el archivo del sitio. */
(function () {
  'use strict';
  var SRC = '../src/content/siteContent.json';
  var DRAFT_KEY = 'aureo-admin-draft-v1';
  var original = null, content = null, dirty = false, previewTimer = null;
  var mode = 'local', csrf = '', sha = '', canPublish = false;   /* local: exportar JSON. server: iniciar sesion y publicar */

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k]; if (v === false || v === null || v === undefined) return;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function getIn(o, p) { return p.reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setIn(o, p, v) { var t = getIn(o, p.slice(0, -1)); t[p[p.length - 1]] = v; }

  /* ---------- etiquetas y reglas ---------- */
  var LABELS = {
    meta: 'Datos de la página', title: 'Título', description: 'Descripción', themeColor: 'Color del navegador',
    brand: 'Marca', name: 'Nombre', short: 'Nombre corto', tagline: 'Eslogan',
    theme: 'Colores', colors: 'Colores principales', canvas: 'Fondo de la página', panel: 'Superficies y tarjetas', panel2: 'Superficies secundarias',
    accent: 'Acento (botones)', accentHover: 'Acento al pasar el ratón', textPrimary: 'Texto principal', textSecondary: 'Texto secundario',
    nav: 'Navegación', links: 'Enlaces', label: 'Texto', href: 'Enlace', cta: 'Botón de la cabecera', menuOpen: 'Texto "abrir menú"', menuClose: 'Texto "cerrar menú"', skip: 'Texto "saltar al contenido"',
    hero: 'Hero', loadingLabel: 'Texto mientras carga', scrollCue: 'Indicación de scroll', progressLabel: 'Etiqueta del indicador de etapas', stages: 'Etapas',
    media: 'Imágenes del hero', poster: 'Imagen de arranque (póster)', staticImage: 'Imagen para móvil y movimiento reducido', staticAlt: 'Descripción de la imagen',
    bands: 'Textos durante el recorrido', entrance: 'Entrada del texto', align: 'Posición', text: 'Texto secundario',
    final: 'Cierre del hero', subtitle: 'Subtítulo', primary: 'Botón principal', secondary: 'Botón secundario',
    story: 'Nuestra historia', kicker: 'Etiqueta superior', paragraphs: 'Párrafos', image: 'Imagen', imageAlt: 'Descripción de la imagen', alt: 'Descripción de la imagen', values: 'Valores',
    coffees: 'Nuestros cafés', intro: 'Introducción', items: 'Elementos', tag: 'Etiqueta', notes: 'Notas de cata', price: 'Precio', unit: 'Presentación',
    process: 'Nuestro proceso', steps: 'Pasos', number: 'Número', interaction: 'Interacción "mantén para moler"', hint: 'Indicación', button: 'Texto del botón', done: 'Mensaje al terminar',
    experience: 'Experiencia', gallery: 'Galería', src: 'Imagen', caption: 'Pie de foto',
    menu: 'Menú', categories: 'Categorías',
    contact: 'Contacto', email: 'Correo', whatsapp: 'WhatsApp', whatsappLabel: 'Texto del botón de WhatsApp', whatsappMessage: 'Mensaje inicial de WhatsApp', address: 'Dirección', hours: 'Horario',
    socials: 'Redes sociales', url: 'Enlace', formEndpoint: 'Servicio de formulario (opcional)', form: 'Textos del formulario',
    namePlaceholder: 'Ejemplo del nombre', emailPlaceholder: 'Ejemplo del correo', messagePlaceholder: 'Ejemplo del mensaje', submit: 'Botón enviar', sending: 'Mientras envía',
    success: 'Mensaje de éxito', successDemo: 'Mensaje de éxito (demostración)', successMailto: 'Mensaje de éxito (correo)', error: 'Mensaje de error', required: 'Campo obligatorio', invalidEmail: 'Correo no válido', social: 'Redes',
    faq: 'Preguntas frecuentes', q: 'Pregunta', a: 'Respuesta',
    footer: 'Pie de página', disclosure: 'Aviso de marca ficticia e imágenes IA', copyright: 'Derechos'
  };
  var PATH_LABELS = { 'coffees.cta': 'Texto del botón de cada café', 'nav.cta.label': 'Texto del botón', 'process.interaction.title': 'Título de la interacción', 'contact.labels.social': 'Título de redes' };
  var HIDDEN = { range: 1, videoBytes: 1, video: 1, ramp: 1, id: 1, lang: 1, scrim: 1 };
  var FIXED = { 'hero.bands': 1, 'hero.stages': 1, 'process.steps': 1, 'experience.gallery': 1 };   /* su cantidad la fija el video o el mosaico */
  var IMG_KEYS = { image: 1, src: 1, poster: 1, staticImage: 1 };
  var SELECTS = {
    entrance: [['drift', 'Cae desde arriba'], ['rise', 'Sube'], ['depth', 'Se acerca'], ['blur', 'Se enfoca']],
    align: [['left', 'Izquierda'], ['right', 'Derecha']]
  };
  var LONG = { description: 1, text: 1, a: 1, intro: 1, paragraphs: 1, disclosure: 1, hint: 1, notes: 1, whatsappMessage: 1, messagePlaceholder: 1, subtitle: 1, tagline: 0 };
  var HINTS = {
    'contact.whatsapp': 'Número con código de país, sin + ni espacios. Ejemplo: 521234567890. Si está vacío, el botón no aparece.',
    'contact.email': 'Si hay correo y no hay servicio de formulario, el formulario abre el correo del visitante.',
    'contact.formEndpoint': 'Dirección de un servicio de formularios (por ejemplo Formspree). Si este campo y el correo están vacíos, el formulario es solo una demostración y no envía nada.',
    'contact.address': 'Si está vacío, no se muestra.',
    'contact.hours': 'Si está vacío, no se muestra.',
    'meta.themeColor': 'Color de la barra del navegador en el teléfono.'
  };
  var TABS = [
    { id: 'general', label: 'General', keys: ['meta', 'brand', 'nav'], intro: 'Nombre de la marca, descripción para buscadores y menú.' },
    { id: 'colores', label: 'Colores', keys: ['theme'], intro: 'Los colores principales de toda la web. Cambian en la vista previa al instante.' },
    { id: 'hero', label: 'Hero', keys: ['hero'], intro: 'Los textos que aparecen durante el recorrido del café y el cierre con los botones. Los tiempos del video no se editan aquí.' },
    { id: 'historia', label: 'Historia', keys: ['story'] },
    { id: 'cafes', label: 'Cafés', keys: ['coffees'], intro: 'Productos y precios. Los datos actuales son de ejemplo.' },
    { id: 'proceso', label: 'Proceso', keys: ['process'] },
    { id: 'experiencia', label: 'Galería', keys: ['experience'] },
    { id: 'menu', label: 'Menú', keys: ['menu'], intro: 'Categorías, bebidas y precios. Los datos actuales son de ejemplo.' },
    { id: 'contacto', label: 'Contacto', keys: ['contact'], intro: 'WhatsApp, dirección, horario y redes. Lo que quede vacío no se muestra.' },
    { id: 'faq', label: 'Preguntas', keys: ['faq'] },
    { id: 'pie', label: 'Pie', keys: ['footer'] }
  ];
  function labelFor(k) { return LABELS[k] || k; }
  function norm(path) { return path.map(function (s) { return /^\d+$/.test(s) ? '*' : s; }).join('.'); }
  function itemTitle(it, i, key) {
    var t = it && (it.name || it.title || it.label || it.q || it.caption || it.number);
    return (t ? String(t) : labelFor(key) + ' ' + (i + 1));
  }

  /* ---------- estado, borrador y vista previa ---------- */
  function setStatus(msg, isDirty) { var s = $('status'); s.textContent = msg; s.classList.remove('ok'); s.classList.toggle('dirty', !!isDirty); }
  function embeddedImages() { return (JSON.stringify(content).match(/"data:image\//g) || []).length; }
  function markDirty() {
    dirty = true;
    var n = embeddedImages();
    setStatus('Cambios sin guardar. Solo existen en este navegador.' + (n ? ' Incluye ' + n + ' imagen(es) incrustada(s).' : ''), true);
    $('siteName').textContent = (content.brand && content.brand.name) || '';
    clearTimeout(previewTimer);
    previewTimer = setTimeout(sendPreview, 140);
  }
  function sendPreview() {
    var f = $('frame');
    if (!f.contentWindow) return;
    f.contentWindow.postMessage({ type: 'aureo-content', content: content }, location.origin === 'null' ? '*' : location.origin);
  }
  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(content)); dirty = false; setStatus('Borrador guardado en este navegador. No está publicado.', false); }
    catch (e) { setStatus('No se pudo guardar el borrador (almacenamiento lleno o bloqueado). Exporta el JSON para no perder los cambios.', true); }
  }

  /* ---------- campos ---------- */
  function onChange(path, value) { setIn(content, path, value); markDirty(); }

  function fieldInput(path, key, value) {
    var id = 'f-' + path.join('-');
    var p = norm(path), wrap = el('div', { class: 'field' }), label = el('label', { for: id, text: PATH_LABELS[p] || labelFor(key) });
    wrap.appendChild(label);

    if (typeof value === 'number') {
      var n = el('input', { type: 'number', id: id, value: String(value), step: 'any' });
      n.addEventListener('input', function () { onChange(path, n.value === '' ? 0 : Number(n.value)); });
      wrap.appendChild(n);
    } else if (path[0] === 'theme' && path[1] === 'colors') {
      var row = el('div', { class: 'color-row' });
      var pick = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000', 'aria-label': labelFor(key) + ' (selector)' });
      var txt = el('input', { type: 'text', id: id, value: value, maxlength: '9', spellcheck: 'false' });
      pick.addEventListener('input', function () { txt.value = pick.value; wrap.classList.remove('bad'); onChange(path, pick.value); });
      txt.addEventListener('input', function () {
        var ok = /^#[0-9a-f]{6}$/i.test(txt.value.trim());
        wrap.classList.toggle('bad', !ok);
        if (ok) { pick.value = txt.value.trim(); onChange(path, txt.value.trim()); }
      });
      row.appendChild(pick); row.appendChild(txt); wrap.appendChild(row);
      wrap.appendChild(el('p', { class: 'hint', text: 'Formato #RRGGBB.' }));
    } else if (SELECTS[key]) {
      var sel = el('select', { id: id });
      SELECTS[key].forEach(function (o) { var op = el('option', { value: o[0], text: o[1] }); if (o[0] === value) op.selected = true; sel.appendChild(op); });
      sel.addEventListener('change', function () { onChange(path, sel.value); });
      wrap.appendChild(sel);
    } else if (IMG_KEYS[key]) {
      var col = el('div', { class: 'img-col' });
      var thumb = el('div', { class: 'thumb', role: 'img', 'aria-label': 'Miniatura' });
      var setThumb = function (v) { thumb.style.backgroundImage = v ? "url('" + (/^(data:|https?:|\/)/.test(v) ? v : '../' + v).replace(/'/g, '%27') + "')" : ''; };
      var t = el('input', { type: 'text', id: id, value: /^data:/.test(value) ? '(imagen incrustada)' : value, spellcheck: 'false' });
      if (/^data:/.test(value)) t.readOnly = true;
      var file = el('input', { type: 'file', accept: 'image/*', hidden: true });
      var pickBtn = el('button', { type: 'button', class: 'btn btn-small', text: 'Reemplazar imagen' });
      pickBtn.addEventListener('click', function () { file.click(); });
      t.addEventListener('input', function () { onChange(path, t.value.trim()); setThumb(t.value.trim()); });
      file.addEventListener('change', function () {
        var f = file.files[0];
        if (!f) return;
        shrinkImage(f, function (dataUrl) {
          if (mode === 'server' && canPublish) {
            /* modo servidor: la imagen se sube a GitHub y en el contenido queda solo su ruta */
            setStatus('Subiendo imagen…', true); setThumb(dataUrl);
            api('POST', 'image', { name: f.name, dataUrl: dataUrl }).then(function (r) { t.value = r.path; t.readOnly = false; onChange(path, r.path); setStatus('Imagen subida. Se publicará con el contenido.', true); })
              .catch(function (e) { setStatus('No se subió la imagen: ' + e.message, true); });
          } else { t.value = '(imagen incrustada)'; t.readOnly = true; onChange(path, dataUrl); setThumb(dataUrl); }
        });
      });
      setThumb(value);
      col.appendChild(t); col.appendChild(pickBtn); col.appendChild(file);
      wrap.appendChild(el('div', { class: 'img-row' }, [thumb, col]));
      wrap.appendChild(el('p', { class: 'hint', text: 'Para publicar, lo más limpio es copiar el archivo a assets/img y escribir aquí su ruta. Una imagen incrustada hace el JSON mucho más pesado.' }));
    } else {
      var s = String(value == null ? '' : value);
      var multi = LONG[key] || s.length > 80;
      var inp = multi ? el('textarea', { id: id, rows: '3' }) : el('input', { type: 'text', id: id });
      inp.value = s;
      inp.addEventListener('input', function () { onChange(path, inp.value); });
      wrap.appendChild(inp);
    }
    if (HINTS[p]) wrap.appendChild(el('p', { class: 'hint', text: HINTS[p] }));
    return wrap;
  }

  /* reduce la imagen a 1600 px y JPEG para que el JSON no explote */
  function shrinkImage(file, done) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        done(c.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = function () { setStatus('No se pudo leer esa imagen.', true); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function emptyLike(v) {
    if (Array.isArray(v)) return [];
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = emptyLike(v[k]); }); return o; }
    return typeof v === 'number' ? v : '';
  }

  function renderValue(parent, path, key, value, rebuild) {
    if (HIDDEN[key]) return;
    if (Array.isArray(value)) return parent.appendChild(renderArray(path, key, value, rebuild));
    if (value && typeof value === 'object') {
      var fs = el('fieldset', null, [el('legend', { text: labelFor(key) })]);
      Object.keys(value).forEach(function (k) { renderValue(fs, path.concat(k), k, value[k], rebuild); });
      return parent.appendChild(fs);
    }
    parent.appendChild(fieldInput(path, key, value));
  }

  function renderArray(path, key, arr, rebuild) {
    var fixed = !!FIXED[norm(path)];
    var box = el('fieldset', null, [el('legend', { text: labelFor(key) })]);
    var isObj = arr.length && typeof arr[0] === 'object';
    var template = arr.length ? emptyLike(arr[arr.length - 1]) : '';

    arr.forEach(function (it, i) {
      if (isObj) {
        var d = el('details', { class: 'item' });
        var tools = el('span', { class: 'it-tools' });
        var title = el('span', { class: 'it-title', text: itemTitle(it, i, key) });
        if (!fixed) {
          var up = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Subir', text: '↑' });
          var dn = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Bajar', text: '↓' });
          var rm = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Eliminar', text: '✕' });
          up.disabled = i === 0; dn.disabled = i === arr.length - 1;
          [up, dn, rm].forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }); tools.appendChild(b); });
          up.addEventListener('click', function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); markDirty(); rebuild(); });
          dn.addEventListener('click', function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); markDirty(); rebuild(); });
          rm.addEventListener('click', function () { if (window.confirm('¿Eliminar "' + itemTitle(it, i, key) + '"?')) { arr.splice(i, 1); markDirty(); rebuild(); } });
        }
        d.appendChild(el('summary', null, [title, tools]));
        var body = el('div', { class: 'it-body' });
        Object.keys(it).forEach(function (k) { renderValue(body, path.concat(String(i), k), k, it[k], rebuild); });
        d.appendChild(body);
        d.addEventListener('input', function () { title.textContent = itemTitle(getIn(content, path)[i], i, key); });
        box.appendChild(d);
      } else {
        var row = el('div', { class: 'strlist' });
        var r = el('div', { class: 'row' });
        var multi = LONG[key] || String(it).length > 80;
        var inp = multi ? el('textarea', { rows: '3', 'aria-label': labelFor(key) + ' ' + (i + 1) }) : el('input', { type: 'text', 'aria-label': labelFor(key) + ' ' + (i + 1) });
        inp.value = it;
        inp.addEventListener('input', function () { arr[i] = inp.value; markDirty(); });
        r.appendChild(inp);
        if (!fixed) {
          var rm2 = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Eliminar', text: '✕' });
          rm2.addEventListener('click', function () { arr.splice(i, 1); markDirty(); rebuild(); });
          r.appendChild(rm2);
        }
        row.appendChild(r); box.appendChild(row);
      }
    });
    if (!fixed) {
      var add = el('button', { type: 'button', class: 'btn btn-small', text: 'Añadir' });
      add.addEventListener('click', function () { arr.push(typeof template === 'object' ? clone(template) : ''); markDirty(); rebuild(); });
      box.appendChild(el('div', { class: 'add-row' }, [add]));
    } else {
      box.appendChild(el('p', { class: 'hint', text: 'La cantidad de elementos está fijada por el diseño del recorrido.' }));
    }
    return box;
  }

  /* ---------- pestanas ---------- */
  function buildPanels(activeId) {
    var tabs = $('tabs'), panels = $('panels');
    tabs.textContent = ''; panels.textContent = '';
    TABS.forEach(function (t, idx) {
      var on = t.id === activeId;
      var b = el('button', { type: 'button', class: 'tab', role: 'tab', id: 'tab-' + t.id, 'aria-selected': on ? 'true' : 'false', 'aria-controls': 'panel-' + t.id, tabindex: on ? '0' : '-1', text: t.label });
      b.addEventListener('click', function () { buildPanels(t.id); $('tab-' + t.id).focus(); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0);
        if (!d) return; e.preventDefault();
        var nt = TABS[(idx + d + TABS.length) % TABS.length]; buildPanels(nt.id); $('tab-' + nt.id).focus();
      });
      tabs.appendChild(b);
      var p = el('section', { class: 'panel', role: 'tabpanel', id: 'panel-' + t.id, 'aria-labelledby': 'tab-' + t.id });
      if (!on) p.hidden = true;
      else {
        p.appendChild(el('h2', { text: t.label }));
        if (t.intro) p.appendChild(el('p', { class: 'intro', text: t.intro }));
        var rebuild = function () { var top = panels.scrollTop; buildPanels(activeId); $('panels').scrollTop = top; };
        t.keys.forEach(function (k) { if (content[k] !== undefined) renderValue(p, [k], k, content[k], rebuild); });
      }
      panels.appendChild(p);
    });
  }

  /* ---------- carga, importar, exportar ---------- */
  function valid(o) {
    return o && typeof o === 'object' && o.brand && typeof o.brand.name === 'string' && o.hero && Array.isArray(o.hero.bands) && o.theme && o.theme.colors && o.coffees && Array.isArray(o.coffees.items);
  }
  function load(obj, msg, isDirty) {
    content = obj; buildPanels((document.querySelector('.tab[aria-selected="true"]') || { id: 'tab-general' }).id.replace('tab-', ''));
    $('siteName').textContent = content.brand.name; setStatus(msg, isDirty); dirty = !!isDirty; sendPreview();
  }
  function initLocal() {
    fetch(SRC, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      original = j;
      var draft = null;
      try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { draft = null; }
      if (valid(draft)) load(draft, 'Borrador recuperado de este navegador. No está publicado.', true);
      else load(clone(j), 'Contenido original cargado. Sin cambios.', false);
    }).catch(function () {
      setStatus('No se pudo cargar siteContent.json. Abre el panel desde un servidor (por ejemplo: node tools/serve.mjs).', true);
    });
  }

  $('btnDraft').addEventListener('click', saveDraft);
  $('btnExport').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(content, null, 2) + '\n'], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'siteContent.json' });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    setStatus('Archivo exportado. Para publicar, reemplaza src/content/siteContent.json en el sitio.', false);
  });
  $('btnImport').addEventListener('click', function () { $('fileImport').click(); });
  $('fileImport').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try { var j = JSON.parse(r.result); if (!valid(j)) throw new Error('estructura'); load(j, 'JSON importado. Revísalo y guarda el borrador o expórtalo.', true); }
      catch (e) { setStatus('Ese archivo no es un siteContent.json válido. No se cambió nada.', true); }
    };
    r.readAsText(f); this.value = '';
  });
  $('btnReset').addEventListener('click', function () {
    if (!original || !window.confirm('Se descartarán los cambios y el borrador de este navegador. ¿Continuar?')) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    load(clone(original), 'Contenido original restablecido. Sin cambios.', false);
  });
  $('btnReload').addEventListener('click', function () { $('frame').src = $('frame').src; });
  $('frame').addEventListener('load', function () { if (content) sendPreview(); });
  [].forEach.call(document.querySelectorAll('.pv'), function (b) {
    b.addEventListener('click', function () {
      [].forEach.call(document.querySelectorAll('.pv'), function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); $('frame').style.width = b.getAttribute('data-w');
    });
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- modo servidor: sesion y publicacion ---------- */
  function api(method, path, body) {
    var opt = { method: method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    if (csrf) opt.headers['X-CSRF-Token'] = csrf;
    return fetch('/api/admin/' + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401 && path !== 'login') showLogin('Tu sesión terminó. Entra de nuevo.');
        if (!r.ok) { var e = new Error(j.error || ('Error ' + r.status)); e.status = r.status; e.details = j.details; throw e; }
        return j;
      });
    });
  }
  function showLogin(msg) {
    $('login').hidden = false; $('loginErr').textContent = msg || '';
    setTimeout(function () { ($('userField').hidden ? $('loginPass') : $('loginUser')).focus(); }, 30);
  }
  function setNotice(strong, rest) {
    var n = $('notice'); n.textContent = '';
    var b = document.createElement('strong'); b.textContent = strong + ' '; n.appendChild(b); n.appendChild(document.createTextNode(rest));
  }
  function enterServerMode(st) {
    mode = 'server'; canPublish = !!st.publish; csrf = st.csrf || csrf;
    $('btnPublish').hidden = !canPublish; $('btnLogout').hidden = false; $('btnDraft').hidden = true;
    if (canPublish) setNotice('Modo administración.', 'Publicar guarda un commit en GitHub y Railway tarda 1 a 2 minutos en mostrar los cambios. Exportar sigue disponible como copia de seguridad.');
    else setNotice('Publicación no configurada.', 'Faltan GITHUB_TOKEN o GITHUB_REPO en el servidor. Puedes editar y exportar el JSON, pero no publicar desde aquí.');
  }
  function loadServer() {
    return api('GET', 'content').then(function (r) {
      original = clone(r.content); sha = r.sha;
      load(clone(r.content), 'Contenido publicado cargado. Sin cambios.', false);
    }).catch(function (e) { if (e.status !== 401) setStatus('No se pudo cargar el contenido: ' + e.message, true); });
  }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var b = $('loginBtn'); b.disabled = true; $('loginErr').textContent = '';
    api('POST', 'login', { user: $('loginUser').value, password: $('loginPass').value })
      .then(function (r) { csrf = r.csrf; $('loginPass').value = ''; $('login').hidden = true; return api('GET', 'status'); })
      .then(function (st) { enterServerMode(st); return canPublish ? loadServer() : initLocal(); })
      .catch(function (err) { $('loginErr').textContent = err.message; })
      .then(function () { b.disabled = false; });
  });
  $('btnPublish').addEventListener('click', function () {
    if (!window.confirm('Se publicará el contenido en la web. Railway tardará 1 a 2 minutos en mostrar los cambios. ¿Continuar?')) return;
    var btn = this; btn.disabled = true; setStatus('Publicando…', true);
    api('PUT', 'content', { content: content, sha: sha })
      .then(function (r) { sha = r.sha; original = clone(content); dirty = false; setStatus('Publicado. Railway tarda 1 a 2 minutos en mostrarlo.', false); $('status').classList.add('ok'); })
      .catch(function (e) { setStatus('No se publicó: ' + e.message + (e.details ? ' (' + e.details.join('; ') + ')' : ''), true); })
      .then(function () { btn.disabled = false; });
  });
  $('btnLogout').addEventListener('click', function () {
    if (dirty && !window.confirm('Hay cambios sin publicar. Si sales, se pierden. ¿Salir?')) return;
    dirty = false;
    api('POST', 'logout', {}).catch(function () {}).then(function () { location.reload(); });
  });

  function init() {
    fetch('/api/admin/status', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('sin api'); return r.json(); })
      .then(function (st) {
        if (!st.enabled) return initLocal();
        $('userField').hidden = !st.needsUser;
        if (st.authenticated) { enterServerMode(st); return canPublish ? loadServer() : initLocal(); }
        showLogin('');
      })
      .catch(function () { initLocal(); });   /* servidor estatico sin API: Modalidad A */
  }
  init();
})();
