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
 * Optional model overrides (comma-separated, best-first priority):
 *   OPENAI_MODELS, ANTHROPIC_MODELS, GEMINI_MODELS, OPENROUTER_MODELS, GROQ_MODELS
 * Cascade is globally ordered by MODEL_PRIORITY — best models across all providers
 * first. Each model is skipped if not in its provider's configured model list.
 */

const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';
const multiKeys = (name) =>
  String(env(name) || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
    .filter((k, i, a) => a.indexOf(k) === i);

const GEMINI_DEFAULT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-pro',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
];

const OPENAI_DEFAULT_MODELS = [
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1-nano',
];

const ANTHROPIC_DEFAULT_MODELS = [
  'claude-sonnet-4-6',
  'claude-3-5-haiku-latest',
  'claude-3-haiku-20240307',
];

const OPENROUTER_DEFAULT_MODELS = [
  'openrouter/free',
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-4-scout:free',
  'qwen/qwen3-235b-a22b:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'google/gemma-3-27b-it:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
];

const GROQ_DEFAULT_MODELS = [
  'llama-3.3-70b-versatile',
  'qwen3-32b',
  'deepseek-r1-distill-70b',
  'llama-3.1-8b-instant',
  'llama-4-scout-17b-16e-instruct',
];

const parseList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

const GEMINI_MODELS = parseList(env('GEMINI_MODELS')).length
  ? parseList(env('GEMINI_MODELS')) : GEMINI_DEFAULT_MODELS;
const OPENROUTER_MODELS = parseList(env('OPENROUTER_MODELS')).length
  ? parseList(env('OPENROUTER_MODELS')) : OPENROUTER_DEFAULT_MODELS;
const GROQ_MODELS = parseList(env('GROQ_MODELS')).length
  ? parseList(env('GROQ_MODELS')) : GROQ_DEFAULT_MODELS;
const ANTHROPIC_MODELS = parseList(env('ANTHROPIC_MODELS')).length
  ? parseList(env('ANTHROPIC_MODELS')) : ANTHROPIC_DEFAULT_MODELS;
const OPENAI_MODELS = parseList(env('OPENAI_MODELS')).length
  ? parseList(env('OPENAI_MODELS')) : OPENAI_DEFAULT_MODELS;

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

  async function tryAnthropic(key, model) {
    try {
      const r = await fetchT('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: model || 'claude-sonnet-4-6', max_tokens, temperature, system: sys, messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.ok) return r.json();
      const e = await r.json().catch(() => ({}));
      errors.push(`Anthropic/${model}: ${e.error?.message || r.status}`);
    } catch (e) { errors.push(`Anthropic/${model}: ${e.message}`); }
    return null;
  }

  // Global model priority: best models first across all providers.
  const MODEL_PRIORITY = [
    // ── Tier 1: Frontier Reasoning ──
    ['deepseek/deepseek-r1-0528:free',           'openrouter'],
    ['deepseek/deepseek-chat-v3-0324:free',      'openrouter'],
    ['nvidia/nemotron-3-ultra-550b-a55b:free',   'openrouter'],
    ['gemini-3.5-flash',                         'gemini'],
    ['gemini-3.1-pro',                           'gemini'],
    ['gemini-3.1-flash-lite',                    'gemini'],
    ['gemini-2.5-flash',                         'gemini'],
    ['gemini-2.5-flash-lite',                    'gemini'],
    ['gemini-2.0-flash',                         'gemini'],
    ['gemini-2.0-flash-lite',                    'gemini'],
    ['gemma-4-31b-it',                           'gemini'],
    ['gemma-4-26b-a4b-it',                       'gemini'],
    // ── Tier 2: Strong Models ──
    ['meta-llama/llama-3.3-70b-instruct:free',   'openrouter'],
    ['llama-3.3-70b-versatile',                  'groq'],
    ['gpt-4.1',                                  'openai'],
    ['qwen/qwen3-235b-a22b:free',                'openrouter'],
    ['qwen3-32b',                                'groq'],
    ['gpt-4.1-mini',                             'openai'],
    ['deepseek-r1-distill-70b',                  'groq'],
    ['meta-llama/llama-4-scout:free',             'openrouter'],
    // ── Tier 3: Capable / Fast ──
    ['gpt-4o',                                   'openai'],
    ['llama-3.1-8b-instant',                     'groq'],
    ['llama-4-scout-17b-16e-instruct',           'groq'],
    ['qwen/qwen-2.5-72b-instruct:free',          'openrouter'],
    ['google/gemma-3-27b-it:free',               'openrouter'],
    ['nvidia/llama-3.1-nemotron-70b-instruct:free', 'openrouter'],
    ['mistralai/mistral-small-3.1-24b-instruct:free', 'openrouter'],
    ['nvidia/nemotron-3-nano-30b-a3b:free',       'openrouter'],
    // ── Tier 4: Budget / Fallback ──
    ['gpt-4o-mini',                              'openai'],
    ['gpt-4.1-nano',                             'openai'],
    ['openrouter/free',                          'openrouter'],
    ['claude-sonnet-4-6',                        'anthropic'],
    ['claude-3-5-haiku-latest',                  'anthropic'],
    ['claude-3-haiku-20240307',                  'anthropic'],
  ];

  const providerKeys = { gemini: geminiKeys, groq: groqKeys, openrouter: openrouterKeys, anthropic: anthropicKeys, openai: openaiKeys };
  const providerModels = { gemini: new Set(GEMINI_MODELS), groq: new Set(GROQ_MODELS), openrouter: new Set(OPENROUTER_MODELS), anthropic: new Set(ANTHROPIC_MODELS), openai: new Set(OPENAI_MODELS) };
  const providerRunner = {
    gemini: (k, m) => ({ id: 'gemini', run: () => tryGemini(k, m) }),
    groq: (k, m) => ({ id: 'groq', run: () => tryOpenAICompat('https://api.groq.com/openai/v1/chat/completions', k, m) }),
    openrouter: (k, m) => ({ id: 'openrouter', run: () => tryOpenAICompat('https://openrouter.ai/api/v1/chat/completions', k, m, { 'X-Title': 'MET Proficiency Mastery' }) }),
    anthropic: (k, m) => ({ id: 'anthropic', run: () => tryAnthropic(k, m) }),
    openai: (k, m) => ({ id: 'openai', run: () => tryOpenAICompat('https://api.openai.com/v1/chat/completions', k, m) }),
  };

  const attempts = [];
  for (const [model, provider] of MODEL_PRIORITY) {
    const keys = providerKeys[provider];
    if (keys.length && providerModels[provider].has(model)) {
      keys.forEach((k) => attempts.push(providerRunner[provider](k, model)));
    }
  }

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
