import { useState } from 'react';

const TEAL = '#148891';
const NAVY = '#0f1b2d';

const SCORE_DESCRIPTORS = [
  { score: 4, label: 'Fully relevant — extensive supporting detail' },
  { score: 3, label: 'Relevant — completes task, general detail only' },
  { score: 2, label: 'Mostly relevant — some difficulty completing task' },
  { score: 1, label: 'Short or simple — difficulty completing task' },
  { score: 0, label: 'No response or completely irrelevant' },
];

const MET_TASK_CONFIG = {
  Q1: {
    label: 'Speaking Q1 — Describe a Picture (60s)',
    structure: 'General scene → people/actions → details → possible inference',
    frames: ['This picture shows…', 'In the foreground, I can see…', 'In the background, there is/are…', 'The people seem to be…', 'It looks like…'],
    checks: [
      'I started with a general description of the scene',
      'I described people, their actions, and objects — not just a list of things',
      'I covered foreground, background, and spatial details',
      'I ended with an inference about the situation ("They might be…")',
    ],
    trap: 'Only listing objects without explaining the situation.',
  },
  Q2: {
    label: 'Speaking Q2 — Personal Experience (60s)',
    structure: 'When/where → what happened → result/feeling',
    frames: ['I remember a time when…', 'This happened when I was…', 'At first…', 'After that…', 'In the end…', 'I felt… because…'],
    checks: [
      'I described a specific experience, not a general habit',
      'I used past tense consistently',
      'I followed the setup → event → result arc',
      'I used narrative connectors (at first, after that, in the end…)',
    ],
    trap: 'Speaking generally instead of telling a specific experience.',
  },
  Q3: {
    label: 'Speaking Q3 — Personal Opinion (60s)',
    structure: 'Opinion → reason 1 → reason 2/example → final comment',
    frames: ['In my opinion…', 'I believe that…', 'The main reason is…', 'Another reason is…', 'For example…', 'That is why I think…'],
    checks: [
      'I stated ONE clear opinion — not both sides',
      'I gave two reasons or one reason and one example',
      'I used informal but committed language ("I believe…", "I think…")',
      'I did NOT give a balanced answer — this task is ONE-SIDED',
    ],
    trap: 'Giving both sides weakens the answer — this is an opinion task, not a discussion.',
  },
  Q4: {
    label: 'Speaking Q4 — Advantages & Disadvantages (90s)',
    structure: 'Introduction → advantages → disadvantages → balanced conclusion',
    frames: ['There are several advantages to this.', 'One benefit is…', 'However, there are also disadvantages.', 'One problem is…', 'On balance, I think…'],
    checks: [
      'I covered BOTH advantages AND disadvantages — covering only one side loses ~1/3 of marks',
      'I gave roughly equal time to each side',
      'I used NEUTRAL register — no personal opinion in this task',
      'I used a clear transition between sides ("However…", "On the other hand…")',
    ],
    trap: 'Covering only one side, or giving a personal opinion — this task requires neutral, balanced coverage.',
  },
  Q5: {
    label: 'Speaking Q5 — Persuade an Authority (90s)',
    structure: 'Recommendation → reasons → benefits → respectful closing',
    frames: ['I strongly believe that…', 'I would recommend…', 'This would be beneficial because…', 'One important reason is…', 'I understand there may be concerns, but…', 'For these reasons, I hope you will consider this.'],
    checks: [
      'I stated my position or recommendation in the FIRST 10–15 seconds',
      'I used FORMAL register throughout — not "I think", but "I strongly believe…"',
      'I addressed the authority figure directly',
      'I maintained commitment — no hedging or giving the other side',
    ],
    trap: 'Sounding informal, not committing to a position, or presenting both sides — this is a persuasion task, not a discussion.',
  },
  W1Q1: {
    label: 'Writing Task 1 — Question 1',
    structure: 'Direct answer → detail → small explanation',
    frames: [],
    checks: [
      'I answered the question directly in my first sentence',
      'I added at least one specific detail or example',
      'I expanded beyond a single short sentence',
      'I used appropriate tense (usually past simple or present simple)',
    ],
    trap: 'Giving only one short sentence with no development.',
  },
  W1Q2: {
    label: 'Writing Task 1 — Question 2',
    structure: 'Answer → reason → support',
    frames: ['Because…', 'Since…', 'For example…', 'However…', 'I prefer…', 'In my opinion…'],
    checks: [
      'I gave a clear reason — not just repeating my Q1 answer',
      'I supported my reason with an example or explanation',
      'I used connectors (because, since, for example, however)',
      'I did NOT simply repeat ideas from Question 1',
    ],
    trap: 'Repeating the same idea from Q1 without expanding it.',
  },
  W1Q3: {
    label: 'Writing Task 1 — Question 3',
    structure: 'Position/idea → explanation → example or consequence',
    frames: ['Should…', 'Would…', 'Could…', 'Might…', 'On the other hand…', 'As a result…'],
    checks: [
      'I extended the topic — gave advice, a comparison, or a future consequence',
      'I used appropriate modal verbs (should, would, could, might)',
      'I organised my ideas clearly',
      'I answered the EXACT question — not a general comment',
    ],
    trap: 'Ending too quickly or not answering the exact question.',
  },
  W2: {
    label: 'Writing Task 2 — Formal Essay',
    structure: 'Introduction → Body ×2 → Conclusion',
    frames: [],
    checks: [
      'I understood the prompt and gave a clear position or main idea in the introduction',
      'Each body paragraph has one main reason + explanation + example or consequence',
      'I used formal or semi-formal language throughout — no informal spoken phrases',
      'My conclusion restates the main idea and adds a final comment',
      'I wrote at least 250 words and used multiple paragraphs',
    ],
    trap: 'Writing one long paragraph, giving opinions without support, or using informal spoken language.',
  },
};

const DEFAULT_CHECKS = [
  'Did I give a clear opinion?',
  'Did I give one reason?',
  'Did I give one example?',
  'Did I finish with a consequence or conclusion?',
];

export default function ShortAnswer({ exercise, onComplete }) {
  const { prompt, rubric, context, imageUrl, imageAlt, metTaskType } = exercise;
  const taskConfig = metTaskType ? MET_TASK_CONFIG[metTaskType] : null;
  const reflectionChecks = taskConfig ? taskConfig.checks : DEFAULT_CHECKS;

  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selfScore, setSelfScore] = useState(null);
  const [checks, setChecks] = useState(Array(reflectionChecks.length).fill(false));

  function handleSubmit() {
    if (!text.trim()) return;
    setSubmitted(true);
    if (onComplete) onComplete({ submitted: true, correct: null });
  }

  function toggleCheck(i) {
    setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  const rubricItems = Array.isArray(rubric) ? rubric : rubric ? [rubric] : [];

  return (
    <div>
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 14, fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      {imageUrl && (
        <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden', background: '#F8FAFC', textAlign: 'center' }}>
          <img src={imageUrl} alt={imageAlt || 'Picture for this task'} style={{ maxWidth: '100%', maxHeight: 360, display: 'block', margin: '0 auto' }} />
        </div>
      )}

      {taskConfig && !submitted && (
        <div style={{ border: '1px solid #BFDBFE', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#1D4ED8', borderRadius: 'var(--radius-sm, 6px) var(--radius-sm, 6px) 0 0' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {taskConfig.label}
            </span>
          </div>

          <div style={{ background: '#EFF6FF', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Best structure
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: '#1E3A5F', fontWeight: 600 }}>{taskConfig.structure}</div>
            </div>

            {taskConfig.frames && taskConfig.frames.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Useful phrases
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {taskConfig.frames.map((f, i) => (
                    <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', background: '#DBEAFE', color: '#1E3A5F', borderRadius: 'var(--radius-sm, 6px)', fontStyle: 'italic' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taskConfig.trap && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm, 6px)' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Common mistake: </span>
                <span style={{ fontSize: 'var(--text-sm)', color: '#7F1D1D' }}>{taskConfig.trap}</span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Task Completion score (0–4)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {SCORE_DESCRIPTORS.map(({ score, label }) => (
                  <div key={score} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 'var(--text-xs)' }}>
                    <span style={{ fontWeight: 700, color: '#1D4ED8', minWidth: 14, flexShrink: 0 }}>{score}</span>
                    <span style={{ color: '#1E3A5F', lineHeight: 1.5 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {rubricItems.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 16 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            What a strong answer includes:
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rubricItems.map((item, i) => (
              <li key={i} style={{ fontSize: 'var(--text-sm)', color: '#065F46', lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: NAVY, marginBottom: 14, lineHeight: 1.6 }}>{prompt}</p>

      <textarea
        value={text}
        onChange={e => !submitted && setText(e.target.value)}
        disabled={submitted}
        rows={6}
        placeholder="Write your answer here…"
        aria-label="Your answer"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm, 6px)',
          border: `1.5px solid ${submitted ? 'var(--border)' : text.trim() ? TEAL : 'var(--border)'}`,
          fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', lineHeight: 1.7,
          resize: 'vertical', outline: 'none', color: 'var(--text)',
          background: submitted ? 'var(--bg)' : '#fff',
          transition: 'border-color 0.15s',
        }}
      />

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          style={{
            marginTop: 10, padding: '10px 24px', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            background: text.trim() ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)',
            opacity: text.trim() ? 1 : 0.5, transition: 'all 0.15s',
          }}
        >
          Submit response
        </button>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.22s ease-out both' }}>
          <div style={{
            borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              padding: '9px 14px', background: NAVY, color: '#fff',
              fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Your answer
            </div>
            <div style={{
              padding: '12px 14px', fontSize: 'var(--text-sm)', lineHeight: 1.7, color: '#374151',
              background: '#F8FAFC', whiteSpace: 'pre-wrap',
            }}>
              {text || '(no response)'}
            </div>
          </div>

          {rubricItems.length > 0 && (
            <div style={{
              borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden',
              border: '1px solid #99F6E4',
            }}>
              <div style={{
                padding: '9px 14px', background: TEAL, color: '#fff',
                fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                What a strong answer includes
              </div>
              <div style={{ padding: '12px 14px', background: '#F0FDFA', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rubricItems.map((item, i) => (
                    <li key={i} style={{ color: '#065F46', lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {exercise.explanation && (
            <div style={{
              padding: '11px 14px', background: '#FFFBEB', borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid #FDE68A', fontSize: 'var(--text-sm)', color: '#92400E', lineHeight: 1.6,
            }}>
              <strong>Why this matters: </strong>
              {exercise.explanation}
            </div>
          )}

          {taskConfig && (
            <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: NAVY, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Score your Task Completion (0–4):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setSelfScore(n)}
                    style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-sm, 6px)',
                      border: `2px solid ${selfScore === n ? TEAL : 'var(--border)'}`,
                      background: selfScore === n ? TEAL : '#fff',
                      color: selfScore === n ? '#fff' : NAVY,
                      fontWeight: 700, fontSize: 'var(--text-base)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {selfScore !== null && (
                <div style={{ marginTop: 10, fontSize: 'var(--text-sm)', color: '#374151', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{selfScore}: </span>
                  {SCORE_DESCRIPTORS.find(d => d.score === selfScore)?.label}
                  {' — '}
                  <span style={{ color: 'var(--muted)' }}>your teacher will compare this to their assessment.</span>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Self-check your answer:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reflectionChecks.map((label, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={() => toggleCheck(i)}
                    style={{ width: 17, height: 17, marginTop: 2, accentColor: TEAL, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: checks[i] ? '#065F46' : 'var(--text)', lineHeight: 1.5, fontWeight: checks[i] ? 600 : 400 }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {checks.every(Boolean) && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#ECFDF5', borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-sm)', color: '#065F46', fontWeight: 600 }}>
                {taskConfig ? 'All task requirements checked — your teacher will review your response.' : 'All criteria met — your teacher will review your response.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
