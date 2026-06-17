export function parseAiJson(text) {
  if (!text || typeof text !== 'string') return {};
  const s = text.trim();
  try { return JSON.parse(s); } catch {}
  const mc = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mc) try { return JSON.parse(mc[1].trim()); } catch {}
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) try { return JSON.parse(s.slice(start, end + 1)); } catch {}
  const arrStart = s.indexOf('[');
  const arrEnd = s.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) try { return JSON.parse(s.slice(arrStart, arrEnd + 1)); } catch {}
  return {};
}
