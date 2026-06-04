/**
 * Netlify Function: /api/anthropic
 * Server-side proxy to the Anthropic Messages API so the production build
 * never ships the API key to the browser. Set ANTHROPIC_API_KEY (and
 * optionally ANTHROPIC_MODEL) in the Netlify site environment variables.
 */
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 404, body: JSON.stringify({ message: 'ANTHROPIC_API_KEY is not configured.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON body.' }) };
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || body.model || 'claude-sonnet-4-6',
        max_tokens: body.max_tokens || 2048,
        ...(typeof body.temperature === 'number' ? { temperature: body.temperature } : {}),
        system: body.system || 'You are a helpful MET English teaching assistant.',
        messages: body.messages,
      }),
    });
    const text = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error?.message || 'Anthropic request failed.' }) };
  }
}
