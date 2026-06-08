const { proxyAuthRoute } = require('../_lib/bffProxy');

module.exports = async function handler(req, res) {
  const raw = req.query.path;
  const authPath = Array.isArray(raw) ? raw.join('/') : raw || '';

  try {
    await proxyAuthRoute(req, res, authPath);
  } catch (error) {
    console.error('[vercel auth proxy]', authPath, error);
    res.status(502).json({ message: 'Auth service unavailable' });
  }
};
