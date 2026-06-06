/**
 * api/ai.js — Vercel serverless AI proxy.
 *
 * Runs the multi-provider fallback cascade SERVER-SIDE so provider API keys are
 * never shipped in the browser bundle. The client (shared.jsx → callAI) POSTs
 * { prompt, system, max_tokens, temperature, preferredProvider } here and gets
 * back { content: [{ text }] } — the same shape the client cascade returns.
 *
 * Keys are read from server-only env vars. For a smooth migration it also accepts
 * the legacy VITE_-prefixed names (Vercel exposes every env var to functions at
 * runtime regardless of prefix), but you should drop the VITE_ prefix in the
 * Vercel dashboard so the keys stop being inlined into the client build.
 *
 *   GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY / OPENAI_API_KEY /
 *   ANTHROPIC_API_KEY   (comma- or newline-separated for multiple keys)
 *
 * Optional model overrides: GEMINI_MODELS, OPENROUTER_MODELS, GROQ_MODEL,
 * ANTHROPIC_MODEL, OPENAI_MODEL.
 */

const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';
const multiKeys = (name) =>
  String(env(name) || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
    .filter((k, i, a) => a.indexOf(k) === i);

const GEMINI_DEFAULT_MODELS = [
  'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash',
  'gemini-2.0-flash-lite', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it',
];
const OPENROUTER_DEFAULT_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'qwen/qwen3-235b-a22b:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'meta-llama/llama-4-scout:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];
const parseList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

const GEMINI_MODELS = parseList(env('GEMINI_MODELS')).length
  ? parseList(env('GEMINI_MODELS')) : GEMINI_DEFAULT_MODELS;
const OPENROUTER_MODELS = parseList(env('OPENROUTER_MODELS')).length
  ? parseList(env('OPENROUTER_MODELS')) : OPENROUTER_DEFAULT_MODELS;
const GROQ_MODELS = [
  env('GROQ_MODEL') || 'llama-3.3-70b-versatile',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
  'llama-3.1-8b-instant',
].filter((m, i, a) => a.indexOf(m) === i);
const ANTHROPIC_MODEL = env('ANTHROPIC_MODEL') || 'claude-sonnet-4-6';
const OPENAI_MODEL = env('OPENAI_MODEL') || 'gpt-4.1-mini';

/** fetch with an abort-backed timeout so a hung provider can't stall the function. */
async function fetchT(url, init, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const {
    prompt, system, max_tokens = 2048, temperature = 0.3, preferredProvider = null,
  } = body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: { message: 'Missing "prompt"' } });
  }

  const sys = system || 'You are a helpful MET English teaching assistant.';
  const errors = [];

  const geminiKeys = multiKeys('GEMINI_API_KEY');
  const openrouterKeys = multiKeys('OPENROUTER_API_KEY');
  const groqKeys = multiKeys('GROQ_API_KEY');
  const anthropicKeys = multiKeys('ANTHROPIC_API_KEY');
  const openaiKeys = multiKeys('OPENAI_API_KEY');

  if (!geminiKeys.length && !openrouterKeys.length && !groqKeys.length &&
      !anthropicKeys.length && !openaiKeys.length) {
    return res.status(503).json({ error: { message: 'No AI provider keys configured on the server.' } });
  }

  async function tryGemini(key, model) {
    try {
      const isGemma = /^gemma/i.test(model);
      const gen = { temperature, maxOutputTokens: max_tokens };
      if (/2\.5/.test(model) && /flash/i.test(model)) gen.thinkingConfig = { thinkingBudget: 0 };
      const reqBody = isGemma
        ? { contents: [{ parts: [{ text: `${sys}\n\n${prompt}` }] }], generationConfig: gen }
        : { systemInstruction: { parts: [{ text: sys }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: gen };
      const r = await fetchT(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody) },
      );
      if (r.ok) {
        const data = await r.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
        if (text) return { content: [{ text }] };
        errors.push(`Gemini/${model}: empty (${data?.candidates?.[0]?.finishReason || 'no candidates'})`);
      } else {
        const e = await r.json().catch(() => ({}));
        errors.push(`Gemini/${model}: ${e.error?.message || r.status}`);
      }
    } catch (e) { errors.push(`Gemini/${model}: ${e.message}`); }
    return null;
  }

  async function tryOpenAICompat(url, key, model, extraHeaders = {}) {
    try {
      const r = await fetchT(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...extraHeaders },
        body: JSON.stringify({ model, temperature, max_tokens, messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }] }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data?.choices?.[0]?.message?.content || '';
        if (text) return { content: [{ text }] };
        errors.push(`${model}: empty response`);
      } else {
        const e = await r.json().catch(() => ({}));
        errors.push(`${model}: ${e.error?.message || r.status}`);
      }
    } catch (e) { errors.push(`${model}: ${e.message}`); }
    return null;
  }

  async function tryAnthropic(key) {
    try {
      const r = await fetchT('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens, temperature, system: sys, messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.ok) return r.json();
      const e = await r.json().catch(() => ({}));
      errors.push(`Anthropic: ${e.error?.message || r.status}`);
    } catch (e) { errors.push(`Anthropic: ${e.message}`); }
    return null;
  }

  // Build cascade: Gemini → OpenRouter → Groq → Anthropic → OpenAI
  const attempts = [];
  for (const m of (geminiKeys.length ? GEMINI_MODELS : [])) geminiKeys.forEach((k) => attempts.push({ id: 'gemini', run: () => tryGemini(k, m) }));
  for (const m of (openrouterKeys.length ? OPENROUTER_MODELS : [])) openrouterKeys.forEach((k) => attempts.push({ id: 'openrouter', run: () => tryOpenAICompat('https://openrouter.ai/api/v1/chat/completions', k, m, { 'X-Title': 'MET Proficiency Mastery' }) }));
  for (const m of (groqKeys.length ? GROQ_MODELS : [])) groqKeys.forEach((k) => attempts.push({ id: 'groq', run: () => tryOpenAICompat('https://api.groq.com/openai/v1/chat/completions', k, m) }));
  anthropicKeys.forEach((k) => attempts.push({ id: 'anthropic', run: () => tryAnthropic(k) }));
  openaiKeys.forEach((k) => attempts.push({ id: 'openai', run: () => tryOpenAICompat('https://api.openai.com/v1/chat/completions', k, OPENAI_MODEL) }));

  // preferredProvider: float its attempts to the front.
  let ordered = attempts;
  if (preferredProvider) {
    const pref = attempts.filter((a) => a.id === preferredProvider);
    if (pref.length) ordered = [...pref, ...attempts.filter((a) => a.id !== preferredProvider)];
  }

  for (const a of ordered) {
    const result = await a.run();
    if (result) return res.status(200).json(result);
  }

  return res.status(502).json({ error: { message: `All AI providers failed:\n${errors.join('\n')}` } });
}
