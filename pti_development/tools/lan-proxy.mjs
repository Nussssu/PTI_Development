/**
 * LAN proxy for local testing: exposes `php artisan serve` (127.0.0.1:8000) on every network
 * interface, so other devices on the same Wi-Fi/LAN can open the site.
 * Node already has a Windows-firewall allow rule; php.exe does not, hence this proxy.
 *
 * The Vite dev server announces itself as http://127.0.0.1:5173 (see vite.config.js). For a visitor
 * on another device the HTML is rewritten to http://<the host they used>:5173, so their browser
 * loads the dev assets (and opens the HMR socket) from this machine.
 *
 *   node tools/lan-proxy.mjs            # listens on 0.0.0.0:8080 -> 127.0.0.1:8000
 *   LAN_PORT=9000 node tools/lan-proxy.mjs
 */
import http from 'node:http';

const PORT = +(process.env.LAN_PORT || 8080);
const TARGET = { host: '127.0.0.1', port: +(process.env.APP_PORT || 8000) };
const VITE = 'http://127.0.0.1:5173';

http.createServer((req, res) => {
    const from = req.socket.remoteAddress?.replace('::ffff:', '');
    const host = (req.headers.host || 'localhost').replace(/:\d+$/, '');
    const headers = { ...req.headers };
    delete headers['accept-encoding']; // keep HTML uncompressed so it can be rewritten
    const up = http.request({ ...TARGET, method: req.method, path: req.url, headers }, (r) => {
        console.log(`${new Date().toISOString().slice(11, 19)} ${from} ${req.method} ${req.url} -> ${r.statusCode} [${req.headers['user-agent']?.match(/Macintosh|iPhone|Android|Windows/)?.[0] || '?'}]`);
        if (!/text\/html/.test(r.headers['content-type'] || '')) {
            res.writeHead(r.statusCode, r.headers);
            r.pipe(res);
            return;
        }
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => {
            const body = Buffer.from(Buffer.concat(chunks).toString('utf8').split(VITE).join(`http://${host}:5173`), 'utf8');
            const h = { ...r.headers, 'content-length': body.length };
            delete h['transfer-encoding'];
            res.writeHead(r.statusCode, h);
            res.end(body);
        });
    });
    up.on('error', (e) => { res.writeHead(502, { 'content-type': 'text/plain' }); res.end(`Laravel server not reachable: ${e.message}`); });
    req.pipe(up);
}).listen(PORT, '0.0.0.0', () => console.log(`LAN proxy on 0.0.0.0:${PORT} -> ${TARGET.host}:${TARGET.port}`));
