/**
 * callAI.js — AI provider proxy for MET Proficiency Mastery.
 * Routes all AI calls through the Vercel serverless endpoint (/api/ai)
 * so provider API keys stay server-side and out of the browser bundle.
 */

export async function callAI(prompt, { max_tokens = 2048, system, temperature = 0.3, preferredProvider = null } = {}) {
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      system: system || 'You are a helpful MET English teaching assistant.',
      max_tokens,
      temperature,
      preferredProvider,
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error?.message || `AI request failed (${r.status})`);
  }
  return r.json();
}

export async function summarizeTranscript(transcript) {
  if (!transcript || transcript.length < 800) return transcript;
  const prompt = `Condense this class transcript to under 600 words. Keep all student errors, corrections, and notable moments.\n\n${transcript}`;
  const data = await callAI(prompt, { max_tokens: 800 });
  return data.content?.map(b => b.text || '').join('') || transcript;
}
