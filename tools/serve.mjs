// Servidor estatico minimo, sin dependencias, con la API de administracion (tools/admin-api.mjs).
//   Local:      node tools/serve.mjs site 8080
//   Produccion: npm start   (Railway define PORT y NODE_ENV=production)
// El panel /admin solo se sirve en produccion si hay ADMIN_PASSWORD (y entonces exige iniciar sesion).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { adminEnabled, handleAdminApi, UPLOAD_DIR_LOCAL } from './admin-api.mjs';

const root = resolve(process.argv[2] || 'site');
const port = Number(process.env.PORT || process.argv[3] || 8080);
const production = process.env.NODE_ENV === 'production';
const adminOn = !production || adminEnabled;

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};
// El contenido y las paginas se revalidan siempre. Los archivos con version en la direccion (?v=) se guardan un año;
// el resto de imagenes y videos, solo una hora, para que un reemplazo llegue pronto a los visitantes.
const cacheFor = (ext, versioned) => {
  if (['.html', '.json', '.js', '.css'].includes(ext)) return 'no-cache';
  return versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) {
      if (await handleAdminApi(req, res, url)) return;
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado'); return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    const versioned = url.searchParams.has('v');
    let path = decodeURIComponent(url.pathname);
    if (path === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok'); return; }
    if (!adminOn && (path === '/admin' || path.startsWith('/admin/'))) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado'); return; }
    if (path === '/admin') { res.writeHead(301, { Location: '/admin/' }).end(); return; }
    if (path.endsWith('/')) path += 'index.html';
    let file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    let info;
    try { info = await stat(file); if (!info.isFile()) throw new Error('no file'); }
    catch (e) {
      // imagenes recien subidas desde el panel: se ven antes de que Railway termine de redesplegar
      if (path.startsWith('/assets/img/uploads/')) {
        file = normalize(join(UPLOAD_DIR_LOCAL, path.slice('/assets/img/uploads/'.length)));
        if (!file.startsWith(UPLOAD_DIR_LOCAL + sep)) throw e;
        info = await stat(file); if (!info.isFile()) throw e;
      } else throw e;
    }
    const ext = extname(file);
    const headers = {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': cacheFor(ext, versioned),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    if (path.startsWith('/admin/')) headers['Cache-Control'] = 'no-store';
    if (req.method === 'HEAD') { res.writeHead(200, headers).end(); return; }
    res.writeHead(200, headers).end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
});

// 0.0.0.0: Railway necesita escuchar en todas las interfaces, no solo en localhost
server.listen(port, '0.0.0.0', () => console.log(`AUREO COFFEE en el puerto ${port} (carpeta: ${root}, admin: ${adminOn ? (adminEnabled ? 'con contraseña' : 'local, sin sesion') : 'no'})`));
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => server.close(() => process.exit(0)));
