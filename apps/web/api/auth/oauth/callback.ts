import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleGoogleOAuthCallback,
  handleOAuthError,
} from '../../_lib/oauthHandlers';
import { sanitizeOAuthNext } from '../../_lib/oauthEnv';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
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
}
