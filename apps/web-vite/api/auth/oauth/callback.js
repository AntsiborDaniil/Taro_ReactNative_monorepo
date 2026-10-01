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
    const detail =
      error?.code === 'pkce_code_verifier_not_found'
        ? 'PKCE verifier missing — retry sign-in'
        : error?.message;
    handleOAuthError(
      res,
      req,
      nextPath,
      detail && detail.length < 120
        ? `Could not complete Google sign-in (${detail})`
        : 'Could not complete Google sign-in'
    );
  }
};
