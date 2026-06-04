/**
 * auth0-config.js — Auth0 configuration helper.
 *
 * Required Netlify env vars (set once credentials are created):
 *   VITE_AUTH0_DOMAIN    e.g. dev-xxxx.us.auth0.com
 *   VITE_AUTH0_CLIENT_ID e.g. abc123...
 *
 * When either var is absent the app renders normally but the teacher
 * login panel shows a "not configured" message instead of the button.
 */
export function getAuth0Config() {
  const domain   = import.meta.env.VITE_AUTH0_DOMAIN   || '';
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || '';
  return { domain, clientId, isConfigured: Boolean(domain && clientId) };
}
