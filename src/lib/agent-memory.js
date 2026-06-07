/**
 * agent-memory.js — Persistent memory layer for AI diagnostic agents.
 *
 * Reads a student's stored history (past diagnoses, error bank, vocabulary)
 * and formats it as structured text for injection into AI prompts.
 * This gives the diagnostic AI continuity across sessions — it sees prior
 * skill scores, recurring errors, and mastered items before each new diagnosis.
 */

import { getDiagnoses, getErrorBank, getVocabularyBank } from './workflow.js';

/**
 * Returns `{ strengths, errors }` — two formatted strings ready to drop into
 * the `{PREVIOUS_STRENGTHS}` and `{PREVIOUS_ERRORS}` prompt placeholders.
 * Either value is `null` when no history exists yet.
 *
 * @param {string} studentId
 * @param {{ maxDiagnoses?: number }} options
 */
export async function getStudentMemory(studentId, { maxDiagnoses = 3 } = {}) {
  if (!studentId) return { strengths: null, errors: null };

  const [diagnoses, errorBank, vocabBank] = await Promise.all([
    getDiagnoses(studentId),
    getErrorBank(studentId),
    getVocabularyBank(studentId),
  ]);

  const recent = diagnoses.slice(0, maxDiagnoses);

  // ── Strengths ────────────────────────────────────────────────
  const strengthLines = [];

  for (const d of recent) {
    const date = d.createdAt
      ? new Date(d.createdAt).toLocaleDateString('en-GB')
      : 'unknown date';

    // Support both new module format and legacy format
    const dx =
      d.content?.sections?.skillDiagnosis?.content ||
      d.content?.skillDiagnosis ||
      {};
    const priorities =
      d.content?.sections?.priorityDiagnosis?.content ||
      d.content?.priorityDiagnosis ||
      [];
    const snap = d.section_snapshot || [];

    const scores = [];
    for (const skill of ['speaking', 'writing', 'reading', 'listening', 'grammar', 'vocabulary']) {
      const s = dx[skill];
      if (s?.evaluated && s?.score0to80 != null) scores.push(`${skill} ${s.score0to80}`);
    }
    // Fallback to legacy section_snapshot
    if (!scores.length) {
      snap.forEach(s => { if (s?.score_0_80) scores.push(`${s.section} ${s.score_0_80}`); });
    }

    const confirmedStrengths = priorities
      .filter(p => p.urgency === 'Strength')
      .map(p => p.area)
      .slice(0, 2);

    if (scores.length || confirmedStrengths.length) {
      let line = `[${date}]`;
      if (scores.length) line += ` Scores: ${scores.join(', ')}.`;
      if (confirmedStrengths.length) line += ` Strengths: ${confirmedStrengths.join(', ')}.`;
      strengthLines.push(line);
    }
  }

  // Mastered errors signal areas where the student has improved
  const mastered = errorBank.filter(e => e.status === 'solved').slice(0, 5);
  if (mastered.length) {
    strengthLines.push(
      `Mastered errors (no longer active): ${mastered.map(e => `"${e.error}"`).join(', ')}.`
    );
  }

  // ── Errors / gaps ────────────────────────────────────────────
  const errorLines = [];

  const active = errorBank.filter(e => e.status !== 'solved');
  for (const e of active.slice(0, 8)) {
    const rounds = e.practiceCount ? ` (${e.practiceCount} practice rounds)` : '';
    errorLines.push(`- "${e.error}" → "${e.correct}" [${e.type || 'grammar'}${rounds}]`);
  }

  // Active vocabulary targets the student is working on
  const activeVocab = (vocabBank || []).filter(v => v.status === 'active').slice(0, 5);
  if (activeVocab.length) {
    errorLines.push(
      `Active vocabulary targets: ${activeVocab.map(v => v.wordOrPhrase).join(', ')}.`
    );
  }

  // Critical priorities from the last two sessions (for trend detection)
  const recentCritical = [];
  for (const d of recent.slice(0, 2)) {
    const priorities =
      d.content?.sections?.priorityDiagnosis?.content ||
      d.content?.priorityDiagnosis || [];
    priorities
      .filter(p => p.urgency === 'Critical')
      .forEach(p => { if (p.area && !recentCritical.includes(p.area)) recentCritical.push(p.area); });
  }
  if (recentCritical.length) {
    errorLines.push(`Persistent critical issues from prior sessions: ${recentCritical.join(', ')}.`);
  }

  return {
    strengths: strengthLines.length ? strengthLines.join('\n') : null,
    errors: errorLines.length ? errorLines.join('\n') : null,
  };
}
