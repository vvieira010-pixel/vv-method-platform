import { callAI } from '../../components/shared.jsx';
import { parseAiJson } from '../../lib/ai-helpers.js';
import {
  buildSkillDiagnosisPrompt,
  buildCompactSkillDiagnosisPrompt,
} from '../../lib/prompts.js';
import { SKILL_KEYS } from './constants.js';

export function shouldRetryCompact(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('request too large')
    || msg.includes('tokens per minute')
    || msg.includes('tokens per day')
    || msg.includes('rate limit')
    || msg.includes('quota')
    || msg.includes('limit reached');
}

export function friendlyAiError(error) {
  const msg = String(error?.message || error || '');
  if (/quota|rate limit|tokens per day|limit reached/i.test(msg)) {
    return 'Diagnosis failed because the available AI providers are out of quota or rate-limited. The app tried the full diagnosis and a smaller fallback. Wait for quota reset, use a different key, or shorten the transcript/notes.';
  }
  if (/request too large|tokens per minute|too many tokens/i.test(msg)) {
    return 'Diagnosis failed because the class evidence is too long for the available fallback model. Shorten the transcript/notes and try again.';
  }
  if (/failed to fetch/i.test(msg)) {
    return 'Diagnosis failed because one provider could not be reached from the browser. Check the key/provider setup and try again.';
  }
  return `Diagnosis failed: ${msg}`;
}

export function aiText(res) {
  return res?.content?.map(b => b.text || '').join('') || '';
}

export async function generateDiagnosisJson(promptData, setStatus = () => {}) {
  let firstError = null;
  try {
    const raw = await callAI(buildSkillDiagnosisPrompt(promptData), { max_tokens: 6000, preferredProvider: 'gemini' });
    const parsed = normalizeDiagnosisJson(parseAiJson(aiText(raw)), promptData.classEvidence);
    if (hasUsefulDiagnosis(parsed)) return { raw, parsed };
    firstError = new Error('Full diagnosis returned incomplete sections.');
  } catch (e) {
    firstError = e;
  }

  setStatus('Step 1/4 — Retrying with a smaller diagnosis prompt...');
  try {
    const raw = await callAI(buildCompactSkillDiagnosisPrompt(promptData), { max_tokens: 3200, preferredProvider: 'gemini' });
    const parsed = normalizeDiagnosisJson(parseAiJson(aiText(raw)), promptData.classEvidence);
    return { raw, parsed };
  } catch (fallbackError) {
    console.warn('Diagnosis generation failed; full prompt error:', firstError);
    console.warn('Diagnosis compact fallback failed:', fallbackError);
    return { raw: null, parsed: normalizeDiagnosisJson({}, promptData.classEvidence) };
  }
}

export function hasUsefulDiagnosis(parsed) {
  return Boolean(
    parsed?.skillDiagnosis && Object.keys(parsed.skillDiagnosis).length &&
    parsed.classSummary &&
    Array.isArray(parsed.priorityDiagnosis) &&
    parsed.nextClassFocus && Object.keys(parsed.nextClassFocus).length
  );
}

export function normalizeDiagnosisJson(parsed, evidence = {}) {
  const source = parsed?.diagnosis && typeof parsed.diagnosis === 'object' ? parsed.diagnosis : (parsed || {});
  const skillDiagnosis = source.skillDiagnosis && typeof source.skillDiagnosis === 'object'
    ? source.skillDiagnosis
    : {};
  const skillMeta = {
    speaking:     ['evaluatedSpeaking',     'speakingEvidenceCount'],
    writing:      ['evaluatedWriting',      'writingEvidenceCount'],
    reading:      ['evaluatedReading',      'readingEvidenceCount'],
    listening:    ['evaluatedListening',    'listeningEvidenceCount'],
    grammar:      ['evaluatedGrammar',      'grammarEvidenceCount'],
    vocabulary:   ['evaluatedVocabulary',   'vocabularyEvidenceCount'],
    testStrategy: ['evaluatedTestStrategy', 'testStrategyEvidenceCount'],
  };
  const normalizedSkills = {};
  Object.entries(skillMeta).forEach(([skill, [flagKey, countKey]]) => {
    const existing = skillDiagnosis[skill] && typeof skillDiagnosis[skill] === 'object' ? skillDiagnosis[skill] : {};
    const evaluated = Boolean(existing.evaluated ?? evidence?.[flagKey]);
    const evidenceCount = Number(existing.evidenceCount ?? evidence?.[countKey] ?? 0) || 0;
    normalizedSkills[skill] = {
      evaluated,
      evidenceCount,
      score0to80: evaluated ? (existing.score0to80 ?? null) : null,
      scoreConfidenceLevel: evaluated
        ? (existing.scoreConfidenceLevel || 'Limited evidence')
        : 'Not evaluated enough',
      scoreProvisional: existing.scoreProvisional ?? evaluated,
      transcriptOnly: existing.transcriptOnly ?? (skill === 'speaking'),
      strengths: Array.isArray(existing.strengths) ? existing.strengths : [],
      weaknesses: Array.isArray(existing.weaknesses) ? existing.weaknesses : (Array.isArray(existing.mainIssues) ? existing.mainIssues : []),
      mainIssues: Array.isArray(existing.mainIssues) ? existing.mainIssues : [],
      subskillsAssessed: Array.isArray(existing.subskillsAssessed) ? existing.subskillsAssessed : [],
      readinessTowardTarget: existing.readinessTowardTarget || (evaluated ? 'Limited evidence gathered.' : 'Not evaluated yet.'),
      whatToImproveNext: existing.whatToImproveNext || (evaluated ? 'Review the evidence and add a targeted practice step.' : 'Collect more evidence before assigning a focus.'),
      ratingBreakdown: existing.ratingBreakdown,
    };
  });

  const priorities = Array.isArray(source.priorityDiagnosis)
    ? source.priorityDiagnosis
    : Array.isArray(source.priorities)
      ? source.priorities
      : [];
  const firstEvaluatedSkill = Object.entries(normalizedSkills).find(([, data]) => data.evaluated)?.[0] || 'MET skills';

  return {
    skillDiagnosis: normalizedSkills,
    classSummary: source.classSummary || source.summary || `Limited diagnosis generated. The evaluated evidence is available, but the AI response did not produce a full class overview.`,
    priorityDiagnosis: priorities.length ? priorities : [{
      rank: 1,
      urgency: 'Developing',
      area: firstEvaluatedSkill,
      evidence: evidence?.studentTranscript || evidence?.studentAnswer || 'limited evidence',
      whatToImprove: 'Review the evaluated class evidence and choose one focused practice target.',
      howToImprove: 'Use a short MET-style practice task and collect another sample before making a stronger estimate.',
    }],
    targetScoreRelevance: source.targetScoreRelevance && typeof source.targetScoreRelevance === 'object'
      ? source.targetScoreRelevance
      : { gapToTarget: 'Limited evidence.', prioritySkillForTarget: firstEvaluatedSkill, estimatedSessionsToTarget: 'Not enough evidence to estimate.', onTrack: 'Needs more samples.' },
    estimatedOverallScore: source.estimatedOverallScore && typeof source.estimatedOverallScore === 'object'
      ? source.estimatedOverallScore
      : { estimate: 'Not evaluated enough', confidence: 'Limited evidence', note: 'The available response did not provide enough reliable scoring detail.' },
    nextClassFocus: source.nextClassFocus && typeof source.nextClassFocus === 'object'
      ? source.nextClassFocus
      : { primaryFocus: `Collect stronger evidence for ${firstEvaluatedSkill}.`, suggestedActivities: ['Short MET-style production task', 'Error correction from today\'s sample'], warmUp: 'Review one sentence or answer from the last class.', successCriteria: 'Student gives a clearer response with one specific example.' },
    profileUpdateSuggestions: source.profileUpdateSuggestions && typeof source.profileUpdateSuggestions === 'object'
      ? source.profileUpdateSuggestions
      : { progressNote: 'More class evidence is needed before updating the profile.', suggestedLevelChange: 'No change yet.', recurringErrorsToTrack: [], masteredItems: [] },
  };
}

export function normalizeErrorTargets(parsed) {
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  const targetSource = source.vocabGrammarTargets || source.targets || source.languageTargets || {};
  const vocabularyTargets = pickFirstArray(
    targetSource.vocabularyTargets,
    targetSource.vocab,
    targetSource.vocabulary,
    source.vocabularyTargets,
    source.vocab,
    source.vocabulary,
  );
  const grammarTargets = pickFirstArray(
    targetSource.grammarTargets,
    targetSource.grammar,
    targetSource.grammarPoints,
    targetSource.structures,
    source.grammarTargets,
    source.grammar,
    source.grammarPoints,
    source.structures,
  );
  return {
    errorBankSuggestions: pickFirstArray(source.errorBankSuggestions, source.errorBank, source.errors),
    vocabGrammarTargets: { vocabularyTargets, grammarTargets },
  };
}

export function pickFirstArray(...values) {
  return values.find(Array.isArray) || [];
}

export function isSectionEmpty(content) {
  if (content == null) return true;
  if (typeof content === 'string') return content.trim().length === 0;
  if (Array.isArray(content)) return content.length === 0;
  if (typeof content === 'object') {
    const vals = Object.values(content);
    if (vals.length === 0) return true;
    if (vals.every(v => Array.isArray(v))) return vals.every(v => v.length === 0);
  }
  return false;
}

export function tryParseOrString(text) {
  try { return JSON.parse(text); } catch { return text; }
}

export function normalizeEvidenceCounts(evidence) {
  if (!evidence || typeof evidence !== 'object') return evidence;
  const next = { ...evidence };
  SKILL_KEYS.forEach(({ evalKey, countKey }) => {
    if (!countKey) return;
    if (next[evalKey]) next[countKey] = Math.max(1, Number(next[countKey] || 0));
    else next[countKey] = 0;
  });
  return next;
}

export function buildSnapshot(skillDiagnosis) {
  if (!skillDiagnosis || typeof skillDiagnosis !== 'object') return [];
  return Object.entries(skillDiagnosis).map(([skill, data]) => ({
    section: skill.charAt(0).toUpperCase() + skill.slice(1),
    score_0_80: data?.score0to80 ?? 0,
    score_0_4: data?.score0to80 ? Math.round((data.score0to80 / 80) * 4 * 100) / 100 : 0,
    confidence: data?.scoreProvisional ? 'low' : 'medium',
    trend: 'stable',
    strength: data?.strengths?.[0] || '',
    gap: data?.weaknesses?.[0] || '',
    next_step: data?.whatToImproveNext || '',
  }));
}
