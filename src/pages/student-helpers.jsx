export const PROGRESS_STAGES = [
  { label: 'Starting', order: 1, min: 1 },
  { label: 'Building', order: 2, min: 17 },
  { label: 'Developing', order: 3, min: 33 },
  { label: 'Improving', order: 4, min: 49 },
  { label: 'Ready for Mock Practice', order: 5, min: 65 },
];

export const STAGE_DESCRIPTIONS = {
  'Starting': 'You are building familiarity with the MET task types. Focus on understanding what each section asks.',
  'Building': 'You can attempt tasks with guidance. Your answers show basic structure and relevant content.',
  'Developing': 'You complete tasks more consistently. Your control over grammar and vocabulary is growing.',
  'Improving': 'You perform well in most conditions. You are close to B2 level in this skill area.',
  'Ready for Mock Practice': 'You handle this skill under timed conditions — you are at B2 level and ready to practise the full MET format.',
};

export const MET_CONCEPT_GLOSSARY = {
  'task completion': 'Answering the actual task — all required parts, with enough supporting detail.',
  'register': 'The level of formality — formal for authority figures (Q5), neutral for pros/cons (Q4).',
  'cohesion': 'How well your ideas connect using linking words (however, therefore, as a result).',
  'intelligibility': 'How clearly a listener can understand you — independent of grammar or vocabulary.',
  'fluency': 'Smooth delivery without long pauses or frequent restarts.',
  'task relevance': 'Staying on topic throughout — not drifting from what the task asked for.',
  'supporting detail': 'The specific example or reason that backs up your main point.',
  'distractor': 'An answer choice that sounds right because of familiar words but is actually wrong.',
  'inference': 'Reading or listening for meaning that is implied but not directly stated.',
  'speaker purpose': 'Why the speaker said something — their intent, not just the topic.',
  'collocations': 'Words that naturally go together in English (e.g. "make a decision", not "do a decision").',
  'connector': 'A word or phrase that links ideas (e.g. although, therefore, in contrast).',
};

export const asArray = (v) => (Array.isArray(v) ? v : []);

export function getProgressStage(score) {
  const value = Number(score) || 0;
  if (value <= 0) return { label: 'Not evaluated enough', order: 0, min: 0 };
  return [...PROGRESS_STAGES].reverse().find(stage => value >= stage.min) || PROGRESS_STAGES[0];
}

export function getSkillTrend(section, diagnoses) {
  const scores = asArray(diagnoses)
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map(d => asArray(d.content?.section_snapshot).find(s => s.section === section))
    .map(s => Number(s?.score_0_80) || 0)
    .filter(v => v > 0);
  if (scores.length === 0) return { dir: 'none', label: 'Not evaluated yet', evaluations: 0 };
  if (scores.length === 1) return { dir: 'new', label: 'Evaluated once', evaluations: 1 };
  const delta = scores[0] - scores[1];
  const nowStage = getProgressStage(scores[0]).order;
  const prevStage = getProgressStage(scores[1]).order;
  if (nowStage > prevStage) return { dir: 'up', label: 'Moved up a stage', evaluations: scores.length };
  if (nowStage < prevStage) return { dir: 'down', label: 'Practice focus', evaluations: scores.length };
  if (delta > 3) return { dir: 'up', label: 'Moving up', evaluations: scores.length };
  if (delta < -3) return { dir: 'down', label: 'Needs attention', evaluations: scores.length };
  return { dir: 'steady', label: 'Holding steady', evaluations: scores.length };
}

export function getRelevantGlossaryTerms(feedbackText) {
  if (!feedbackText) return [];
  const lower = feedbackText.toLowerCase();
  return Object.entries(MET_CONCEPT_GLOSSARY)
    .filter(([term]) => lower.includes(term))
    .map(([term, definition]) => ({ term, definition }));
}

export function TrendChip({ trend }) {
  if (!trend || trend.dir === 'none') return null;
  const glyph = { up: '\u2191', down: '\u2193', steady: '\u2192', new: '\u2022' }[trend.dir] || '\u2022';
  return <span className={`student-trend-chip student-trend-chip--${trend.dir}`}><span aria-hidden="true">{glyph}</span> {trend.label}</span>;
}

export function SkillRow({ skill, trend, onClick }) {
  const score = Number(skill.score_0_80) || 0;
  const stage = score > 0 ? getProgressStage(score) : PROGRESS_STAGES[0];
  return (
    <button type="button" className="student-skill-row" onClick={onClick}>
      <div className="student-skill-top">
        <strong style={{ textTransform: 'capitalize' }}>{skill.section}</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {score > 0 && <span className="student-skill-score">{score}/80</span>}
          <span className="student-skill-stage">{stage.label}</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, margin: '6px 0' }} aria-label={`${skill.section}: ${stage.label}`}>
        {PROGRESS_STAGES.map(st => (
          <span key={st.label} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: st.order <= stage.order ? 'var(--accent)' : 'var(--border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <TrendChip trend={trend} />
    </button>
  );
}

export function hasVisibleApprovedStudentFeedback(dx) {
  const feedback = dx?.sections?.studentFeedback;
  return dx?.status === 'approved' && feedback?.approved === true && feedback.hidden !== true;
}

export function exerciseSearchText(ex) {
  return [ex.question, ex.template, ex.prompt, ex.content, ex.errorText, ex.correctedText,
    ...asArray(ex.options), ...asArray(ex.sentences)]
    .filter(Boolean).join(' ').toLowerCase();
}
