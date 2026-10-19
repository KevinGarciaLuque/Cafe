// Servidor estatico minimo, sin dependencias.
//   Local:      node tools/serve.mjs site 8080
//   Produccion: npm start   (Railway define PORT y NODE_ENV=production)
// En produccion el panel /admin NO se sirve (no tiene login). Para habilitarlo: ADMIN_ENABLED=1.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] || 'site');
const port = Number(process.env.PORT || process.argv[3] || 8080);
const production = process.env.NODE_ENV === 'production';
const adminOn = !production || process.env.ADMIN_ENABLED === '1';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};
// El contenido y las paginas se revalidan siempre; los archivos pesados se guardan un dia
const cacheFor = (ext) => (['.html', '.json', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=86400');

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok'); return; }
    if (!adminOn && (path === '/admin' || path.startsWith('/admin/'))) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado'); return; }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    const ext = extname(file);
    const headers = {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': cacheFor(ext),
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    if (req.method === 'HEAD') { res.writeHead(200, headers).end(); return; }
    res.writeHead(200, headers).end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
});

// 0.0.0.0: Railway necesita escuchar en todas las interfaces, no solo en localhost
server.listen(port, '0.0.0.0', () => console.log(`AUREO COFFEE en el puerto ${port} (carpeta: ${root}, admin: ${adminOn ? 'si' : 'no'})`));
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => server.close(() => process.exit(0)));
