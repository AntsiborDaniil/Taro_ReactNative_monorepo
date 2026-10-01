/**
 * Раздаёт собранную админку с /admin в vite dev и preview.
 * Как на проде: same-origin /admin + /api через proxy web-vite.
 * Источник: apps/web-vite/dist/admin (после copy) или apps/admin/dist.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin } from 'vite';
import type { ServerResponse } from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webViteAdminDist = path.resolve(__dirname, '../dist/admin');
const adminPackageDist = path.resolve(__dirname, '../../admin/dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

function resolveAdminRoot(): string | null {
  if (fs.existsSync(path.join(webViteAdminDist, 'index.html'))) {
    return webViteAdminDist;
  }
  if (fs.existsSync(path.join(adminPackageDist, 'index.html'))) {
    return adminPackageDist;
  }
  return null;
}

function sendFile(res: ServerResponse, filePath: string): void {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', ext === '.html' ? 'no-store' : 'public, max-age=60');
  fs.createReadStream(filePath).pipe(res);
}

function adminMissing(res: ServerResponse): void {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(
    'Admin dist missing. Run: pnpm --filter tarot-admin build\n' +
      '(или полный pnpm --filter web-vite build)',
  );
}

export function adminStaticPlugin(): Plugin {
  const mount = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      const rawUrl = req.url || '';
      if (!rawUrl.startsWith('/admin')) {
        next();
        return;
      }

      const adminRoot = resolveAdminRoot();
      if (!adminRoot) {
        adminMissing(res);
        return;
      }

      const urlPath = rawUrl.split('?')[0] ?? '';
      const relative =
        urlPath === '/admin' || urlPath === '/admin/'
          ? 'index.html'
          : urlPath.replace(/^\/admin\/?/, '');
      const candidate = path.normalize(path.join(adminRoot, relative));

      if (!candidate.startsWith(adminRoot)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        sendFile(res, candidate);
        return;
      }

      const indexHtml = path.join(adminRoot, 'index.html');
      if (fs.existsSync(indexHtml)) {
        sendFile(res, indexHtml);
        return;
      }

      adminMissing(res);
    });
  };

  return {
    name: 'admin-static',
    configureServer(server) {
      mount(server.middlewares);
    },
    configurePreviewServer(server) {
      mount(server.middlewares);
    },
  };
}
