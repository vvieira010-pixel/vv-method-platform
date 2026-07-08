import { useState } from 'react';
import { Icon, SectionHeader } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

const TABS = [
  { id: 'practice', label: 'Writing Practice' },
  { id: 'topics', label: 'Grammar Topics' },
  { id: 'exercises', label: 'Grammar Exercises' },
];

export default function WritingPracticePage({ onNavigate }) {
  const [tab, setTab] = useState('practice');

  return (
    <div className="page-shell">
      <SectionHeader
        title="MET Writing Practice"
        sub="Practice Task 1 & 2, study B2 grammar topics, or drill with targeted exercises."
      />

      <nav className="tabs-line">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-line${tab === t.id ? ' active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'practice' && <PracticeView />}
      {tab === 'topics' && <TopicsView />}
      {tab === 'exercises' && <ExercisesView />}
    </div>
  );
}

/* ─── Practice View ─────────────────────────────────────────── */

const TAGS = ['45 minutes total', 'Task 1: Short responses', 'Task 2: Opinion essay'];

function PracticeView() {
  return (
    <>
      <section className="hero-writing" style={{
        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white',
        padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)',
      }}>
        <h1 className="hero-writing-title" style={{ margin: '0 0 var(--space-2)', fontSize: '1.75rem' }}>
          MET Writing Practice
        </h1>
        <p style={{ margin: 'var(--space-1) 0', maxWidth: 700 }}>
          Practice the two writing tasks, improve organization, and check your work using the MET writing criteria.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'var(--space-2)' }}>
          {TAGS.map(t => (
            <span key={t} className="pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)' }}>{t}</span>
          ))}
        </div>
      </section>

      <div className="grid-auto-fill-md" style={{ marginBottom: 'var(--space-4)' }}>
        <Card>
          <h2 className="card-row-title">Writing Section Format</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}><strong>Task 1:</strong> Write short answers to 3 related questions about a personal experience, habit, or preference.</li>
            <li style={{ marginBottom: 8 }}><strong>Task 2:</strong> Write a formal multi-paragraph essay expressing and supporting your opinion.</li>
            <li style={{ marginBottom: 8 }}>Use full sentences, clear ideas, and relevant details.</li>
            <li style={{ marginBottom: 8 }}>For a stronger Task 2 response, aim for a clear introduction, body paragraphs, and a brief conclusion.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="card-row-title">Suggested Time Plan</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>Task 1: 10 to 15 minutes.</li>
            <li style={{ marginBottom: 8 }}>Task 2 planning: 5 minutes.</li>
            <li style={{ marginBottom: 8 }}>Task 2 writing: about 25 minutes.</li>
            <li style={{ marginBottom: 8 }}>Final review: 3 to 5 minutes.</li>
          </ul>
          <p className="card-row-meta" style={{ marginTop: 'var(--space-2)' }}>
            A short planning stage helps keep your essay cohesive and well supported.
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="card-row-title">Task 1 Practice</h3>
        <p>Answer each question with specific details. Your first sentence should clearly answer the question.</p>
        <div className="practice-box" style={boxStyle}>
          <h4 style={{ margin: '0 0 8px' }}>Questions</h4>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>What do you like to do in your free time? How often do you do it?</li>
            <li style={{ marginBottom: 8 }}>What do you like about that activity and why?</li>
            <li style={{ marginBottom: 8 }}>Tell about the last time you did this.</li>
          </ol>
        </div>
        <div className="practice-box" style={{ ...boxStyle, marginTop: 'var(--space-3)' }}>
          <h4 style={{ margin: '0 0 8px' }}>Task 1 Tips</h4>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>Answer exactly what the question asks.</li>
            <li style={{ marginBottom: 6 }}>Add examples and simple supporting detail.</li>
            <li style={{ marginBottom: 6 }}>Use correct punctuation and complete sentences.</li>
            <li style={{ marginBottom: 6 }}>Connect ideas with words like <em>because</em>, <em>and</em>, <em>but</em>, and <em>so</em>.</li>
          </ul>
        </div>
        <textarea className="textarea-writing" placeholder="Write your Task 1 answers here..." style={textareaStyle}></textarea>
      </Card>

      <Card style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="card-row-title">Task 2 Practice</h3>
        <div className="prompt-box" style={promptBoxStyle}>
          <h4 style={{ margin: '0 0 8px' }}>Essay Prompt</h4>
          <p style={{ margin: 0 }}>Some people think that free time is more important than wealth. Others believe making a lot of money is more important. Which is more important to you? Give specific reasons and examples to support your opinion.</p>
        </div>
        <div className="grid-auto-fill-md" style={{ marginTop: 'var(--space-3)' }}>
          <div>
            <h4 style={{ margin: '0 0 8px' }}>Before You Write</h4>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Read the prompt carefully.</li>
              <li style={{ marginBottom: 6 }}>Decide your opinion clearly.</li>
              <li style={{ marginBottom: 6 }}>Brainstorm main ideas and examples.</li>
              <li style={{ marginBottom: 6 }}>List useful vocabulary for the topic.</li>
              <li style={{ marginBottom: 6 }}>Put your ideas in a logical order.</li>
            </ul>
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px' }}>Essay Structure</h4>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}><strong>Introduction:</strong> Rephrase the topic and state your opinion.</li>
              <li style={{ marginBottom: 6 }}><strong>Body 1:</strong> First reason plus examples.</li>
              <li style={{ marginBottom: 6 }}><strong>Body 2:</strong> Second reason plus examples.</li>
              <li style={{ marginBottom: 6 }}><strong>Optional Body 3:</strong> Contrast or extra support.</li>
              <li style={{ marginBottom: 6 }}><strong>Conclusion:</strong> Restate your opinion briefly.</li>
            </ul>
          </div>
        </div>
        <textarea className="textarea-writing" placeholder="Write your Task 2 essay here..." style={textareaStyle}></textarea>
      </Card>

      <Card style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="card-row-title">MET Writing Tips</h3>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 6 }}>The best way to improve writing is to write regularly.</li>
          <li style={{ marginBottom: 6 }}>Do not skip pre-writing. Brainstorm, organize, and choose vocabulary first.</li>
          <li style={{ marginBottom: 6 }}>Each paragraph should focus on one main idea.</li>
          <li style={{ marginBottom: 6 }}>Use supporting examples that clearly match your opinion.</li>
          <li style={{ marginBottom: 6 }}>Leave time to edit grammar, spelling, repetition, and logical flow.</li>
          <li style={{ marginBottom: 6 }}>After feedback, rewrite your text and focus on your weak points.</li>
        </ul>
        <div className="good-badge" style={{
          background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginTop: 'var(--space-3)', fontWeight: 600,
        }}>
          Strong MET writing is clear, organized, relevant, and supported with details.
        </div>
      </Card>

      <Card style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="card-row-title">How Your Writing Is Scored</h3>
        <div className="grid-auto-fill-md" style={{ marginTop: 'var(--space-2)' }}>
          {SCORING_CRITERIA.map(c => (
            <div key={c.title} className="criteria-card" style={{
              background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
            }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)' }}>{c.title}</h4>
              <p className="card-row-meta" style={{ margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="card-row-title">Self-Check</h3>
        <ul className="checklist-writing" style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
          {SELF_CHECK.map(item => (
            <li key={item} style={{ marginBottom: 8, paddingLeft: 24, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--success)' }}>✓</span> {item}
            </li>
          ))}
        </ul>
      </Card>

      <p className="card-row-meta" style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
        MET Writing practice page for classroom or homework use.
      </p>
    </>
  );
}

/* ─── Grammar Topics View ────────────────────────────────────── */

function TopicsView() {
  return (
    <>
      {TOPIC_SECTIONS.map(section => (
        <Card key={section.title} style={{ marginBottom: 'var(--space-4)' }}>
          <h3 className="card-row-title">{section.title}</h3>

          {section.subsections.map(sub => (
            <div key={sub.heading} style={{ marginTop: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 8px', color: 'var(--accent-dark)' }}>{sub.heading}</h4>
              {sub.intro && <p className="card-row-meta" style={{ margin: '0 0 8px' }}>{sub.intro}</p>}

              {sub.structure && (
                <div className="practice-box" style={boxStyle}>
                  <strong>Structure:</strong> {sub.structure}
                </div>
              )}

              {sub.table && (
                <div style={{ overflowX: 'auto', marginTop: 'var(--space-2)' }}>
                  <table className="mini-table" style={{
                    width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)' }}>
                        {sub.table.thead.map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {sub.table.rows.map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                          {row.map((cell, j) => <td key={j} style={tdStyle}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sub.examples && (
                <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                  {sub.examples.map((ex, i) => <li key={i} style={{ marginBottom: 4 }}>{ex}</li>)}
                </ul>
              )}

              {sub.tip && (
                <div className="good-badge" style={{
                  background: 'var(--accent-soft)', color: 'var(--accent-dark)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)',
                  marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)',
                }}>
                  <strong>Tip:</strong> {sub.tip}
                </div>
              )}

              {sub.items && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  {sub.items.map((item, i) => (
                    <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
                      <strong style={{ color: 'var(--accent-dark)' }}>{item.label}</strong>
                      <p className="card-row-meta" style={{ margin: '2px 0 4px' }}>{item.desc}</p>
                      {item.examples && (
                        <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
                          {item.examples.map((ex, j) => <li key={j} style={{ marginBottom: 2, fontSize: 'var(--text-sm)' }}>{ex}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      ))}
    </>
  );
}

/* ─── Grammar Exercises View ─────────────────────────────────── */

function ExercisesView() {
  return (
    <>
      {EXERCISE_SECTIONS.map(section => (
        <Card key={section.title} style={{ marginBottom: 'var(--space-4)' }}>
          <h3 className="card-row-title">{section.title}</h3>

          {section.gapFill && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Gap-Fill</h4>
              <p className="card-row-meta" style={{ margin: '0 0 8px' }}>{section.gapFill.instruction}</p>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {section.gapFill.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {item.sentence.split(/(_{2,})/).map((part, j) =>
                      part.match(/_{2,}/) ? (
                        <span key={j} style={{
                          display: 'inline-block', minWidth: 80, borderBottom: '2px solid var(--accent)',
                          margin: '0 4px',
                        }}>&nbsp;</span>
                      ) : <span key={j}>{part}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {section.transform && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Sentence Transformation</h4>
              <p className="card-row-meta" style={{ margin: '0 0 8px' }}>{section.transform.instruction}</p>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {section.transform.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {item.prompt}
                    <div style={{ color: 'var(--accent-dark)', marginTop: 2 }}>
                      <em>{item.lead}</em>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {section.writing && (
            <div>
              <h4 style={{ margin: '0 0 8px' }}>Short Writing Prompt</h4>
              <p style={{ margin: 0 }}>{section.writing}</p>
              <textarea className="textarea-writing" placeholder="Write your response..." style={textareaStyle}></textarea>
            </div>
          )}

          {section.gapFill2 && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Gap-Fill</h4>
              <p className="card-row-meta" style={{ margin: '0 0 8px' }}>{section.gapFill2.instruction}</p>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {section.gapFill2.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {item.split(/(_{2,})/).map((part, j) =>
                      part.match(/_{2,}/) ? (
                        <span key={j} style={{
                          display: 'inline-block', minWidth: 80, borderBottom: '2px solid var(--accent)',
                          margin: '0 4px',
                        }}>&nbsp;</span>
                      ) : <span key={j}>{part}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {section.gapFillMulti && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Gap-Fill</h4>
              <p className="card-row-meta" style={{ margin: '0 0 8px' }}>{section.gapFillMulti.instruction}</p>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {section.gapFillMulti.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {item.text.split(/(_{2,})/).map((part, j) =>
                      part.match(/_{2,}/) ? (
                        <span key={j} style={{
                          display: 'inline-block', minWidth: 80, borderBottom: '2px solid var(--accent)',
                          margin: '0 4px',
                        }}>&nbsp;</span>
                      ) : <span key={j}>{part}</span>
                    )}
                    <div className="card-row-meta" style={{ fontSize: 'var(--text-xs)' }}>Options: {item.options?.join(', ')}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>
      ))}
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const boxStyle = {
  background: 'var(--bg-subtle)',
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  borderTop: '4px solid var(--accent)',
};

const promptBoxStyle = {
  background: '#fffef7',
  border: '1px solid #f3e8a5',
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
};

const textareaStyle = {
  width: '100%',
  minHeight: 140,
  marginTop: 'var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3)',
  font: 'inherit',
  resize: 'vertical',
  background: 'var(--bg)',
  color: 'var(--text)',
  lineHeight: 1.6,
};

const thStyle = {
  padding: 'var(--space-2) var(--space-3)',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 'var(--text-xs)',
  borderRight: '1px solid var(--border)',
};

const tdStyle = {
  padding: 'var(--space-2) var(--space-3)',
  fontSize: 'var(--text-sm)',
  borderRight: '1px solid var(--border)',
};

/* ─── Data ────────────────────────────────────────────────────── */

const SCORING_CRITERIA = [
  { title: 'Grammatical Accuracy', desc: 'Use correct grammar. Errors should not make meaning difficult to understand.' },
  { title: 'Vocabulary', desc: 'Choose words that fit the topic and context. Better essays use a range of appropriate vocabulary.' },
  { title: 'Mechanics', desc: 'Check sentence boundaries, punctuation, and spelling.' },
  { title: 'Cohesion and Organization', desc: 'Connect ideas clearly with paragraphs and linking words.' },
  { title: 'Task Completion', desc: 'Answer all parts of the prompt and support your ideas with relevant detail.' },
];

const SELF_CHECK = [
  'Did I answer every part of the task?',
  'Did I state my opinion clearly?',
  'Does each paragraph have one main idea?',
  'Did I include specific examples?',
  'Did I use linking words correctly?',
  'Did I check grammar, punctuation, and spelling?',
  'Is my writing easy to follow?',
];

/* ─── Grammar Topics Data ────────────────────────────────────── */

const TOPIC_SECTIONS = [
  {
    title: '1. Mixed Conditionals',
    subsections: [
      {
        heading: 'Type 1: Present Result of a Past Condition',
        intro: 'How a past decision or event has altered your current situation.',
        structure: 'If + Past Perfect (had + V3), Main Clause: Would / Wouldn\'t + Infinitive',
        examples: [
          'If I had accepted the job offer in London last year, I would be living in England right now.',
          'If she hadn\'t missed her flight this morning, she would be presenting at the conference right now.',
          'If they had invested in that startup five years ago, they would be incredibly wealthy today.',
        ],
      },
      {
        heading: 'Type 2: Past Result of a Present or Continuing Condition',
        intro: 'When a permanent characteristic or ongoing situation caused a specific past outcome.',
        structure: 'If + Simple Past, Main Clause: Would have / Wouldn\'t have + V3',
        examples: [
          'If I spoke fluent German, I would have applied for that international position last month.',
          'If they weren\'t so afraid of flying, they would have traveled to Australia for their honeymoon.',
          'If Mark didn\'t have a strict deadline tomorrow, he would have joined us for dinner yesterday evening.',
        ],
      },
      {
        heading: 'Conditional Comparison',
        table: {
          thead: ['Conditional Type', 'If-Clause Tense', 'Main Clause Tense', 'Time Frame', 'Real or Imaginary?'],
          rows: [
            ['Second Conditional', 'Simple Past', 'Would + Infinitive', 'Present / Future', 'Imaginary'],
            ['Third Conditional', 'Past Perfect', 'Would have + V3', 'Past', 'Imaginary'],
            ['Mixed (Type 1)', 'Past Perfect', 'Would + Infinitive', 'Past Condition → Present Result', 'Imaginary'],
            ['Mixed (Type 2)', 'Simple Past', 'Would have + V3', 'Present Condition → Past Result', 'Imaginary'],
          ],
        },
        tip: 'Swap would for could or might to express ability or probability instead of certainty. Example: If I had passed that exam, I might be working in management now.',
      },
    ],
  },
  {
    title: '2. Conjunctions',
    subsections: [
      {
        heading: 'Coordinating Conjunctions (FANBOYS)',
        intro: 'Connect words, phrases, or independent clauses of equal rank: For, And, Nor, But, Or, Yet, So.',
        tip: 'Always place a comma before the conjunction when joining two independent clauses.',
        examples: [
          'The marketing team completed the project on time, but the client requested several major revisions.',
          'He decided to enroll in the advanced coding course, for he knew it would boost his career prospects.',
          'The airline canceled our direct flight, so we had to catch an overnight train across the country.',
        ],
      },
      {
        heading: 'Subordinating Conjunctions — Time',
        items: [
          { label: 'while, as soon as, until, once, before', desc: 'Connect timing relationships between clauses.', examples: ['As soon as the contract is signed, we will begin the onboarding process.', 'The team continued brainstorming while the manager was reviewing the quarterly data.'] },
        ],
      },
      {
        heading: 'Subordinating Conjunctions — Reason',
        items: [
          { label: 'because, since, as, seeing that, now that', desc: 'Express cause and effect.', examples: ['Since the budget was cut unexpectedly, we had to cancel the autumn campaign.', 'Now that the renovations are finished, the hotel is ready to welcome guests.'] },
        ],
      },
      {
        heading: 'Subordinating Conjunctions — Contrast',
        items: [
          { label: 'although, even though, whereas, while, despite the fact that', desc: 'Show opposition or unexpected results.', examples: ['Although the initial investment was high, the long-term returns proved substantial.', 'The tech startup grew exponentially, whereas the traditional retail business saw a steady decline.'] },
        ],
      },
      {
        heading: 'Subordinating Conjunctions — Condition',
        items: [
          { label: 'unless, provided that, as long as, assuming that, in case', desc: 'Set conditions for the main clause.', examples: ['We will launch the new software update next Tuesday, provided that the final testing goes smoothly.', 'Unless you register by Friday afternoon, you will not be allowed to attend the seminar.'] },
        ],
      },
      {
        heading: 'B2 Errors to Avoid',
        tip: 'Comma Splice: "The presentation was successful, the client signed the contract." → Use a conjunction or semicolon. Run-on: "I wanted to call you I forgot my phone." → "I wanted to call you, but I forgot my phone."',
      },
    ],
  },
  {
    title: '3. Phrasal Verbs',
    subsections: [
      {
        heading: 'Particle: UP',
        items: [
          { label: 'Bring up', desc: 'To mention or introduce a topic. (Separable) — "She brought up the issue of falling profit margins."' },
          { label: 'End up', desc: 'To eventually reach a state or situation. (Inseparable) — "We ended up eating stale pizza at a gas station."' },
          { label: 'Look up', desc: 'To search for information. (Separable) — "Let me look it up on my phone."' },
        ],
      },
      {
        heading: 'Particle: OUT',
        items: [
          { label: 'Carry out', desc: 'To execute or perform a task. (Separable) — "The technicians will carry out the blood analysis."' },
          { label: 'Figure out', desc: 'To solve or understand. (Separable) — "I\'m trying to figure out how to open this."' },
          { label: 'Point out', desc: 'To draw attention to a fact. (Separable) — "The auditor pointed out several discrepancies."' },
        ],
      },
      {
        heading: 'Particle: OFF',
        items: [
          { label: 'Call off', desc: 'To cancel an event. (Separable) — "The board decided to call off the merger."' },
          { label: 'Put off', desc: 'To postpone. (Separable) — "Stop putting off your dental appointment."' },
          { label: 'Set off', desc: 'To begin a journey. (Inseparable) — "We need to set off early tomorrow."' },
        ],
      },
      {
        heading: 'Particle: ON',
        items: [
          { label: 'Count on', desc: 'To depend on someone. (Inseparable) — "You can count on Sarah to bring dessert."' },
          { label: 'Take on', desc: 'To accept a responsibility. (Separable) — "She took on too much work this semester."' },
          { label: 'Catch on', desc: 'To become popular or finally understand. (Inseparable) — "This trend will catch on quickly."' },
        ],
      },
      {
        heading: 'Particle: DOWN',
        items: [
          { label: 'Turn down', desc: 'To reject an offer. (Separable) — "She turned down the job offer."' },
          { label: 'Settle down', desc: 'To begin a stable life. (Inseparable) — "He wants to buy a house and settle down."' },
          { label: 'Cut down on', desc: 'To reduce consumption. (Inseparable, three-word) — "I need to cut down on fast food."' },
        ],
      },
      {
        heading: 'Phrasal Nouns and Adjectives',
        intro: 'Many phrasal verbs can become single-word nouns or adjectives. Stress shifts to the first syllable.',
        examples: [
          'Breakdown (noun) — "The accounting department provided a thorough breakdown of expenditures."',
          'Grown-up (noun/adj) — "Now that the kids are grown-up, they rarely ask for help."',
          'Workout (noun) — "She finishes an intense gym workout every morning."',
          'Cutback (noun) — "Due to cutbacks, we won\'t be hiring summer interns."',
          'Worn-out (adj) — "He threw away his old, worn-out running shoes."',
        ],
        tip: 'With separable phrasal verbs, if the object is a pronoun (it, them, me), it MUST go between the verb and particle. "Turn it down" (not "turn down it").',
      },
    ],
  },
  {
    title: '4. Nouns, Pronouns and Determiners',
    subsections: [
      {
        heading: 'Nouns — Key Concepts',
        intro: 'Nouns are the largest word class in English. They name people, animals, places, objects, substances, qualities, ideas, and states.',
        table: {
          thead: ['Classification', 'Description', 'Example'],
          rows: [
            ['Countable', 'Can be counted; has singular & plural', 'a car / three cars'],
            ['Uncountable', 'Cannot be counted; no plural form', 'water, information, advice'],
            ['Both (different meanings)', 'Countable and uncountable senses', 'a glass / glass (material)'],
            ['Plural-only', 'Always plural form; uncountable', 'trousers, scissors, glasses'],
            ['Compound', 'Two or more words combined', 'toothpaste, bus stop'],
          ],
        },
      },
      {
        heading: 'Countable Nouns',
        intro: 'Countable nouns refer to things treated as separate items that can be counted. They can be singular or plural, and can be used with a/an and numbers.',
        examples: [
          'She\'s got two sisters and a younger brother.',
          'Most people buy things like cameras and MP3-players online these days.',
          'These shoes look old now.',
          'I\'ll take a few magazines with me for the flight.',
        ],
      },
      {
        heading: 'Uncountable Nouns',
        intro: 'Uncountable nouns refer to things seen as a whole or mass that cannot be separated or counted. They are NOT used with a/an or numbers, and NOT used in the plural.',
        items: [
          { label: 'Ideas and experiences', desc: 'advice, information, progress, news, luck, fun, work' },
          { label: 'Materials and substances', desc: 'water, rice, cement, gold, milk' },
          { label: 'Weather words', desc: 'weather, thunder, lightning, rain, snow' },
          { label: 'Groups / collections', desc: 'furniture, equipment, rubbish, luggage' },
          { label: 'Other common', desc: 'accommodation, baggage, homework, knowledge, money, permission, research, traffic, travel' },
        ],
        tip: 'Some nouns uncountable in English are countable in other languages: accommodation, advice, furniture, information. Avoid "informations" or "a furniture."',
      },
      {
        heading: 'Quantity Expressions with Uncountable Nouns',
        examples: [
          'He bought a very expensive piece of furniture for his new apartment.',
          'Maggie always has some exciting bits of news when she comes to see us.',
          'I think we\'ll need five bags of cement for the patio.',
          'There\'s a litre of milk in the fridge for you.',
        ],
      },
      {
        heading: 'Nouns with Countable and Uncountable Meanings',
        table: {
          thead: ['Countable use', 'Uncountable use'],
          rows: [
            ['We bought a new iron and an ironing board.', 'People believed that ships made of iron would sink.'],
            ['I broke a glass yesterday.', 'The table was made of hardened glass.'],
            ['Would you like a chocolate?', 'Would you like some chocolate?'],
            ['Let\'s get a paper and see what\'s on.', 'The printer has run out of paper.'],
          ],
        },
      },
      {
        heading: 'Pronouns — Types',
        table: {
          thead: ['Type', 'Examples', 'Use'],
          rows: [
            ['Personal', 'I, you, he, she, it, we, they, me, him, her, us, them', 'Refer to specific people or things'],
            ['Possessive', 'my, mine, your, yours, his, her, hers, our, ours, their, theirs', 'Show ownership'],
            ['Reflexive', 'myself, yourself, himself, herself, itself, ourselves, yourselves, themselves', 'Refer back to the subject'],
            ['Indefinite', 'someone, anybody, nothing, everywhere, etc.', 'Refer to non-specific people/things'],
            ['Relative', 'who, whom, whose, which, that', 'Introduce relative clauses'],
            ['Interrogative', 'what, who, whom, whose, which', 'Ask questions'],
            ['Reciprocal', 'each other, one another', 'Express mutual action'],
          ],
        },
      },
      {
        heading: 'Determiners',
        intro: 'Determiners (the, my, this, some, twenty, each, any) are used before nouns to specify the kind of reference a noun has.',
        items: [
          { label: 'Articles', desc: 'a, an, the' },
          { label: 'Demonstratives', desc: 'this, that, these, those' },
          { label: 'Possessives', desc: 'my, your, his, her, its, our, their' },
          { label: 'Quantifiers', desc: '(a) few, some, many, much, (a) little, a lot of' },
          { label: 'Numbers', desc: 'one, two, three; first, second, third' },
        ],
        tip: 'Countable singular nouns usually need a determiner: a book, the book, my book. Uncountable nouns cannot use a/an or numbers but can use the, some, much, a lot of.',
      },
    ],
  },
  {
    title: '5. Politeness',
    subsections: [
      {
        heading: 'Showing Respect',
        intro: 'In formal situations, we use polite phrases and titles to show we value and respect the listener.',
        examples: [
          '"Ladies and gentlemen, please welcome Mr Patrick Murphy…" (addressing an audience)',
          '"May I take your plate, sir?" (waiter in a restaurant)',
          '"Thank you for your wonderful gift." (thank-you card)',
          '"Excuse me, I\'m looking for Cathedral Street." (asking a stranger — not "Where\'s Cathedral Street?")',
        ],
      },
      {
        heading: 'Softening Words (Hedges)',
        intro: 'We use softening words to make what we say less direct and more polite.',
        table: {
          thead: ['Softer (polite)', 'More direct (less polite)'],
          rows: [
            ['It\'s kind of cold in here, isn\'t it? Could we close the window?', 'It\'s cold in here. Let\'s close the window.'],
            ['Could you just turn the radio down a little, please?', 'Turn down the radio.'],
            ['Your playing could possibly be improved. You may need to spend more time working a little bit on the rhythm.', 'You must improve your playing.'],
          ],
        },
      },
      {
        heading: 'Vague Language',
        intro: 'We use vague language to make times and quantities sound less direct and more approximate.',
        examples: [
          '"Any time around eight would be perfect." (instead of "Be there at eight.")',
          '"It\'s about seven o\'clock so I think we should be leaving soon."',
          '"It\'s kind of green and brown, with a few gold buttons on the front."',
        ],
      },
      {
        heading: 'Modal Expressions for Politeness',
        intro: 'Past modal verbs (could, might, should, would) are more polite than their present forms.',
        examples: [
          '"Might I ask if you are related to Mrs Bowdon?" (more polite than "May I ask…")',
          '"Would you follow me, please, sir?" (more polite than "Will you follow me…")',
          '"Would you mind moving your car, please?"',
          '"Could you take a look at my laptop?"',
        ],
      },
      {
        heading: 'Changing Tenses and Verb Forms',
        intro: 'We use past verb forms when referring to present time to be more polite, especially with hope, think, want, wonder.',
        examples: [
          '"I was hoping you had it." (less direct than "I hope you have it.")',
          '"I wanted to ask you a question."',
          '"I was just wondering if you could tell me how to fix it."',
          '"Did you want another coffee?" (in a shop/service context)',
        ],
      },
      {
        heading: 'If and Politeness',
        intro: 'In speaking, we use if + will/would/can/could to introduce polite requests.',
        examples: [
          '"If we can move on to the next point for discussion." (more polite than "Can we move on…")',
          '"If I could just say one more thing…"',
          '"If you will follow me, please." (more polite than "Follow me.")',
          '"If you don\'t mind, I think I need that cup of tea."',
        ],
      },
      {
        heading: 'What Is Impolite?',
        tip: 'The imperative form is very direct and usually impolite outside of family/friends. Instead of "Give me a coffee," say "Could I have a coffee, please?" Instead of "Tell me the time," say "Would you mind telling me the time, please?" Exceptions: warnings ("Mind your step!"), offers ("Have another coffee."), and directions ("Turn left.").',
      },
    ],
  },
  {
    title: '6. However, Whatever, Whichever, Whenever, Wherever, Whoever',
    subsections: [
      {
        heading: 'Meaning: "It doesn\'t matter how, what, when, etc."',
        intro: 'Adding -ever to wh-words changes their meaning to "any at all" or "it doesn\'t matter."',
        table: {
          thead: ['Form', 'Meaning'],
          rows: [
            ['however', 'any way at all / it doesn\'t matter how'],
            ['whatever', 'anything at all / it doesn\'t matter what'],
            ['whichever', 'any one at all / it doesn\'t matter which'],
            ['whenever', 'any time at all / it doesn\'t matter when'],
            ['wherever', 'any place at all / it doesn\'t matter where'],
            ['whoever', 'any person at all / it doesn\'t matter who'],
          ],
        },
        examples: [
          'However you try to explain it, I still can\'t understand it.',
          'Please take whatever you want from the fridge if you feel hungry.',
          'Choose whichever time suits you best.',
          'Call in whenever you like. I\'m always at home.',
          'Wherever you live, you have the right to a good postal service.',
          'Whoever you ask, you will get the same answer: no.',
        ],
      },
      {
        heading: 'Emphasising Questions',
        intro: 'We can use wh-words with -ever to ask very emphatic questions. In speaking, we stress -ever.',
        examples: [
          '"However will you manage to live on such a small income?" (stronger than "How will you manage?")',
          '"Charlie, whatever are you doing?" (stronger than "What are you doing?")',
          '"Whenever are you going to stop complaining?"',
        ],
      },
      {
        heading: 'Being Vague: Whatever, Whenever, Wherever, Whoever',
        intro: 'We can use these words alone to refer in a non-specific way to people and things.',
        examples: [
          'A: "Shall I send you all the dates and times?" B: "Yes, whatever. That would be useful."',
          'A: "What time shall I come?" B: "Whenever, really." (no specific time)',
          'If you talk to the manager or whoever, you\'ll be able to find out what\'s happening.',
        ],
      },
    ],
  },
  {
    title: '7. Collocation',
    subsections: [
      {
        heading: 'Strong vs Weak Collocators',
        intro: 'Collocation refers to words that frequently appear together. Some words are "strong collocators" (few possible partners) and others are "weak" (many possible partners).',
        table: {
          thead: ['Type', 'Word', 'Collocates', 'Explanation'],
          rows: [
            ['Strong', 'wish', 'make / express / fulfil', 'Very few words can collocate with "wish."'],
            ['Weak', 'big', 'apartment, beach, car, chance, disappointment, fight, news, ocean, pain, price, queue, etc.', '"Big" can collocate with hundreds of words.'],
          ],
        },
        examples: [
          'Strong collocation: "make a wish," "express a wish," "fulfil a wish"',
          'Weak collocation: "big apartment," "big chance," "big disappointment," "big news"',
        ],
        tip: 'Learning common collocations helps you sound more natural. Pay attention to which verbs, adjectives, and nouns naturally go together (e.g. "make a decision" not "do a decision"; "heavy rain" not "strong rain").',
      },
    ],
  },
  {
    title: '8. Adverbs',
    subsections: [
      {
        heading: 'What Are Adverbs?',
        intro: 'Adverbs are one of the four major word classes. They add information about a verb, an adjective, another adverb, a noun phrase, a clause, or a whole sentence.',
        table: {
          thead: ['Function', 'Example', 'Note'],
          rows: [
            ['Modifying a verb', 'Sit quietly!', 'Describes how the action happens.'],
            ['Modifying an adjective', 'Claire was rather quiet.', 'Shows degree of the adjective.'],
            ['Modifying another adverb', 'That week seemed to go by incredibly slowly.', 'Intensifies the adverb.'],
            ['Modifying a noun phrase', 'It takes quite a lot of courage.', 'Less common but valid.'],
            ['Modifying a whole clause', 'I\'m going for a run later so I don\'t want to eat now.', 'Time adverb scopes over entire clause.'],
            ['Modifying a whole sentence (stance)', 'Personally, I don\'t like the plans.', 'Gives speaker\'s attitude; commas often used.'],
          ],
        },
      },
      {
        heading: 'Adverb Types by Meaning',
        items: [
          { label: 'Manner (How?)', desc: 'Tell us the way something happens. Often -ly from adjectives: accurately, beautifully, carefully, quickly, quietly, badly.', examples: ['She spoke very loudly.', 'We waited anxiously by the phone.', 'We walked up the stairs very quietly.'] },
          { label: 'Time (When?)', desc: 'Tell us when something happens. Includes definite and indefinite time: already, early, finally, lately, now, recently, soon, still, today, tomorrow, yesterday, yet.', examples: ['Have you seen Laurie today?', 'I\'d prefer to leave early.', 'There\'s been an increase in house burglary lately.'] },
          { label: 'Place (Where?)', desc: 'Tell us where something happens: here, there, nearby, upstairs, outside, everywhere, abroad.', examples: ['There was somebody standing nearby.', 'Is that your scarf there?', 'You go upstairs and do your homework.'] },
          { label: 'Degree (How much?)', desc: 'Express degrees of qualities: absolutely, almost, a bit, completely, extremely, fairly, highly, pretty, quite, rather, slightly, too, totally, very.', examples: ['Mary will be staying a bit longer.', 'It all happened pretty quickly.', 'She was quite surprised they came.'] },
          { label: 'Focusing', desc: 'Point to or limit a particular part of the sentence: especially, generally, just, largely, mainly, only, particularly, simply.', examples: ['I just wanted to ask you what you thought.', 'I wouldn\'t particularly like to move to a modern house.'] },
          { label: 'Frequency (How often?)', desc: 'Indicate how often: always, usually, often, sometimes, rarely, seldom, hardly ever, never. Usually go in mid position.', examples: ['We often have friends to stay.', 'I usually get up late on weekends.', 'Sometimes she wore a woollen hat.'] },
          { label: 'Evaluative', desc: 'Express the speaker\'s evaluation of the clause content: surprisingly, unfortunately, stupidly, apparently, luckily, sadly, ironically.', examples: ['The electric car, surprisingly, does not really offer any advantages.', 'Unfortunately, I forgot my swimming costume.', 'They missed the bus, apparently.'] },
          { label: 'Viewpoint', desc: 'Express the speaker\'s point of view: personally, frankly, officially, theoretically, financially, morally.', examples: ['Personally, I\'d rather not go out.', 'Financially, the project was a disaster.'] },
          { label: 'Linking', desc: 'Show relationship between clauses: then, consequently, however, therefore, nevertheless, meanwhile, thus.', examples: ['We talked until the early hours and consequently I overslept.', 'The sun will be shining in France. However, heavy rain is expected in Spain.'] },
          { label: 'Certainty / Obligation', desc: 'Express how certain the speaker is: probably, possibly, certainly, definitely, maybe, perhaps.', examples: ['It\'ll probably rain.', 'Maybe Nick will know the answer.', 'Can I get you a drink, or something to eat, perhaps?'] },
        ],
      },
      {
        heading: 'Form Rules',
        table: {
          thead: ['Rule', 'Pattern', 'Examples'],
          rows: [
            ['Regular -ly', 'adjective + -ly', 'calm → calmly, beautiful → beautifully'],
            ['Ending in -l (double l)', '-l + -ly → -lly', 'beautiful → beautifully, careful → carefully'],
            ['Ending in -y', 'change -y to -i + -ly', 'easy → easily, lucky → luckily, angry → angrily'],
            ['Ending in consonant + e', 'keep -e + -ly', 'definite → definitely, extreme → extremely'],
            ['-ward(s) / -wise suffix', 'special suffix group', 'inwards, eastwards, clockwise, likewise'],
            ['Same form as adjective', 'no -ly form', 'fast, hard, left, right, straight, late, well'],
            ['Adjectives ending in -ly', 'NO adverb form; reword', 'friendly, lively, lonely, silly → "in a ___ way"'],
            ['No related adjective', 'adverb only', 'just, quite, so, soon, too, very'],
          ],
        },
      },
      {
        heading: 'Position Rules — Three Positions',
        table: {
          thead: ['Position', 'Where', 'Example'],
          rows: [
            ['Front', 'First item in the clause', 'Suddenly I felt afraid.'],
            ['Mid', 'Between subject and main verb; after first auxiliary/modal', 'Apples always taste best. / The government has occasionally been forced to change its mind.'],
            ['End', 'Last item in the clause', 'Why do you always have to eat so fast?'],
          ],
        },
        tip: 'Frequency adverbs (always, usually, often) go in MID position before the main verb, but AFTER the verb "be." With "be": "She is always late." With main verb: "He always arrives early." NEVER put an adverb between the verb and its object ("She plays the piano really well" not "She plays really well the piano").',
      },
      {
        heading: 'Manner → Place → Time Order',
        intro: 'When more than one of manner, place and time adverb appear together, the usual order is: manner → place → time.',
        examples: [
          'James played brilliantly in the match on Saturday. (manner + place + time)',
          'She spoke quietly in the room yesterday. (manner + place + time)',
          'You start off slowly in the beginning. (manner + time)',
        ],
      },
      {
        heading: 'Common Errors: Spelling',
        table: {
          thead: ['Incorrect', 'Correct', 'Explanation'],
          rows: [
            ['quite accidentaly', 'quite accidentally', 'Adjective ends in -al + -ly → -ally'],
            ['done easly', 'done easily', 'Adjective "easy" → change -y to -i'],
            ['happyly married', 'happily married', 'Change -y to -i before -ly'],
            ['completly destroyed', 'completely destroyed', 'Keep the -e before -ly'],
            ['extremly unhappy', 'extremely unhappy', 'Keep the -e before -ly'],
            ['I am truely sorry', 'I am truly sorry', '"True" drops the -e → "truly"'],
          ],
        },
      },
      {
        heading: 'Common Errors: Hard vs Hardly / Late vs Lately',
        table: {
          thead: ['Confusion', 'Meaning', 'Example'],
          rows: [
            ['hard (adj/adv)', 'with effort / with force', 'He works hard. / Push hard.'],
            ['hardly (adv)', 'almost not', 'I hardly know him. / She hardly ever goes out.'],
            ['late (adj/adv)', 'not on time', 'The train arrived late.'],
            ['lately (adv)', 'recently', 'I haven\'t seen him lately.'],
          ],
        },
        tip: 'Linking verbs (be, become, seem, look, smell, taste, feel) take ADJECTIVES, not adverbs: "The food tastes bad" (not "badly"), "She looks elegant" (not "elegantly"), "He seems unhappy" (not "unhappily").',
      },
      {
        heading: 'Linking Adverbs vs Conjunctions',
        tip: '"However" is a linking adverb that starts a NEW sentence — NOT a conjunction. Use "but" to connect two clauses within a single sentence. Correct: "There was no room for them, but they got on the train." OR "There was no room for them. However, they got on the train." NOT: "There was no room for them however they got on the train."',
      },
    ],
  },
];

/* ─── Grammar Exercises Data ─────────────────────────────────── */

const EXERCISE_SECTIONS = [
  {
    title: 'Mixed Conditionals — Exercises',
    gapFill: {
      instruction: 'Fill in the blanks with the correct form of the verbs in parentheses.',
      items: [
        { sentence: 'If I __________ (not buy) that expensive car last year, I __________ (have) more money in my savings account today.' },
        { sentence: 'She __________ (help) you move houses yesterday if she __________ (be) a more generous person.' },
        { sentence: 'If they __________ (manage) the project better from the start, we __________ (not face) these budget issues right now.' },
      ],
    },
    transform: {
      instruction: 'Rewrite the sentences using a mixed conditional.',
      items: [
        { prompt: 'I didn\'t take your advice. Now I am in a difficult situation.', lead: 'If I…' },
        { prompt: 'He is not highly qualified. That is why he didn\'t get the job last week.', lead: 'He would…' },
      ],
    },
    writing: 'Think about a major decision you made in your past (education, career, or travel). Write three sentences explaining how your present life would be different if you had made a different choice.',
  },
  {
    title: 'Conjunctions — Exercises',
    gapFillMulti: {
      instruction: 'Select the best conjunction from the options provided to complete the sentence.',
      items: [
        { text: '__________ we had implemented several security measures, the system experienced a minor data breach.', options: ['Despite', 'Although', 'Unless'] },
        { text: 'You can take the company vehicle for your client visit, __________ you return it with a full tank of gas.', options: ['provided that', 'as soon as', 'so'] },
        { text: 'The train was delayed by over an hour, __________ I missed the opening remarks of the conference.', options: ['but', 'so', 'for'] },
      ],
    },
    transform: {
      instruction: 'Combine the two sentences into one complex sentence using the word in brackets.',
      items: [
        { prompt: 'The company profits dropped. They hired three new executives anyway.', lead: 'Even though…' },
        { prompt: 'We need to finish the inventory check. Then we can close the store.', lead: 'As soon as…' },
      ],
    },
    writing: 'Write a brief paragraph (4-5 sentences) describing a challenging travel experience or an intense workday. Use at least one coordinating conjunction and two different types of subordinating conjunctions with correct comma placement.',
  },
  {
    title: 'Phrasal Verbs — Exercises',
    gapFill2: {
      instruction: 'Complete the sentences using the correct form of a phrasal verb or phrasal noun from the topics above.',
      items: [
        'We had to __________ the outdoor wedding reception because a massive thunderstorm rolled in.',
        'After analyzing the budget, I realized we need to __________ our daily coffee spending.',
        'The HR department sent over a complete __________ of employee benefits for the upcoming fiscal year.',
      ],
    },
    transform: {
      instruction: 'Rewrite the sentence using a phrasal verb from the topics above instead of the underlined word.',
      items: [
        { prompt: 'She rejected the job offer because the salary didn\'t meet her expectations.', lead: 'She…' },
        { prompt: 'The researchers conducted an extensive study on remote work productivity.', lead: 'The researchers…' },
      ],
    },
    writing: 'Write a paragraph (3-4 sentences) about a time you had to adapt to a major change at work or school. Use at least two phrasal verbs and one phrasal noun/adjective from this section accurately.',
  },
  {
    title: 'Nouns, Pronouns and Determiners — Exercises',
    gapFillMulti: {
      instruction: 'Choose the correct option to complete each sentence.',
      items: [
        { text: 'We need some __________ about the hotel before we book.', options: ['informations', 'information', 'pieces of informations'] },
        { text: 'Can I have __________ milk in my coffee, please?', options: ['a', 'some', 'many'] },
        { text: 'She bought __________ furniture for her new apartment.', options: ['a', 'many', 'a piece of'] },
        { text: 'I need to buy a new __________ for the trip.', options: ['luggage', 'suitcase', 'baggage'] },
      ],
    },
    transform: {
      instruction: 'Correct the errors in each sentence.',
      items: [
        { prompt: 'The teacher gave us many advices about the exam.', lead: 'The teacher gave us…' },
        { prompt: 'I need to find an accommodation before the semester starts.', lead: 'I need to find…' },
        { prompt: 'She bought two trousers for the trip.', lead: 'She bought…' },
      ],
    },
    writing: 'Write a short paragraph (4-5 sentences) describing your ideal workspace. Include at least two countable nouns, two uncountable nouns, one possessive determiner, and one quantifier (e.g., some, many, a few).',
  },
  {
    title: 'Politeness — Exercises',
    gapFill: {
      instruction: 'Rewrite each direct sentence to make it more polite using the strategies from the topics above.',
      items: [
        { sentence: 'Give me a coffee.' },
        { sentence: 'Tell me where the station is.' },
        { sentence: 'Close the window. It\'s cold.' },
      ],
    },
    transform: {
      instruction: 'Rewrite the sentences to be less direct and more polite.',
      items: [
        { prompt: 'I want you to help me with this report.', lead: 'I was wondering…' },
        { prompt: 'Follow me to the meeting room.', lead: 'If you would…' },
        { prompt: 'You need to improve your grammar.', lead: 'Your grammar could possibly…' },
      ],
    },
    writing: 'Write a polite email (4-5 sentences) to a professor you don\'t know, asking for an extension on an assignment. Use at least two politeness strategies: a softening word, a modal expression, a past tense form, or an if-clause.',
  },
  {
    title: 'However, Whatever, Whenever — Exercises',
    gapFillMulti: {
      instruction: 'Complete each sentence with the correct -ever word: however, whatever, whichever, whenever, wherever, whoever.',
      items: [
        { text: '__________ you decide to do, let me know in advance.', options: ['However', 'Whatever', 'Whichever'] },
        { text: 'You can come __________ you like — I\'ll be home all day.', options: ['wherever', 'whenever', 'whoever'] },
        { text: '__________ path you take, it leads to the same destination.', options: ['However', 'Whatever', 'Whichever'] },
        { text: '__________ told you that was wrong.', options: ['Wherever', 'Whoever', 'Whenever'] },
      ],
    },
    transform: {
      instruction: 'Rewrite each sentence using the -ever word in brackets.',
      items: [
        { prompt: 'It doesn\'t matter what you choose, we\'ll support you. (whatever)', lead: 'Whatever…' },
        { prompt: 'Any person who arrives late will not be admitted. (whoever)', lead: 'Whoever…' },
        { prompt: 'You can sit in any seat you like. (whichever)', lead: 'Sit…' },
      ],
    },
  },
  {
    title: 'Collocation — Exercises',
    gapFill: {
      instruction: 'Choose the correct collocation to complete each sentence.',
      items: [
        { sentence: 'We need to __________ a decision by Friday.' },
        { sentence: 'The weather forecast says there will be __________ rain tomorrow.' },
        { sentence: 'She __________ a wish before blowing out the candles.' },
        { sentence: 'I __________ a lot of progress with my English this month.' },
      ],
    },
    transform: {
      instruction: 'Replace the underlined words with a more natural collocation.',
      items: [
        { prompt: 'We did a big mistake by not checking the details.', lead: 'We…' },
        { prompt: 'She did a strong effort to finish on time.', lead: 'She…' },
        { prompt: 'I have a big desire to travel to Japan.', lead: 'I have a strong…' },
      ],
    },
    writing: 'Write 3-4 sentences about your daily routine using at least three natural collocations (e.g., make breakfast, heavy traffic, strong coffee, take a break, do homework).',
  },
  {
    title: 'Adverbs — Exercises',
    gapFillMulti: {
      instruction: 'Choose the correct option to complete each sentence.',
      items: [
        { text: 'She sings __________.', options: ['beautiful', 'beautifully', 'beauty'] },
        { text: 'The soup tastes __________.', options: ['delicious', 'deliciously'] },
        { text: 'He works __________ at his studies.', options: ['hard', 'hardly'] },
        { text: 'They arrived __________ for the meeting.', options: ['early', 'earlyly'] },
        { text: 'We were __________ exhausted after the trip.', options: ['absolute', 'absolutely', 'absolutly'] },
        { text: 'The test was __________ difficult — I only got 40%.', options: ['very', 'quite', 'too'] },
        { text: 'Is the water __________ hot for you?', options: ['too', 'very', 'enough'] },
        { text: 'He\'s __________ to reach the shelf.', options: ['tall enough', 'too tall', 'very tall'] },
        { text: 'He spoke __________ that nobody could hear him.', options: ['so quietly', 'such quietly', 'too quietly', 'quietly enough'] },
        { text: 'The project was, __________, a complete success.', options: ['surprisingly', 'surprise', 'surprised', 'surprising'] },
        { text: 'I __________ know the answer to that question.', options: ['hardly', 'hard', 'harder', 'hardness'] },
        { text: 'We talked until 3 a.m. __________, I overslept.', options: ['Consequently', 'However', 'Meanwhile', 'Then'] },
      ],
    },
    gapFill: {
      instruction: 'Complete each sentence with the correct adverb form.',
      items: [
        { sentence: 'She answered the questions __________. (quick)' },
        { sentence: 'He did the job __________. (professional)' },
        { sentence: 'It happened __________. (accidental)' },
        { sentence: 'He behaved __________. (calm)' },
        { sentence: 'The instructions were __________ unclear that nobody understood them. (so / too)' },
      ],
    },
    transform: {
      instruction: 'Correct the error in each sentence.',
      items: [
        { prompt: 'She speaks English very good.', lead: 'She speaks English…' },
        { prompt: 'She goes always to the gym.', lead: 'She always…' },
        { prompt: 'He is late always.', lead: 'He is always…' },
        { prompt: 'They have been never to London.', lead: 'They have never…' },
        { prompt: 'She plays really well the piano.', lead: 'She plays the piano…' },
        { prompt: 'Don\'t act sillily.', lead: 'Don\'t act…' },
        { prompt: 'The food tastes badly.', lead: 'The food tastes…' },
        { prompt: 'We go hardly ever to theirs.', lead: 'We hardly ever…' },
      ],
    },
    writing: 'Write a short paragraph (4-5 sentences) describing a memorable event. Include: one manner adverb, one time adverb, one place adverb, one frequency adverb, and one linking adverb (e.g., consequently, however, then). Use correct position for each.',
  },
];
