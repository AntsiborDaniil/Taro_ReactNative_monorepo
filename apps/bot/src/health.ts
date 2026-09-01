import http from 'node:http';

export function startHealthServer(port: number): void {
  const server = http.createServer((req, res) => {
    const path = req.url?.split('?')[0];

    if (path === '/health' || path === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ok');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[bot] health listening on :${port}/health`);
  });
}
