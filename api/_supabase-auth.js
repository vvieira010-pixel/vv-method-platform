const SUPABASE_URL = 'https://grnzzgzqizoxfcbflnwq.supabase.co';

export async function verifySupabaseSession(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    if (payload.role === 'authenticated' || payload.role === 'anon') return true;
  } catch {}
  try {
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    return r.ok;
  } catch {
    return false;
  }
}
