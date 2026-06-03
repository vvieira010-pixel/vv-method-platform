const SESSION_KEY = 'vv:supabase_session';

export function normalizeSupabaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function getSupabaseConfig() {
  const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}

export function buildSupabaseHeaders(anonKey, accessToken, extra = {}) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

/** Parse JWT claims without a library — base64url decode the payload segment. */
export function parseJwtClaims(token) {
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      payload.length + (4 - (payload.length % 4)) % 4, '='
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function readStoredSupabaseSession(storage = localStorage) {
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.access_token) return null;
    if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000)) {
      storage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function storeSupabaseSession(session, storage = localStorage) {
  if (!session?.access_token) return null;
  const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
  const stored = {
    access_token: session.access_token,
    refresh_token: session.refresh_token || '',
    expires_at: expiresAt,
    user: session.user || null,
  };
  storage.setItem(SESSION_KEY, JSON.stringify(stored));
  return stored;
}

export function clearStoredSupabaseSession(storage = localStorage) {
  storage.removeItem(SESSION_KEY);
}

/**
 * Parse the Supabase implicit-flow hash fragment.
 * Returns { access_token, refresh_token, expires_at, expires_in, token_type, type } or null.
 */
export function parseSupabaseHashFragment(hash = window.location.hash) {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!fragment.includes('access_token')) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  if (!access_token) return null;
  return {
    access_token,
    refresh_token: params.get('refresh_token') || '',
    expires_in: Number(params.get('expires_in') || 3600),
    expires_at: Number(params.get('expires_at') || 0),
    token_type: params.get('token_type') || 'bearer',
    type: params.get('type') || '',  // "signup" | "recovery" | "invite" | ""
  };
}

/** Exchange the access token for a full user session via Supabase REST. */
export async function fetchSupabaseUser(url, anonKey, accessToken) {
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: buildSupabaseHeaders(anonKey, accessToken),
  });
  if (!res.ok) throw new Error(`Supabase user fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Send a passwordless magic-link / OTP email. On click, Supabase redirects to
 * `redirectTo` with the session in the URL hash (handled by App.jsx).
 * `createUser` controls whether a brand-new user is provisioned: teachers use
 * false (must already exist), students use true (first sign-in creates them).
 * Returns { ok } or throws with the API error message.
 */
export async function sendMagicLink(email, redirectTo, { createUser = false } = {}) {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) throw new Error('Supabase is not configured.');
  const endpoint = `${url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email).trim(), create_user: createUser }),
  });
  if (!res.ok) {
    let msg = `Magic-link request failed (${res.status})`;
    try { const j = await res.json(); msg = j.msg || j.error_description || j.error || msg; } catch {}
    throw new Error(msg);
  }
  return { ok: true };
}
