/**
 * ai-helpers.js — Shared AI response parsing utilities.
 * Extracted from tool-diagnostic.jsx and tool-feedback.jsx to avoid duplication.
 */

export function parseAiJson(raw) {
  let text = String(raw || "").replace(/```json|```/gi, "").trim();
  const objStart = text.indexOf("{");
  const arrStart = text.indexOf("[");
  const hasObj = objStart >= 0;
  const hasArr = arrStart >= 0;
  const start = hasObj && hasArr ? Math.min(objStart, arrStart) : hasObj ? objStart : arrStart;
  if (start >= 0) text = text.slice(start);

  try {
    return JSON.parse(text);
  } catch {
    const balanced = extractBalancedJson(text);
    if (balanced) {
      try { return JSON.parse(balanced); } catch {}
    }

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

function extractBalancedJson(text) {
  if (!text) return null;
  const first = text[0];
  if (first !== "{" && first !== "[") return null;

  const stack = [first];
  let inString = false;
  let escape = false;

  for (let i = 1; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (c === "{" || c === "[") stack.push(c);
    if (c === "}" || c === "]") {
      const last = stack[stack.length - 1];
      if ((c === "}" && last === "{") || (c === "]" && last === "[")) {
        stack.pop();
      }
      if (stack.length === 0) return text.slice(0, i + 1);
    }
  }

  return null;
}
