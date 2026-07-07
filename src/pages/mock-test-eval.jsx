import { useState, useEffect, useRef, useCallback } from 'react';
import { callAI } from '../lib/callAI.js';
import { READING_PART1, READING_PART2, READING_PART3 } from '../data/mock-test-1/reading.js';
import { LISTENING_PART1, LISTENING_PART2, LISTENING_PART3 } from '../data/mock-test-1/listening.js';
import { SPEAKING_TASKS } from '../data/mock-test-1/speaking.js';
import { WRITING_TASKS } from '../data/mock-test-1/writing.js';
import { getPoints } from '../data/mock-test-1/index.js';

const SECTIONS = [
  { id: 'reading', label: 'Reading & Grammar', color: '#148891' },
  { id: 'listening', label: 'Listening', color: '#c86607' },
  { id: 'speaking', label: 'Speaking', color: '#7c3aed' },
  { id: 'writing', label: 'Writing', color: '#2563eb' },
];

function flattenQuestions(sectionId) {
  if (sectionId === 'reading') {
    const parts = [];
    parts.push({ part: 'Part 1 — Grammar', questions: READING_PART1.questions, data: READING_PART1 });
    READING_PART2.passages.forEach((p, _i) => {
      parts.push({ part: `Part 2 — ${p.title}`, questions: p.questions, data: { passage: p.text, title: p.title } });
    });
    READING_PART3.textSets.forEach((ts, _i) => {
      parts.push({ part: `Part 3 — ${ts.title}`, questions: ts.questions, data: { texts: ts.texts, title: ts.title } });
    });
    return parts;
  }
  if (sectionId === 'listening') {
    const parts = [];
    parts.push({ part: 'Part 1 — Short Conversations', questions: LISTENING_PART1.questions, data: LISTENING_PART1 });
    LISTENING_PART2.conversations.forEach((c, _i) => {
      parts.push({ part: `Part 2 — ${c.title}`, questions: c.questions, data: { audio: c.audio, title: c.title } });
    });
    LISTENING_PART3.talks.forEach((t, _i) => {
      parts.push({ part: `Part 3 — ${t.title}`, questions: t.questions, data: { audio: t.audio, title: t.title } });
    });
    return parts;
  }
  if (sectionId === 'speaking') {
    return SPEAKING_TASKS.map(t => ({
      part: `Task ${t.id} — ${t.label.replace(/^Task \d+ — /, '')}`,
      questions: [t],
      data: t,
    }));
  }
  if (sectionId === 'writing') {
    const parts = [];
    parts.push({ part: WRITING_TASKS.task1.label, questions: WRITING_TASKS.task1.questions.map(q => ({ ...q, instruction: WRITING_TASKS.task1.instructions })), data: WRITING_TASKS.task1 });
    parts.push({ part: WRITING_TASKS.task2.label, questions: [{ id: 'w4', prompt: WRITING_TASKS.task2.prompt, instruction: WRITING_TASKS.task2.instructions, rows: WRITING_TASKS.task2.rows }], data: WRITING_TASKS.task2 });
    return parts;
  }
  return [];
}

function buildQuestionText(q) {
  if (q.text) return q.text;
  if (q.prompt) return q.prompt;
  if (q.id?.startsWith('w')) return q.prompt || q.text || '';
  return '';
}

function buildEvalPrompt(sectionId, q, context) {
  const pts = sectionId === 'reading' || sectionId === 'listening' ? getPoints(q.type, q.level) : '—';
  const answerLabel = q.answer !== undefined ? String.fromCharCode(65 + q.answer) : '—';
  const correctText = q.options?.[q.answer] || '—';

  const parts = [
    `You are a MET assessment expert. Analyze this ${sectionId} test question for a teacher to discuss in class.`,
    '',
    `## Question Metadata`,
    `- ID: ${q.id}`,
    q.type ? `- Type: ${q.type}` : null,
    q.level ? `- Level: ${q.level}` : null,
    pts !== '—' ? `- Points: ${pts}` : null,
    q.options ? `- Correct answer: ${answerLabel}. ${correctText}` : null,
    '',
    q.options ? `## Options\n${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}` : null,
    '',
    context || '',
    '',
    `## Required Analysis`,
    `1. **What it tests** — What specific skill, concept, or ability does this question measure?`,
    q.type === 'grammar' ? `2. **Grammar concept** — Which grammatical structure is being tested? Is this B1 or B2 appropriate?` : null,
    q.type === 'main_idea' ? `2. **Gist identification** — How does this test the ability to identify main ideas vs. supporting details?` : null,
    q.type === 'detail' ? `2. **Detail retrieval** — Is this a straightforward retrieval or does it require careful reading/listening?` : null,
    q.type === 'inference' ? `2. **Inference demand** — What must the student infer? Is this genuinely inferential or could a student answer from surface-level comprehension?` : null,
    q.options ? `3. **Distractor quality** — Rate each distractor: (a) plausible but wrong, (b) too easy to eliminate, (c) ambiguous or problematic.` : null,
    q.options ? `4. **Distractor analysis table** — Create a table with columns: Option | Label (Plausible/Too Easy/Ambiguous) | Why` : null,
    q.options ? `5. **Correct answer justification** — Why is ${answerLabel} correct? What reasoning should a student use to arrive at the right answer?` : null,
    `6. **Difficulty assessment** — Is this question appropriately leveled? Would you classify it as B1, B2, or C1? Why?`,
    `7. **Classroom discussion point** — What would be an interesting question to ask students about this item in class?`,
    `8. **Common misconception** — What error might students make on this question? What would lead them to pick a wrong distractor?`,
  ].filter(Boolean);

  return parts.join('\n');
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0', color: 'var(--text-muted)' }}>
      <span className="spinner" />
      <span>Generating evaluation...</span>
    </div>
  );
}

function TypeBadge({ type, level }) {
  const typeColors = {
    grammar: '#6366f1',
    main_idea: '#0891b2',
    detail: '#7c3aed',
    inference: '#dc2626',
  };
  const levelColors = { b1: '#16a34a', b2: '#c86607' };
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {type && (
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
          padding: '1px 7px', borderRadius: 99, background: `${typeColors[type] || '#888'}1a`,
          color: typeColors[type] || '#888', border: `1px solid ${typeColors[type] || '#888'}33`,
        }}>{type}</span>
      )}
      {level && (
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
          padding: '1px 7px', borderRadius: 99, background: `${levelColors[level] || '#888'}1a`,
          color: levelColors[level] || '#888', border: `1px solid ${levelColors[level] || '#888'}33`,
        }}>{level}</span>
      )}
    </span>
  );
}

function renderContent(data) {
  if (!data) return null;
  const text = typeof data === 'string' ? data : data.text || data.content?.[0]?.text || '';

  const lines = text.split('\n').filter(l => l.trim());
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (/^\*\*/.test(line) || /^\d+\./.test(line) || /^###/.test(line)) {
      if (current) sections.push(current);
      current = { heading: line.replace(/^\*+|\*+$/g, '').replace(/^###\s*/, '').trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      sections.push({ heading: '', body: [line] });
    }
  }
  if (current) sections.push(current);

  return (
    <div style={{ lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
      {sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          {s.heading && (
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text)' }}>{s.heading}</h4>
          )}
          {s.body.map((b, j) => {
            if (b.startsWith('|') && b.endsWith('|')) {
              return <code key={j} style={{ display: 'block', fontSize: 11, whiteSpace: 'pre', overflow: 'auto', padding: '2px 0' }}>{b}</code>;
            }
            return <p key={j} style={{ margin: '2px 0' }}>{b}</p>;
          })}
        </div>
      ))}
    </div>
  );
}

export default function MockTestEvalPage() {
  const [activeSection, setActiveSection] = useState('reading');
  const [selectedId, setSelectedId] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const evalRef = useRef(null);
  const parts = flattenQuestions(activeSection);

  useEffect(() => {
    setSelectedId(null);
    setEvaluations({});
  }, [activeSection]);

  useEffect(() => {
    if (evalRef.current) {
      evalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [evaluations]);

  const handleSelect = useCallback(async (q) => {
    setSelectedId(q.id);
    if (evaluations[q.id]) return;

    setLoadingId(q.id);

    let context = '';
    if (activeSection === 'reading') {
      for (const part of flattenQuestions('reading')) {
        const found = part.questions.find(x => x.id === q.id);
        if (found && part.data?.passage) {
          context = `## Context Passage\n> ${part.data.passage}`;
        } else if (found && part.data?.texts) {
          context = `## Context Texts\n${part.data.texts.map(t => `> **${t.label}:** ${t.title}\n> ${t.text}`).join('\n\n')}`;
        }
      }
    }
    if (activeSection === 'listening') {
      for (const part of flattenQuestions('listening')) {
        const found = part.questions.find(x => x.id === q.id);
        if (found && part.data?.audio) {
          context = `- Audio source: ${part.data.audio}\n- This is part of "${part.data.title}"`;
        }
      }
    }
    if (activeSection === 'speaking') {
      context = `- Preparation time: ${q.prepSeconds}s\n- Speaking time: ${q.speakSeconds}s\n- Task type: ${q.type}\n- Part: ${q.part}`;
    }
    if (activeSection === 'writing') {
      context = q.instruction ? `- Instructions: ${q.instruction}` : '';
    }

    const prompt = buildEvalPrompt(activeSection, q, context);
    const system = `You are a MET (Michigan English Test) assessment specialist and teacher trainer. Your task is to analyze individual test questions for a teacher who will discuss them in class. Be specific, reference the actual content of the question, and avoid generic statements. Write in clear, professional English. Format the response with markdown section headers (no code blocks — just plain markdown). Include a distractor analysis table where applicable. Keep it under 500 words.`;

    try {
      const result = await callAI(prompt, { system, temperature: 0.4, max_tokens: 2048 });
      const text = result?.content?.[0]?.text || result?.text || '';
      setEvaluations(prev => ({ ...prev, [q.id]: text }));
    } catch (err) {
      setEvaluations(prev => ({ ...prev, [q.id]: `⚠️ Evaluation failed: ${err.message}` }));
    }
    setLoadingId(null);
  }, [activeSection, evaluations]);

  const totalQuestions = parts.reduce((sum, p) => sum + p.questions.length, 0);
  const evaluatedCount = Object.keys(evaluations).length;

  return (
    <div className="mte-page">
      <style>{`
        .mte-page {
          padding: var(--space-4);
          max-width: 1280px;
          margin: 0 auto;
        }
        .mte-header {
          margin-bottom: var(--space-4);
        }
        .mte-header h1 {
          font-size: var(--text-2xl);
          font-weight: 800;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .mte-header p {
          margin: 0;
          color: var(--text-muted);
          font-size: var(--text-sm);
        }
        .mte-section-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }
        .mte-section-tab {
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: 600;
           transition: background-color, border-color, color, opacity, transform 0.15s;
        }
        .mte-section-tab:hover {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        .mte-section-tab--active {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .mte-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          align-items: start;
        }
        .mte-questions-panel {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
          overflow: hidden;
        }
        .mte-panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mte-eval-panel {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
          overflow: hidden;
          position: sticky;
          top: var(--space-4);
        }
        .mte-eval-empty {
          padding: 40px 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: var(--text-sm);
        }
        .mte-eval-empty-icon {
          font-size: 2rem;
          margin-bottom: 8px;
          opacity: 0.4;
        }
        .mte-eval-content {
          padding: 16px 20px;
          max-height: 70vh;
          overflow-y: auto;
        }
        .mte-part-group {
          border-bottom: 1px solid var(--border);
        }
        .mte-part-group:last-child {
          border-bottom: none;
        }
        .mte-part-header {
          padding: 10px 16px;
          font-size: var(--text-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          background: var(--bg);
          border-bottom: 1px solid var(--border);
        }
        .mte-question-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid var(--border);
        }
        .mte-question-row:last-child {
          border-bottom: none;
        }
        .mte-question-row:hover {
          background: var(--accent-subtle);
        }
        .mte-question-row--selected {
          background: var(--accent-subtle);
           border: 1px solid var(--accent);
        }
        .mte-question-id {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--text-muted);
          min-width: 44px;
          flex-shrink: 0;
          padding-top: 1px;
        }
        .mte-question-body {
          flex: 1;
          min-width: 0;
        }
        .mte-question-text {
          font-size: var(--text-sm);
          line-height: 1.5;
          color: var(--text);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .mte-question-meta {
          display: flex;
          gap: 6px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .mte-eval-loading {
          padding: 24px;
        }
        .mte-progress {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 400;
        }
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 860px) {
          .mte-layout {
            grid-template-columns: 1fr;
          }
          .mte-eval-panel {
            position: static;
          }
        }
      `}</style>

      <div className="mte-header">
        <h1>Mock Test Question Evaluator</h1>
        <p>Select a question to get AI-powered analysis for classroom discussion</p>
      </div>

      <div className="mte-section-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`mte-section-tab${activeSection === s.id ? ' mte-section-tab--active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mte-layout">
        <div className="mte-questions-panel">
          <div className="mte-panel-header">
            <span>Questions ({totalQuestions})</span>
            <span className="mte-progress">{evaluatedCount} evaluated</span>
          </div>
          {parts.map((group, gi) => (
            <div key={gi} className="mte-part-group">
              <div className="mte-part-header">{group.part}</div>
              {group.questions.map(q => (
                <div
                  key={q.id}
                  className={`mte-question-row${selectedId === q.id ? ' mte-question-row--selected' : ''}`}
                  onClick={() => handleSelect(q)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleSelect(q)}
                >
                  <div className="mte-question-id">{q.id}</div>
                  <div className="mte-question-body">
                    <div className="mte-question-text">{buildQuestionText(q)}</div>
                    <div className="mte-question-meta">
                      <TypeBadge type={q.type} level={q.level} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mte-eval-panel" ref={evalRef}>
          {!selectedId && (
            <div className="mte-eval-empty">
              <div className="mte-eval-empty-icon">🔍</div>
              <div>Select a question to see AI evaluation</div>
            </div>
          )}
          {selectedId && loadingId === selectedId && (
            <div className="mte-eval-loading">
              <LoadingSpinner />
            </div>
          )}
          {selectedId && loadingId !== selectedId && evaluations[selectedId] && (
            <div className="mte-eval-content">
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
                  {selectedId}
                </h3>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>AI · MET Specialist</span>
              </div>
              {renderContent(evaluations[selectedId])}
            </div>
          )}
          {selectedId && loadingId !== selectedId && !evaluations[selectedId] && (
            <div className="mte-eval-loading">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
