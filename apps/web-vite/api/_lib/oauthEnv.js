/** Env helpers for Vercel serverless auth BFF (session cookie on this host). */

function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

module.exports = {
  isProduction,
};
