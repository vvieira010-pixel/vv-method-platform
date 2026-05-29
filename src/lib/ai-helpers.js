/**
 * ai-helpers.js — Shared AI response parsing utilities.
 * Extracted from tool-diagnostic.jsx and tool-feedback.jsx to avoid duplication.
 */

export function parseAiJson(raw) {
  let text = String(raw || "").replace(/```json|```/gi, "").trim();
  const start = text.indexOf("{");
  if (start >= 0) text = text.slice(start);

  try {
    return JSON.parse(text);
  } catch {
    let openBraces = 0, openBrackets = 0, inString = false, escape = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (!inString) {
        if (c === '{') openBraces++;
        if (c === '}') openBraces--;
        if (c === '[') openBrackets++;
        if (c === ']') openBrackets--;
      }
    }

    let fixed = text;
    if (inString) fixed += '"';
    fixed = fixed.replace(/,\s*$/, "");
    for (let i = 0; i < openBrackets; i++) fixed += ']';
    for (let i = 0; i < openBraces; i++) fixed += '}';

    try { return JSON.parse(fixed); } catch {
      const cleaned = fixed.replace(/,\s*([}\]])/g, "$1");
      try { return JSON.parse(cleaned); } catch {}
      throw new Error("AI returned invalid JSON. Please retry.");
    }
  }
}
