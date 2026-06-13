/**
 * callAI.js — Multi-provider AI cascade for MET Proficiency Mastery.
 * Extracted from shared.jsx to keep the design system focused on UI primitives.
 */

const API_KEY_LS = 'vv:anthropic_api_key';
const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini';
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_DEFAULT_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
  'gemma-3-27b-it',
  'gemma-3-12b-it',
];
function geminiModels() {
  const parse = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  const fromEnv = parse(import.meta.env.VITE_GEMINI_MODELS);
  let fromLs = [];
  try { fromLs = parse(localStorage.getItem('vv:gemini_models')); } catch { /* storage unavailable */ }
  const override = fromEnv.length ? fromEnv : fromLs;
  const list = override.length ? override : [GEMINI_MODEL, ...GEMINI_DEFAULT_MODELS];
  return list.filter(Boolean).filter((m, i, a) => a.indexOf(m) === i);
}

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_DEFAULT_MODELS = [
  'deepseek/deepseek-r1-0528:free',
  'qwen/qwen3-235b-a22b:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'nvidia/llama-3.3-nemotron-super-49b-v1:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'meta-llama/llama-4-scout:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'google/gemma-3-27b-it:free',
  'nvidia/nemotron-nano-12b-instruct:free',
  'nvidia/llama-3.1-nemotron-nano-8b-v1:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];
function openRouterModels() {
  const parse = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  const fromEnv = parse(import.meta.env.VITE_OPENROUTER_MODELS);
  let fromLs = [];
  try { fromLs = parse(localStorage.getItem('vv:openrouter_models')); } catch { /* storage unavailable */ }
  const list = fromEnv.length ? fromEnv : (fromLs.length ? fromLs : OPENROUTER_DEFAULT_MODELS);
  return list.filter((m, i, a) => a.indexOf(m) === i);
}

const AI_WINNER_LS = 'vv:ai_last_winner';
const AI_COOLDOWNS_LS = 'vv:ai_provider_cooldowns';
const AI_COOLDOWN_MS = 3 * 60 * 1000;

function multiKeys(envVal, lsKey) {
  const parse = s => String(s || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  let fromLs = [];
  try { fromLs = parse(localStorage.getItem(lsKey)); } catch { /* storage unavailable */ }
  return [...parse(envVal), ...fromLs].filter((k, i, a) => a.indexOf(k) === i);
}

function attemptProvider(id) {
  if (id.startsWith('anthropic-direct')) return 'anthropic-direct';
  return String(id || '').split(':')[0].split('#')[0];
}

function loadCooldowns(now = Date.now()) {
  try {
    const raw = JSON.parse(localStorage.getItem(AI_COOLDOWNS_LS) || '{}');
    return Object.fromEntries(Object.entries(raw).filter(([, until]) => Number(until) > now));
  } catch {
    return {};
  }
}

function saveCooldowns(cooldowns) {
  try { localStorage.setItem(AI_COOLDOWNS_LS, JSON.stringify(cooldowns)); } catch { /* storage unavailable */ }
}

function shouldCooldownProvider(messages) {
  return messages.some(msg => /quota|rate limit|tokens per day|limit reached|too many requests|timeout after/i.test(msg));
}

export async function callAI(prompt, { max_tokens = 2048, system, temperature = 0.3, preferredProvider = null } = {}) {
  const sys = system || 'You are a helpful MET English teaching assistant.';
  const errors = [];

  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system: sys, max_tokens, temperature, preferredProvider }),
    });
    const ctype = r.headers.get('content-type') || '';
    if (r.ok && ctype.includes('application/json')) {
      const data = await r.json();
      if (data?.content?.[0]?.text) return data;
    } else if (r.status !== 404 && ctype.includes('application/json')) {
      const e = await r.json().catch(() => ({}));
      if (r.status !== 503) errors.push(`Server /api/ai: ${e.error?.message || r.status}`);
    }
  } catch (e) {
    errors.push(`Server /api/ai: ${e.message}`);
  }

  const groqKeys = multiKeys('', 'vv:groq_api_key');
  const geminiKeys = multiKeys('', 'vv:gemini_api_key');
  const anthropicKeys = multiKeys('', API_KEY_LS);
  const openaiKeys = multiKeys('', 'vv:openai_api_key');
  const openrouterKeys = multiKeys('', 'vv:openrouter_api_key');
  const payload = { model: ANTHROPIC_MODEL, max_tokens, temperature, system: sys, messages: [{ role: 'user', content: prompt }] };

  async function tryGroq(key, model) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model, temperature, max_tokens,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { content: [{ text: data?.choices?.[0]?.message?.content || '' }] };
      }
      const err = await res.json().catch(() => ({}));
      errors.push(`Groq/${model}: ${err.error?.message || res.status}`);
    } catch (e) {
      errors.push(`Groq/${model}: ${e.message}`);
    }
    return null;
  }

  async function tryGemini(key, model = GEMINI_MODEL) {
    try {
      const isGemma = /^gemma/i.test(model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const gen = { temperature, maxOutputTokens: max_tokens };
      if (/2\.5/.test(model) && /flash/i.test(model)) gen.thinkingConfig = { thinkingBudget: 0 };
      const reqBody = isGemma
        ? { contents: [{ parts: [{ text: `${sys}\n\n${prompt}` }] }], generationConfig: gen }
        : { systemInstruction: { parts: [{ text: sys }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: gen };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
        if (text) return { content: [{ text }] };
        errors.push(`Gemini/${model}: empty response (${data?.candidates?.[0]?.finishReason || 'no candidates'})`);
      } else {
        const err = await res.json().catch(() => ({}));
        errors.push(`Gemini/${model}: ${err.error?.message || res.status}`);
      }
    } catch (e) {
      errors.push(`Gemini/${model}: ${e.message}`);
    }
    return null;
  }

  async function tryAnthropicDirect(key) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'x-api-key': key,
          'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
      const err = await res.json().catch(() => ({}));
      errors.push(`Anthropic: ${err.error?.message || res.status}`);
    } catch (e) {
      errors.push(`Anthropic: ${e.message}`);
    }
    return null;
  }

  async function tryOpenRouter(key, model) {
    try {
      const res = await fetch(OPENROUTER_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://met-proficiency-mastery.netlify.app',
          'X-Title': 'MET Proficiency Mastery',
        },
        body: JSON.stringify({
          model, temperature, max_tokens,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || '';
        if (text) return { content: [{ text }] };
        errors.push(`OpenRouter/${model}: empty response`);
      } else {
        const err = await res.json().catch(() => ({}));
        errors.push(`OpenRouter/${model}: ${err.error?.message || res.status}`);
      }
    } catch (e) {
      errors.push(`OpenRouter/${model}: ${e.message}`);
    }
    return null;
  }

  async function tryOpenAI(key) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: OPENAI_MODEL, temperature, max_completion_tokens: max_tokens,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { content: [{ text: data?.choices?.[0]?.message?.content || '' }] };
      }
      const err = await res.json().catch(() => ({}));
      errors.push(`OpenAI: ${err.error?.message || res.status}`);
    } catch (e) {
      errors.push(`OpenAI: ${e.message}`);
    }
    return null;
  }

  function withTimeout(fn, ms = 10000) {
    return () => Promise.race([
      fn(),
      new Promise(resolve => setTimeout(() => {
        errors.push(`Timeout after ${ms / 1000}s`);
        resolve(null);
      }, ms)),
    ]);
  }

  const baseAttempts = [];
  for (const model of (geminiKeys.length ? geminiModels() : [])) {
    geminiKeys.forEach((key, ki) => baseAttempts.push({ id: `gemini:${model}#${ki}`, run: withTimeout(() => tryGemini(key, model)) }));
  }
  for (const model of (openrouterKeys.length ? openRouterModels() : [])) {
    openrouterKeys.forEach((key, ki) => baseAttempts.push({ id: `openrouter:${model}#${ki}`, run: withTimeout(() => tryOpenRouter(key, model)) }));
  }
  if (groqKeys.length) {
    const candidateModels = [
      GROQ_MODEL,
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-3.3-70b-versatile',
      'qwen/qwen3-32b',
      'llama-3.1-8b-instant',
    ].filter(Boolean).filter((m, i, arr) => arr.indexOf(m) === i);
    for (const model of candidateModels) {
      groqKeys.forEach((key, ki) => baseAttempts.push({ id: `groq:${model}#${ki}`, run: withTimeout(() => tryGroq(key, model)) }));
    }
  }
  anthropicKeys.forEach((key, ki) => baseAttempts.push({ id: `anthropic-direct#${ki}`, run: withTimeout(() => tryAnthropicDirect(key)) }));
  openaiKeys.forEach((key, ki) => baseAttempts.push({ id: `openai#${ki}`, run: withTimeout(() => tryOpenAI(key)) }));

  const cooldowns = loadCooldowns();
  const availableAttempts = baseAttempts.filter(a => !cooldowns[attemptProvider(a.id)]);
  const attemptPool = availableAttempts.length ? availableAttempts : baseAttempts;

  const ROUND_ROBIN_LS = 'vv:ai_rr_index';
  let rrIdx = 0;
  try { rrIdx = parseInt(localStorage.getItem(ROUND_ROBIN_LS) || '0', 10) || 0; } catch { /* ignore */ }

  const pivotProviders = ['gemini', 'openrouter', 'groq', 'openai', 'anthropic-direct'];
  const pivotAttempts = attemptPool.filter(a => pivotProviders.some(p => a.id === p || a.id.startsWith(p + ':')));
  const pivotCount = pivotAttempts.length;

  let attempts = attemptPool;
  if (pivotCount > 1) {
    const pivotId = pivotAttempts[rrIdx % pivotCount]?.id;
    const pivotPos = attemptPool.findIndex(a => a.id === pivotId);
    if (pivotPos > 0) attempts = [...attemptPool.slice(pivotPos), ...attemptPool.slice(0, pivotPos)];
    try { localStorage.setItem(ROUND_ROBIN_LS, String((rrIdx + 1) % pivotCount)); } catch { /* ignore */ }
  }

  if (preferredProvider) {
    const preferred = attempts.filter(a => a.id.startsWith(preferredProvider));
    const rest = attempts.filter(a => !a.id.startsWith(preferredProvider));
    if (preferred.length) attempts = [...preferred, ...rest];
  }

  let lastWinner = null;
  try { lastWinner = localStorage.getItem(AI_WINNER_LS); } catch { /* storage unavailable */ }
  if (lastWinner) {
    const winnerMatchesPref = !preferredProvider || lastWinner.startsWith(preferredProvider);
    if (winnerMatchesPref) {
      const idx = attempts.findIndex(a => a.id === lastWinner);
      if (idx > 0) attempts = [attempts[idx], ...attempts.filter((_, i) => i !== idx)];
    }
  }

  for (const attempt of attempts) {
    const beforeErrorCount = errors.length;
    const result = await attempt.run();
    if (result) {
      try { localStorage.setItem(AI_WINNER_LS, attempt.id); } catch { /* storage unavailable */ }
      return result;
    }
    const newErrors = errors.slice(beforeErrorCount);
    if (shouldCooldownProvider(newErrors)) {
      const provider = attemptProvider(attempt.id);
      const nextCooldowns = loadCooldowns();
      nextCooldowns[provider] = Date.now() + AI_COOLDOWN_MS;
      saveCooldowns(nextCooldowns);
    }
  }

  if (errors.length) throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
  throw new Error('No AI provider configured. Add a key (e.g. GEMINI_API_KEY) to your Vercel project env vars, or enter one in Settings.');
}

export async function summarizeTranscript(transcript) {
  if (!transcript || transcript.length < 800) return transcript;
  const prompt = `Condense this class transcript to under 600 words. Keep all student errors, corrections, and notable moments.\n\n${transcript}`;
  const data = await callAI(prompt, { max_tokens: 800 });
  return data.content?.map(b => b.text || '').join('') || transcript;
}
