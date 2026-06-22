/**
 * parser.js — SKILL.md file parser.
 * Takes raw markdown content (as imported via Vite ?raw) and extracts
 * YAML frontmatter + prompt section into structured objects.
 */

function parseYaml(lines) {
  const obj = {};
  for (const line of lines) {
    const m = line.match(/^(\w[\w_-]*):\s*(.*)/);
    if (!m) continue;
    let val = m[2].trim();
    if (/^['"]/.test(val)) val = val.replace(/^['"]|['"]$/g, '');
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    obj[m[1]] = val;
  }
  return obj;
}

function parseListField(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw.replace(/'/g, '"')); } catch { return []; }
}

export function parseSkillMd(rawText) {
  const trimmed = rawText.trimStart();

  const fmMatch = trimmed.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!fmMatch) return null;
  const fmLines = fmMatch[1].split('\n');
  const yaml = parseYaml(fmLines);

  const body = trimmed.slice(fmMatch[0].length);

  const promptMatch = body.match(/## Prompt\s*\n([\s\S]*?)(?=\n## |$)/);
  const promptText = promptMatch ? promptMatch[1].trim() : '';

  const exampleMatch = body.match(/## Example Output\s*\n([\s\S]*?)(?=\n## |$)/);
  const exampleText = exampleMatch ? exampleMatch[1].trim() : '';

  const limitationsMatch = body.match(/## Known Limitations\s*\n([\s\S]*?)(?=\n## |$)/);
  const limitationsText = limitationsMatch ? limitationsMatch[1].trim() : '';

  const descriptionMatch = body.match(/## What This Skill Does\s*\n([\s\S]*?)(?=\n## |$)/);
  const descriptionText = descriptionMatch ? descriptionMatch[1].trim() : '';

  return {
    id: yaml.skill_id || yaml.name || 'unknown',
    name: yaml.skill_name || yaml.name || 'Unknown',
    domain: yaml.domain || '',
    description: yaml.description || descriptionText,
    tags: parseListField(yaml.tags),
    evidenceSources: parseListField(yaml.evidence_sources),
    chainsWellWith: parseListField(yaml.chains_well_with),
    inputSchema: yaml.input_schema || {},
    version: yaml.version || '1.0',
    effort: yaml.effort || 'medium',
    body,
    prompt: promptText,
    exampleOutput: exampleText,
    knownLimitations: limitationsText,
    whatItDoes: descriptionText,
    teacherTime: yaml.teacher_time || '',
  };
}
