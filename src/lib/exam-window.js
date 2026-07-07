export const MODE_BUILDING = 'building';
export const MODE_SPRINT = 'sprint';
export const MODE_NONE = 'none';

const SPRINT_THRESHOLD_DAYS = 28;

export function getExamDate() {
  try { return localStorage.getItem('vv:met_exam_date') || null; }
  catch { return null; }
}

export function getDaysUntilExam() {
  const ds = getExamDate();
  if (!ds) return null;
  const exam = new Date(ds + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((exam - today) / 86400000);
}

export function getExamMode() {
  const days = getDaysUntilExam();
  if (days === null) return MODE_NONE;
  if (days <= SPRINT_THRESHOLD_DAYS) return MODE_SPRINT;
  return MODE_BUILDING;
}

export function getExamModeLabel(mode) {
  return { [MODE_BUILDING]: 'Building Proficiency', [MODE_SPRINT]: 'Exam Sprint', [MODE_NONE]: 'No exam set' }[mode] || 'Unknown';
}

export function getExamModeDescription(mode) {
  return {
    [MODE_BUILDING]: 'Broad skill-building with periodic MET check-ins',
    [MODE_SPRINT]: 'Focused MET preparation with timed practice',
    [MODE_NONE]: 'Set your MET exam date to unlock personalised study modes',
  }[mode] || '';
}
