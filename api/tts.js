/**
 * api/tts.js — Vercel serverless TTS proxy for Deepgram.
 */

const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const { text, voice = 'aura-asteria-en' } = body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: { message: 'Missing "text"' } });
  }

  const apiKey = env('DEEPGRAM_API_KEY');
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'DEEPGRAM_API_KEY is not configured on the server.' } });
  }

  try {
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: { message: errorData.message || 'Deepgram request failed.' } });
    }

    const buffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');

    return res.status(200).json({ audioB64: `data:audio/mp3;base64,${base64Audio}` });
  } catch (error) {
    return res.status(500).json({ error: { message: error.message || 'TTS request failed.' } });
  }
}
