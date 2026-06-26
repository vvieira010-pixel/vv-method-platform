const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';

async function fetchT(url, init, ms = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { description } = body || {};
  if (!description || typeof description !== 'string') return res.status(400).json({ error: 'Missing "description"' });

  const apiKey = env('GEMINI_API_KEY');
  if (!apiKey) return res.status(503).json({ error: 'No Gemini API key configured on the server.' });

  const imagenPrompt = `Create a simple, clean illustration in landscape orientation for an English exam preparation exercise. The illustration should be easy to understand and appropriate for adult learners in a healthcare or professional context. ${description}`;

  try {
    const r = await fetchT(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instances: [{ prompt: imagenPrompt }], parameters: { sampleCount: 1 } }) }
    );

    if (r.ok) {
      const data = await r.json();
      const pred = data?.predictions?.[0];
      if (pred?.bytesBase64Encoded) return res.status(200).json({ base64: pred.bytesBase64Encoded, mimeType: pred.mimeType || 'image/png' });
    }

    const errText = await r.text().catch(() => '');
    return res.status(502).json({ error: `Imagen 3 failed (${r.status}): ${errText}` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
