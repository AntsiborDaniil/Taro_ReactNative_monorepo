const {
  handleGoogleOAuthCallback,
  handleOAuthError,
} = require('../../_lib/oauthHandlers');
const { sanitizeOAuthNext } = require('../../_lib/oauthEnv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const nextPath = sanitizeOAuthNext(req.query.next);

  try {
    await handleGoogleOAuthCallback(req, res);
  } catch (error) {
    console.error('[vercel oauth/callback]', error);
    handleOAuthError(res, nextPath, 'Could not complete Google sign-in');
  }
};
