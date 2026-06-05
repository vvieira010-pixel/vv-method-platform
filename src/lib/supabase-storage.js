const SESSION_KEY = 'vv:supabase_session';

export function normalizeSupabaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

// Public Supabase connection — HARDWIRED on purpose.
// The anon key is meant to be exposed in the browser (Row Level Security is the
// protection). Env vars are deliberately ignored: misconfigured Vercel env vars
// were the root cause of the 405/401 sign-in failures, so the connection no
// longer depends on them at all. To point at a different project, edit here.
const SUPABASE_URL = 'https://grnzzgzqizoxfcbflnwq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdybnp6Z3pxaXpveGZjYmZsbndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODQ0MzcsImV4cCI6MjA5NjE2MDQzN30.5T7xFRlbJ9GQX9WvhJ5o2nIDgp3T99fJeGk5wCpuVnI';

export function getSupabaseConfig() {
  return {
    url: normalizeSupabaseUrl(SUPABASE_URL),
    anonKey: SUPABASE_ANON_KEY,
    isConfigured: true,
  };
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

/* ── PKCE helpers (needed for Supabase projects created after ~2024) ─────── */
const PKCE_VERIFIER_KEY = 'vv:pkce_verifier';

/** Generate a cryptographically random PKCE code verifier. */
function generateVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** SHA-256 the verifier and base64url-encode → code_challenge (S256). */
async function challengeFromVerifier(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Exchange the PKCE auth code (from ?code= query param) for a full session.
 * Returns the session object ({ access_token, refresh_token, ... }) or throws.
 */
export async function exchangePKCECode(url, anonKey, code) {
  // Use localStorage (not sessionStorage) so the verifier survives the redirect
  // even when the email client opens the magic link in a new tab or browser window.
  const verifier = localStorage.getItem(PKCE_VERIFIER_KEY) || '';
  const res = await fetch(`${url}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`PKCE exchange failed: ${err.error_description || err.message || res.status}`);
  }
  localStorage.removeItem(PKCE_VERIFIER_KEY);
  return res.json(); // { access_token, refresh_token, expires_in, token_type, user }
}

/** Check URL query string for the PKCE ?code= param and return it (or null). */
export function parsePKCECode(search = window.location.search) {
  const code = new URLSearchParams(search).get('code');
  return code || null;
}

/**
 * Sign in with email + password (Supabase password grant). No email delivery
 * involved — works without SMTP. Returns the session
 * ({ access_token, refresh_token, expires_in, user, ... }) or throws with the
 * API error message. The account must already exist (create it in the Supabase
 * dashboard → Authentication → Users, with "Auto Confirm User" on).
 */
export async function signInWithPassword(email, password) {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) throw new Error('Supabase is not configured.');
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email).trim(), password }),
  });
  if (!res.ok) {
    let msg = `Sign-in failed (${res.status})`;
    try { const j = await res.json(); msg = j.msg || j.error_description || j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Send a passwordless magic-link / OTP email using PKCE flow.
 * On click, Supabase redirects to `redirectTo?code=xxx` (PKCE) or
 * `redirectTo#access_token=xxx` (implicit, legacy) — App.jsx handles both.
 * `createUser` controls whether a brand-new user is provisioned.
 * Returns { ok } or throws with the API error message.
 */
export async function sendMagicLink(email, redirectTo, { createUser = false } = {}) {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) throw new Error('Supabase is not configured.');
  // Generate PKCE pair and persist verifier for the code exchange on return.
  const verifier = generateVerifier();
  const challenge = await challengeFromVerifier(verifier);
  localStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const endpoint = `${url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: String(email).trim(),
      create_user: createUser,
      code_challenge: challenge,
      code_challenge_method: 's256',
    }),
  });
  if (!res.ok) {
    let msg = `Magic-link request failed (${res.status})`;
    try { const j = await res.json(); msg = j.msg || j.error_description || j.error || msg; } catch {}
    throw new Error(msg);
  }
  return { ok: true };
}
