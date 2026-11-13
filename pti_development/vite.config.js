import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        /* the page loads the dev assets from loopback (Chrome blocks a loopback page from pulling scripts off a LAN
           address). Other devices reach the site through tools/lan-proxy.mjs, which points them at <their host>:5173. */
        origin: 'http://127.0.0.1:5173',
        // the page may be opened from localhost or any private-network address
        cors: { origin: /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/ },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
