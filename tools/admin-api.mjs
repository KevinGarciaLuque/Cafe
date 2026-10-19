// API de administracion (Modalidad B): inicio de sesion con contrasena y publicacion por commit a GitHub.
// Sin dependencias. Se activa solo si existe ADMIN_PASSWORD.
//
// Variables de entorno:
//   ADMIN_PASSWORD   contrasena del administrador (obligatoria para activar el panel)
//   GITHUB_TOKEN     token fino de GitHub con permiso "Contents: Read and write" SOLO sobre este repositorio
//   GITHUB_REPO      "usuario/repositorio", por ejemplo KevinGarciaLuque/Cafe
//   GITHUB_BRANCH    rama que despliega Railway (por defecto main)
//   GITHUB_API       solo para pruebas (por defecto https://api.github.com)
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PASSWORD = process.env.ADMIN_PASSWORD || '';
const USER = (process.env.ADMIN_USER || '').trim().toLowerCase();   // opcional: si existe, el inicio de sesion pide usuario y contrasena
if (PASSWORD && PASSWORD.length < 12) console.warn('[admin] ADMIN_PASSWORD tiene menos de 12 caracteres: el panel publica en GitHub, conviene una mas larga.');
const TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = process.env.GITHUB_REPO || '';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const GH = (process.env.GITHUB_API || 'https://api.github.com').replace(/\/$/, '');
const CONTENT_PATH = 'site/src/content/siteContent.json';
const UPLOAD_DIR_REPO = 'site/assets/img/uploads';
export const UPLOAD_DIR_LOCAL = join(tmpdir(), 'aureo-uploads');   // copia local para ver la imagen antes de que Railway redespliegue

export const adminEnabled = PASSWORD.length > 0;
const publishEnabled = adminEnabled && !!TOKEN && /^[\w.-]+\/[\w.-]+$/.test(REPO);

const SESSION_TTL = 8 * 3600 * 1000;
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_TOTAL = 30;
const sessions = new Map();   // id -> { exp, csrf }
const fails = new Map();      // ip -> { n, since }
let totalFails = { n: 0, since: Date.now() };
setInterval(() => {
  const now = Date.now();
  for (const [k, s] of sessions) if (s.exp < now) sessions.delete(k);
  for (const [k, f] of fails) if (now - f.since > WINDOW) fails.delete(k);
  if (now - totalFails.since > WINDOW) totalFails = { n: 0, since: now };
}, 60 * 1000).unref();

const sha256 = (s) => createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => timingSafeEqual(sha256(a), sha256(b));   // comparacion de tiempo constante

function send(res, status, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(body);
}
function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return xf.length ? xf[xf.length - 1] : req.socket.remoteAddress || 'x';   // el ultimo valor lo agrega el proxy de confianza, no el cliente
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('grande'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('json'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
function session(req) {
  const id = cookies(req).aureo_admin;
  const s = id && sessions.get(id);
  if (!s || s.exp < Date.now()) { if (id) sessions.delete(id); return null; }
  return { id, ...s };
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === String(req.headers['x-forwarded-host'] || req.headers.host); } catch { return false; }
}
function secureCookie(req) { return (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' || process.env.NODE_ENV === 'production'; }

// ---------- validacion del contenido (el servidor no confia en el navegador) ----------
const HEX = /^#[0-9a-f]{3,8}$/i;
const BAD_URL = /^\s*(javascript|vbscript):/i;
function scanStrings(v, path, errors) {
  if (typeof v === 'string') {
    if (v.length > 6000) errors.push(`${path}: texto demasiado largo`);
    if (BAD_URL.test(v)) errors.push(`${path}: enlace no permitido`);
    if (/^\s*data:/i.test(v)) errors.push(`${path}: las imagenes se suben desde el panel, no se incrustan`);
  } else if (Array.isArray(v)) v.forEach((x, i) => scanStrings(x, `${path}[${i}]`, errors));
  else if (v && typeof v === 'object') Object.keys(v).forEach((k) => scanStrings(v[k], path ? `${path}.${k}` : k, errors));
}
export function validateContent(c) {
  const e = [];
  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  if (!isObj(c)) return ['el contenido no es un objeto'];
  if (JSON.stringify(c).length > 1.5 * 1024 * 1024) e.push('el contenido es demasiado grande');
  if (!isObj(c.brand) || typeof c.brand.name !== 'string' || !c.brand.name.trim()) e.push('brand.name es obligatorio');
  if (!isObj(c.theme) || !isObj(c.theme.colors)) e.push('theme.colors es obligatorio');
  else for (const [k, v] of Object.entries(c.theme.colors)) if (typeof v !== 'string' || !HEX.test(v)) e.push(`theme.colors.${k}: color no valido`);
  const h = c.hero;
  if (!isObj(h) || !Array.isArray(h.bands) || h.bands.length !== 4) e.push('hero.bands debe tener 4 textos');
  else h.bands.forEach((b, i) => {
    if (!Array.isArray(b.range) || b.range.length !== 2 || b.range.some((n) => typeof n !== 'number' || n < 0 || n > 1)) e.push(`hero.bands[${i}].range no valido`);
    if (!['drift', 'rise', 'depth', 'blur'].includes(b.entrance)) e.push(`hero.bands[${i}].entrance no valido`);
    if (!['left', 'right'].includes(b.align)) e.push(`hero.bands[${i}].align no valido`);
    if (typeof b.title !== 'string' || !b.title.trim()) e.push(`hero.bands[${i}].title es obligatorio`);
  });
  if (isObj(h)) {
    if (!isObj(h.final) || typeof h.final.title !== 'string') e.push('hero.final.title es obligatorio');
    if (!isObj(h.media) || typeof h.media.video !== 'string' || !h.media.video) e.push('hero.media.video es obligatorio');
    if (!Array.isArray(h.stages) || h.stages.length !== 5) e.push('hero.stages debe tener 5 etapas');
  }
  if (!isObj(c.coffees) || !Array.isArray(c.coffees.items) || c.coffees.items.length > 12) e.push('coffees.items no valido (maximo 12)');
  if (!isObj(c.menu) || !Array.isArray(c.menu.categories) || c.menu.categories.length > 8) e.push('menu.categories no valido (maximo 8)');
  if (!isObj(c.faq) || !Array.isArray(c.faq.items) || c.faq.items.length > 30) e.push('faq.items no valido (maximo 30)');
  if (!isObj(c.process) || !Array.isArray(c.process.steps)) e.push('process.steps es obligatorio');
  if (!isObj(c.experience) || !Array.isArray(c.experience.gallery) || c.experience.gallery.length !== 5) e.push('experience.gallery debe tener 5 imagenes');
  if (!isObj(c.contact) || !isObj(c.contact.form)) e.push('contact.form es obligatorio');
  scanStrings(c, '', e);
  return e.slice(0, 12);
}

// ---------- GitHub ----------
async function gh(method, path, body) {
  const r = await fetch(GH + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'aureo-admin', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null; try { data = await r.json(); } catch { /* sin cuerpo */ }
  return { status: r.status, data };
}
const encPath = (p) => p.split('/').map(encodeURIComponent).join('/');

// ---------- rutas ----------
export async function handleAdminApi(req, res, url) {
  const p = url.pathname;
  if (!p.startsWith('/api/admin/')) return false;
  if (!adminEnabled) { send(res, 404, { error: 'no disponible' }); return true; }
  const route = p.slice('/api/admin/'.length);

  try {
    if (route === 'status' && req.method === 'GET') {
      const s = session(req);
      send(res, 200, { enabled: true, authenticated: !!s, publish: publishEnabled, needsUser: !!USER, csrf: s ? s.csrf : null });
      return true;
    }

    if (route === 'login' && req.method === 'POST') {
      if (!sameOrigin(req)) { send(res, 403, { error: 'origen no permitido' }); return true; }
      const ip = clientIp(req), now = Date.now();
      let f = fails.get(ip); if (f && now - f.since > WINDOW) { fails.delete(ip); f = null; }
      if (now - totalFails.since > WINDOW) totalFails = { n: 0, since: now };
      if ((f && f.n >= MAX_FAILS_PER_IP) || totalFails.n >= MAX_FAILS_TOTAL) {
        const wait = Math.ceil(((f ? f.since : totalFails.since) + WINDOW - now) / 60000);
        send(res, 429, { error: `Demasiados intentos. Espera ${wait} minuto(s).` }, { 'Retry-After': String(wait * 60) });
        return true;
      }
      const body = await readBody(req, 4096);
      await new Promise((r) => setTimeout(r, 350));   // frena los intentos automaticos
      // se evaluan siempre las dos comparaciones, para no revelar cual de las dos fallo
      const okUser = USER ? safeEqual(String(body.user || '').trim().toLowerCase(), USER) : true;
      const okPass = typeof body.password === 'string' && safeEqual(body.password, PASSWORD);
      if (!(okUser && okPass)) {
        fails.set(ip, { n: (f ? f.n : 0) + 1, since: f ? f.since : now });
        totalFails.n++;
        send(res, 401, { error: 'Usuario o contraseña incorrectos.' });
        return true;
      }
      fails.delete(ip);
      const id = randomBytes(32).toString('hex'), csrf = randomBytes(24).toString('hex');
      sessions.set(id, { exp: now + SESSION_TTL, csrf });
      send(res, 200, { ok: true, csrf, publish: publishEnabled }, { 'Set-Cookie': `aureo_admin=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${secureCookie(req) ? '; Secure' : ''}` });
      return true;
    }

    const s = session(req);
    if (!s) { send(res, 401, { error: 'Sesion no valida. Inicia sesion de nuevo.' }); return true; }

    if (route === 'logout' && req.method === 'POST') {
      if (!sameOrigin(req) || req.headers['x-csrf-token'] !== s.csrf) { send(res, 403, { error: 'solicitud no permitida' }); return true; }
      sessions.delete(s.id);
      send(res, 200, { ok: true }, { 'Set-Cookie': 'aureo_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
      return true;
    }

    if (!publishEnabled) { send(res, 501, { error: 'La publicacion no esta configurada (falta GITHUB_TOKEN o GITHUB_REPO).' }); return true; }

    if (route === 'content' && req.method === 'GET') {
      const r = await gh('GET', `/repos/${REPO}/contents/${encPath(CONTENT_PATH)}?ref=${encodeURIComponent(BRANCH)}`);
      if (r.status !== 200 || !r.data || !r.data.content) { send(res, 502, { error: `GitHub respondio ${r.status} al leer el contenido.` }); return true; }
      send(res, 200, { content: JSON.parse(Buffer.from(r.data.content, 'base64').toString('utf8')), sha: r.data.sha });
      return true;
    }

    // a partir de aqui: operaciones que cambian algo
    if (!sameOrigin(req) || req.headers['x-csrf-token'] !== s.csrf) { send(res, 403, { error: 'solicitud no permitida' }); return true; }

    if (route === 'content' && req.method === 'PUT') {
      const body = await readBody(req, 2 * 1024 * 1024);
      const errors = validateContent(body.content);
      if (errors.length) { send(res, 422, { error: 'El contenido no es valido.', details: errors }); return true; }
      if (typeof body.sha !== 'string' || !/^[0-9a-f]{40}$/.test(body.sha)) { send(res, 400, { error: 'Falta la version base (sha).' }); return true; }
      const text = JSON.stringify(body.content, null, 2) + '\n';
      const r = await gh('PUT', `/repos/${REPO}/contents/${encPath(CONTENT_PATH)}`, {
        message: `Contenido actualizado desde el panel (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)`,
        content: Buffer.from(text, 'utf8').toString('base64'), sha: body.sha, branch: BRANCH
      });
      if (r.status === 409 || r.status === 422) { send(res, 409, { error: 'El contenido cambió desde que lo abriste. Recarga el panel y vuelve a aplicar tus cambios.' }); return true; }
      if (r.status !== 200 && r.status !== 201) { send(res, 502, { error: `GitHub respondio ${r.status}. Revisa el token y los permisos.` }); return true; }
      send(res, 200, { ok: true, sha: r.data.content.sha, commit: r.data.commit && r.data.commit.html_url });
      return true;
    }

    if (route === 'image' && req.method === 'POST') {
      const body = await readBody(req, 6 * 1024 * 1024);
      const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ''));
      if (!m) { send(res, 422, { error: 'Solo se aceptan imagenes JPG, PNG o WebP.' }); return true; }
      const buf = Buffer.from(m[3], 'base64');
      if (buf.length > 3.5 * 1024 * 1024) { send(res, 413, { error: 'La imagen pesa mas de 3.5 MB.' }); return true; }
      const magicOk = (m[2] === 'jpeg' && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) ||
        (m[2] === 'png' && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
        (m[2] === 'webp' && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP');
      if (!magicOk) { send(res, 422, { error: 'El archivo no es una imagen valida.' }); return true; }
      const slug = String(body.name || 'imagen').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'imagen';
      const file = `${slug}-${Date.now().toString(36)}.${m[2] === 'jpeg' ? 'jpg' : m[2]}`;
      const r = await gh('PUT', `/repos/${REPO}/contents/${encPath(`${UPLOAD_DIR_REPO}/${file}`)}`, {
        message: `Imagen subida desde el panel: ${file}`, content: buf.toString('base64'), branch: BRANCH
      });
      if (r.status !== 200 && r.status !== 201) { send(res, 502, { error: `GitHub respondio ${r.status} al subir la imagen.` }); return true; }
      await mkdir(UPLOAD_DIR_LOCAL, { recursive: true });
      await writeFile(join(UPLOAD_DIR_LOCAL, file), buf);   // para verla en la vista previa antes del redespliegue
      send(res, 200, { ok: true, path: `assets/img/uploads/${file}` });
      return true;
    }

    send(res, 404, { error: 'no encontrado' });
    return true;
  } catch (err) {
    if (err && err.status) { send(res, err.status, { error: err.status === 413 ? 'El archivo es demasiado grande.' : 'Solicitud no valida.' }); return true; }
    console.error('admin-api:', err && err.message);
    send(res, 500, { error: 'Error del servidor.' });
    return true;
  }
}
