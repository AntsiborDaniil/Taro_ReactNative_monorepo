const { proxyAuthRoute } = require('./bffProxy');

/** Explicit Vercel serverless entry (catch-all [...path] is not registered on static Expo deploy). */
function createAuthHandler(authPath) {
  return async function handler(req, res) {
    try {
      await proxyAuthRoute(req, res, authPath);
    } catch (error) {
      console.error('[vercel auth]', authPath, error);
      res.status(502).json({ message: 'Auth service unavailable' });
    }
  };
}

module.exports = { createAuthHandler };
