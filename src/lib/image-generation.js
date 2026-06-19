import { uploadExerciseImage } from './supabase-db.js';

export async function generateExerciseImage(description) {
  if (!description) return null;

  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.warn('generate-image API:', err.error);
      return null;
    }

    const { base64, mimeType } = await res.json();
    if (!base64) return null;

    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 6);
    const url = await uploadExerciseImage(base64, `listen_${ts}_${rand}`);
    return url;
  } catch (e) {
    console.warn('generateExerciseImage:', e.message);
    return null;
  }
}
