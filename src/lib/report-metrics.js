// Canonical MET skill set — single source of truth (audit C2). Consumers that
// need an extra bucket derive from this (reports add "Test Strategy", the
// calendar class-focus picker adds "Mixed").
export const MET_SKILLS = ['Grammar', 'Reading', 'Writing', 'Listening', 'Speaking', 'Vocabulary'];
export const REPORT_SKILLS = [...MET_SKILLS, 'Test Strategy'];
export const MIN_READINESS_SKILLS = 4;

export function buildReadinessEvidence(skills, requiredCount = MIN_READINESS_SKILLS) {
  const rows = Array.isArray(skills) ? skills : [];
  const evaluatedSkills = rows.filter(skill => skill?.score != null && Number.isFinite(Number(skill.score)));
  const avg = evaluatedSkills.length >= requiredCount
    ? evaluatedSkills.reduce((sum, skill) => sum + Number(skill.score), 0) / evaluatedSkills.length
    : null;

  return {
    readiness: avg == null ? null : Math.round((avg / 10) * 100),
    evaluatedSkills,
    evaluatedCount: evaluatedSkills.length,
    totalCount: rows.length,
    requiredCount,
  };
}

export function getReadinessDisplay(evidence) {
  if (!evidence || evidence.readiness == null) {
    const evaluated = evidence?.evaluatedCount ?? 0;
    const total = evidence?.totalCount ?? REPORT_SKILLS.length;
    const required = evidence?.requiredCount ?? MIN_READINESS_SKILLS;
    return {
      value: 'Not enough',
      sub: `${evaluated}/${total} skills evaluated. Need ${required} for an overall readiness signal.`,
      label: 'Coverage needed',
      tone: 'muted',
    };
  }

  return {
    value: `${evidence.readiness}%`,
    sub: `${evidence.evaluatedCount}/${evidence.totalCount} skills evaluated`,
    label: 'Evidence-based MET readiness',
    tone: evidence.readiness >= 70 ? 'success' : evidence.readiness >= 45 ? 'warning' : 'danger',
  };
}

export function buildSkillsFromDiagnosis(diagnosis, skillNames = REPORT_SKILLS) {
  const snapshot = Array.isArray(diagnosis?.content?.section_snapshot)
    ? diagnosis.content.section_snapshot
    : [];

  return skillNames.map(name => {
    const found = snapshot.find(skill => String(skill?.section || '').toLowerCase() === name.toLowerCase());
    const score4 = Number(found?.score_0_4);
    const score80 = Number(found?.score_0_80);
    const evidenceCount = Number(found?.evidenceCount || found?.turnsEvaluated || 0);
    const hasScore = Number.isFinite(score4) && score4 > 0;
    const hasEvidence = evidenceCount > 0 || score80 > 0;

    return {
      name,
      score: hasScore ? Math.round((score4 / 4) * 10 * 10) / 10 : null,
      status: hasScore ? 'Evaluated' : hasEvidence ? 'Not enough evidence' : 'Not evaluated yet',
    };
  });
}

export function buildExerciseMix(homework) {
  const map = new Map();

  (Array.isArray(homework) ? homework : []).forEach((item) => {
    const type = item?.type || item?.skillType || 'General';
    if (!map.has(type)) {
      map.set(type, { type, count: 0, submitted: 0, reviewed: 0 });
    }
    const row = map.get(type);
    row.count += 1;
    if (['submitted', 'reviewed', 'corrected', 'completed'].includes(item?.status)) row.submitted += 1;
    if (['reviewed', 'corrected', 'completed'].includes(item?.status)) row.reviewed += 1;
  });

  return Array.from(map.values())
    .map(row => ({
      ...row,
      submittedRate: row.count > 0 ? Math.round((row.submitted / row.count) * 100) : 0,
      reviewedRate: row.count > 0 ? Math.round((row.reviewed / row.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
