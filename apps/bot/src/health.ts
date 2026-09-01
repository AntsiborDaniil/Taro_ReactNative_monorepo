import http from 'node:http';

function isHealthPath(path: string | undefined): boolean {
  const normalized = path?.split('?')[0];
  return normalized === '/health' || normalized === '/';
}

export function startHealthServer(port: number): void {
  const server = http.createServer((req, res) => {
    if (isHealthPath(req.url)) {
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      res.end('ok');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  });

  server.keepAliveTimeout = 5_000;

  server.listen(port, '0.0.0.0', () => {
    console.log(`[bot] health listening on :${port}/health`);
  });
}
