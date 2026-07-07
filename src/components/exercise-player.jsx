/**
 * exercise-player.jsx — Student-facing interactive renderers for all 7 exercise types.
 * Each type renders the exercise as the student experiences it.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, Pill } from './shared.jsx';
import { Card } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { parseBlankTemplate, shuffleArray } from '../lib/exercise-types.js';
import { ExTypeBadge } from './exercise-badge.jsx';
import Listening from './exercises/Listening.jsx';
import { getDbContext, uploadSubmissionAudio, createSignedAudioUrl } from '../lib/supabase-db.js';
import { DialoguePlayer, SwapPlayer, LevelUpPlayer } from './exercise-player-new-types.jsx';
import FormativeWrapper from './FormativeWrapper.jsx';

/**
 * ExercisePlayer — switches on exercise.type, renders the right interactive UI.
 * @param {{ exercise, response, onResponse, readOnly }} props
 *   exercise  — the exercise definition object
 *   response  — current student response state
 *   onResponse — (updatedResponse) => void
 *   readOnly  — if true, disable interactions (for teacher preview)
 */
export function ExercisePlayer({ exercise, response, onResponse, readOnly = false }) {
  if (!exercise) return null;

  const update = (patch) => {
    if (readOnly) return;
    onResponse?.({ ...response, ...patch });
  };

  switch (exercise.type) {
    case 'mcq':   return <MCQPlayer   ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'blank': return <BlankPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'short': return <ShortPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'speak': return <SpeakPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'order': return <OrderPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'fix':   return <FixPlayer   ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'flash':    return <FlashPlayer    ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'listen':   return <Listening exercise={exercise} onComplete={(result) => update({ selected: result?.correct ? exercise.correct : -1 })} />;
    case 'dialogue': return <DialoguePlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'swap':     return <SwapPlayer     ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'levelup':  return <LevelUpPlayer  ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'read':     return <ReadPlayer     ex={exercise} res={response} update={update} readOnly={readOnly} />;
    default:
      return (
        <div style={{ padding: 14, fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          {exercise.instruction || exercise.prompt || 'Exercise content'}
        </div>
      );
  }
}

/* ─── 1. MULTIPLE CHOICE ────────────────────────────────────── */
const MCQ_MAX_TRIES = 5;

function MCQPlayer({ ex, res, update, readOnly }) {
  const pick = res?.selected ?? null;
  const solved = res?.mcqSolved || false;
  const wrongPicks = res?.mcqWrongPicks || [];
  // Reveal the answer after the student has ruled out the wrong options — capped
  // at 5 tries (most MCQs have fewer than 5 wrong options).
  const wrongLimit = Math.min(MCQ_MAX_TRIES, Math.max(1, (ex.options?.length || 2) - 1));
  const revealed = wrongPicks.length >= wrongLimit;
  const done = solved || revealed;
  const showCorrect = readOnly || done;

  const check = () => {
    if (readOnly || done || pick == null || wrongPicks.includes(pick)) return;
    if (pick === ex.correct) update({ mcqSolved: true });
    else update({ mcqWrongPicks: [...wrongPicks, pick] });
  };

  return (
    <div>
      {ex.imageUrl && (
        <div style={{ marginBottom: 14, textAlign: 'center' }}>
          <img src={ex.imageUrl} alt={ex.imageAlt || ''} style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
        </div>
      )}
      <p style={{ margin: '0 0 14px', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.55 }}>
        {ex.question}
      </p>
      {!readOnly && !done && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--primary)' }}>
          <Icon.info size={13} />
          <span>Pick and press Check. The correct answer is shown after {wrongLimit} {wrongLimit === 1 ? 'try' : 'tries'}.</span>
        </div>
      )}
      <div role="radiogroup" aria-label={ex.question || 'Answer options'} style={{ display: 'grid', gap: 8 }}>
        {(ex.options || []).map((opt, i) => {
          const selected = pick === i;
          const isRight = i === ex.correct;
          const isWrongTried = wrongPicks.includes(i);
          let borderColor = 'var(--border)';
          let bg = 'var(--surface)';
          if (showCorrect && isRight)              { borderColor = 'var(--success)'; bg = 'var(--success-bg)'; }
          else if (isWrongTried)                   { borderColor = 'var(--danger)'; bg = 'var(--danger-bg)'; }
          else if (selected && !done)              { borderColor = 'var(--primary)'; bg = 'var(--accent-subtle)'; }
          const optionDisabled = readOnly || done || isWrongTried;

          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={optionDisabled}
              onClick={() => { if (!optionDisabled) update({ selected: i }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 0, width: '100%', textAlign: 'left',
                border: `1.5px solid ${borderColor}`, background: bg,
                cursor: optionDisabled ? 'default' : 'pointer',
                opacity: isWrongTried && !showCorrect ? 0.7 : 1,
                transition: 'all .15s var(--ease)', fontFamily: 'var(--font-sans)',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                background: selected ? 'var(--primary)' : 'transparent',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', flex: 1 }}>{opt}</span>
              {showCorrect && isRight && <><Icon.check size={16} color="var(--success)" /><span className="sr-only">Correct answer</span></>}
              {isWrongTried && !showCorrect && <><Icon.close size={14} color="var(--danger)" /><span className="sr-only">Incorrect</span></>}
            </button>
          );
        })}
      </div>

      {!done && pick !== null && !wrongPicks.includes(pick) && (
        <Button variant="primary" size="sm" onClick={check} style={{ marginTop: 12 }}>
          Check answer
        </Button>
      )}

      {solved && (
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 0, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 'var(--text-sm)' }}>
          <Icon.check size={14} /> Correct!
        </div>
      )}
      {!solved && revealed && (
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 0, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 'var(--text-sm)' }}>
          Answer shown after {wrongLimit} {wrongLimit === 1 ? 'try' : 'tries'} — the correct option is highlighted above.
        </div>
      )}
      {solved && ex.feedbackCorrect && (
        <div className="exercise-callout exercise-callout--explanation" style={{ marginTop: 10 }}>
          {ex.feedbackCorrect}
        </div>
      )}
      {!solved && revealed && ex.feedbackIncorrect && (
        <div className="exercise-callout exercise-callout--explanation" style={{ marginTop: 10 }}>
          {ex.feedbackIncorrect}
        </div>
      )}
      {(solved || revealed) && !ex.feedbackCorrect && !ex.feedbackIncorrect && ex.explanation && (
        <div className="exercise-callout exercise-callout--explanation" style={{ marginTop: 10 }}>
          <strong className="exercise-callout-kicker">Explanation</strong>
          {ex.explanation}
        </div>
      )}
      {!done && wrongPicks.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 0, background: 'var(--warning-bg)', color: 'var(--warning)', fontSize: 'var(--text-sm)' }}>
          Not quite — try another option. ({wrongPicks.length}/{wrongLimit})
        </div>
      )}
      {!done && ex.hints && wrongPicks.length >= 1 && ex.hints[0] && (
        <div className="exercise-callout exercise-callout--hint" style={{ marginTop: 8 }}>
          <strong className="exercise-callout-kicker exercise-callout-kicker--inline">Hint</strong>
          <p style={{ margin: '4px 0 0' }}>{ex.hints[0]}</p>
        </div>
      )}
      {!done && ex.hints && wrongPicks.length >= 2 && ex.hints[1] && (
        <div className="exercise-callout exercise-callout--hint2" style={{ marginTop: 6 }}>
          <strong className="exercise-callout-kicker exercise-callout-kicker--inline">Another hint</strong>
          <p style={{ margin: '4px 0 0' }}>{ex.hints[1]}</p>
        </div>
      )}
    </div>
  );
}

/* ─── 2. FILL THE BLANK ─────────────────────────────────────── */
const BLANK_MAX_TRIES = 5;

function BlankPlayer({ ex, res, update, readOnly }) {
  const segments = parseBlankTemplate(ex.template);
  const studentBlanks = res?.blanks || [];
  const correctBlanks = ex.blanks || [];
  const attempts = res?.blankAttempts || {};   // { blankIdx: wrong-try count }
  const lastTried = res?.lastTried || {};       // { blankIdx: last wrong value counted }

  const acceptedFor = (i) => (correctBlanks[i] || '').split('|').map(a => a.trim().toLowerCase());
  const isCorrectVal = (i, val) => acceptedFor(i).includes((val || '').trim().toLowerCase());
  const triesUsed = (i) => attempts[i] || 0;
  const isRevealed = (i) => triesUsed(i) >= BLANK_MAX_TRIES;
  const answerFor = (i) => (correctBlanks[i] || '').split('|')[0]?.trim() || '';

  const getStatus = (i) => {
    const val = (studentBlanks[i] || '').trim().toLowerCase();
    if (!val) return null;
    return isCorrectVal(i, val) ? 'ok' : 'warn';
  };

  // Count one try when a blank loses focus with a non-empty WRONG answer.
  // Identical consecutive values aren't double-counted. After BLANK_MAX_TRIES
  // wrong tries, the answer for that blank is revealed.
  const countTry = (i) => {
    if (readOnly || isRevealed(i)) return;
    const raw = (studentBlanks[i] || '').trim();
    if (!raw || isCorrectVal(i, raw)) return;
    if (raw.toLowerCase() === (lastTried[i] || '').toLowerCase()) return;
    update({
      blankAttempts: { ...attempts, [i]: triesUsed(i) + 1 },
      lastTried: { ...lastTried, [i]: raw },
    });
  };

  const hasAnswers = correctBlanks.length > 0;
  const anyRevealed = Object.keys(attempts).some(k => triesUsed(k) >= BLANK_MAX_TRIES);

  return (
    <div>
      {hasAnswers && !readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--primary)' }}>
          <Icon.info size={13} />
          <span>Keep trying — if a blank is tricky, its answer appears after {BLANK_MAX_TRIES} attempts.</span>
        </div>
      )}
      <p style={{ margin: '0 0 14px', fontSize: 'var(--text-base)', lineHeight: 2.4, color: 'var(--text)' }}>
        {segments.map((seg, i) => {
          if (seg.type === 'text') return <span key={i}>{seg.value}</span>;
          const idx = seg.index;
          const status = getStatus(idx);
          const revealed = isRevealed(idx);
          const used = triesUsed(idx);
          const color = revealed || status === 'ok' ? 'var(--success)' : status === 'warn' ? 'var(--warning)' : 'var(--primary)';
          return (
            <span key={i} style={{ whiteSpace: 'nowrap' }}>
              <input
                value={studentBlanks[idx] || ''}
                onChange={e => {
                  const blanks = [...studentBlanks];
                  blanks[idx] = e.target.value;
                  update({ blanks });
                }}
                onBlur={() => countTry(idx)}
                disabled={readOnly}
                placeholder="___"
                aria-label={status === 'ok' ? 'Blank, correct' : status === 'warn' ? 'Blank, check your answer' : 'Blank'}
                style={{
                  border: 'none', borderBottom: `2px solid ${color}`,
                  outline: 'none', fontSize: 'var(--text-base)', width: 130,
                  padding: '2px 6px', textAlign: 'center',
                  fontFamily: 'var(--font-sans)', fontWeight: 600,
                  color, background: 'transparent',
                }}
              />
              {status === 'ok' && <Icon.check size={14} color="var(--success)" style={{ marginLeft: 3 }} />}
              {status === 'warn' && !revealed && (
                <span title="check this" style={{ color: 'var(--warning)', fontWeight: 700, marginLeft: 3, fontSize: 'var(--text-xs)' }}>
                  !{used > 0 ? ` ${used}/${BLANK_MAX_TRIES}` : ''}
                </span>
              )}
              {revealed && (
                <span title={`Answer shown after ${BLANK_MAX_TRIES} tries`} style={{ marginLeft: 4, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--success)' }}>
                  → {answerFor(idx)}
                </span>
              )}
            </span>
          );
        })}
      </p>
      {anyRevealed && !readOnly && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon.check size={12} />
          <span>Answer shown after {BLANK_MAX_TRIES} tries — type it in to finish the blank.</span>
        </div>
      )}
      {anyRevealed && ex.explanation && (
        <div className="exercise-callout exercise-callout--explanation" style={{ marginTop: 10 }}>
          <strong className="exercise-callout-kicker">Explanation</strong>
          {ex.explanation}
        </div>
      )}
      {!readOnly && ex.hints && Object.values(attempts).some(n => n >= 2) && ex.hints[0] && (
        <div className="exercise-callout exercise-callout--hint" style={{ marginTop: 10 }}>
          <strong className="exercise-callout-kicker exercise-callout-kicker--inline">Hint</strong>
          <p style={{ margin: '4px 0 0' }}>{ex.hints[0]}</p>
        </div>
      )}
      {!readOnly && ex.hints && Object.values(attempts).some(n => n >= 3) && ex.hints[1] && (
        <div className="exercise-callout exercise-callout--hint2" style={{ marginTop: 6 }}>
          <strong className="exercise-callout-kicker exercise-callout-kicker--inline">Another hint</strong>
          <p style={{ margin: '4px 0 0' }}>{ex.hints[1]}</p>
        </div>
      )}
    </div>
  );
}

/* ─── 3. SHORT ANSWER ──────────────────────────────────────── */

const WRITING_QUALITY_CHECKS = [
  { label: 'Task complete', hint: 'I answered what was asked — not a different question.' },
  { label: 'Supporting detail', hint: 'I developed my main idea with at least one concrete example.' },
  { label: 'Connectives used correctly', hint: 'My ideas are linked (e.g. however, therefore, as a result) — not just listed.' },
  { label: 'Grammar errors do not obscure meaning', hint: 'A reader can understand my point even if some errors remain.' },
];

function ShortPlayer({ ex, res, update, readOnly }) {
  const text = res?.text || '';
  const wc = text.split(/\s+/).filter(Boolean).length;
  const target = ex.targetWords || 120;
  const [checklistOpen, setChecklistOpen] = useState(false);

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.55 }}>
        {ex.prompt}
      </p>

      {/* SCAFFOLDING */}
      {(ex.scaffolding?.vocabulary?.length > 0 || ex.scaffolding?.structure?.length > 0) && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
          {ex.scaffolding.vocabulary?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: 6 }}>Vocabulary:</span>
              {ex.scaffolding.vocabulary.map((word, i) => (
                <span key={i} style={{ display: 'inline-block', background: 'var(--white)', padding: '2px 6px', borderRadius: 0, marginRight: 4, border: '1px solid var(--accent-soft)' }}>{word}</span>
              ))}
            </div>
          )}
          {ex.scaffolding.structure?.length > 0 && (
            <div>
              <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: 6 }}>Structure:</span>
              <ul style={{ margin: '4px 0 0 16px', padding: 0, color: 'var(--text-2)' }}>
                {ex.scaffolding.structure.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {ex.rubric && (
        <div style={{ margin: '0 0 12px', padding: '8px 12px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: 6 }}>Teacher note:</span>
          {ex.rubric}
        </div>
      )}

      {/* Quality checklist — collapsible, shown before textarea */}
      {!readOnly && (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setChecklistOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-sans)' }}
          >
            <span style={{ display: 'inline-flex', transform: checklistOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><Icon.chevronRight size={10} /></span>
            Quality checklist — what good MET writing requires
          </button>
          {checklistOpen && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              {WRITING_QUALITY_CHECKS.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < WRITING_QUALITY_CHECKS.length - 1 ? 6 : 0 }}>
                  <Icon.check size={12} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--text)' }}>{c.label}:</strong> {c.hint}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <textarea
        className="input" rows={6} value={text}
        onChange={e => update({ text: e.target.value })}
        disabled={readOnly}
        placeholder="Start writing your answer…"
        style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>{wc} words</span>
        <span style={{ fontSize: 'var(--text-xs)', color: wc >= target * 0.8 ? 'var(--success)' : 'var(--muted)' }}>
          target {target} words {wc >= target * 0.8 ? '· you\'re there' : `· ${target - wc} to go`}
        </span>
      </div>
    </div>
  );
}

/* ─── 4. SPEAKING ──────────────────────────────────────────── */

const MET_TASK_LABELS = {
  Q1: 'Task 1 — Describe a picture · 60 s',
  Q2: 'Task 2 — Personal experience · 60 s',
  Q3: 'Task 3 — Give an opinion · 60 s',
  Q4: 'Task 4 — Advantages & disadvantages · 90 s',
  Q5: 'Task 5 — Persuade an authority · 90 s',
};

const SPEAKING_STRATEGY_CHECKS = {
  Q1: [
    { label: 'First 10–15 seconds', hint: 'Start with the general scene — "This picture shows…" Don\'t list objects without describing the situation.' },
    { label: 'Spatial coverage', hint: 'Cover foreground, background, centre, left/right. Use precise spatial language (in the foreground, on the left).' },
    { label: 'People & actions', hint: 'Describe what people are doing, their appearance, and relationships between them — not just a list of objects.' },
    { label: 'Inference', hint: 'End with a logical inference — "They might be…" / "It looks like…" This shows higher-level thinking.' },
  ],
  Q2: [
    { label: 'Tell ONE specific story', hint: 'Not a general habit. Start with "I remember a time when…" / "This happened when I was…"' },
    { label: 'Past tense control', hint: 'Stay in past tense throughout. Switching tenses mid-story loses points.' },
    { label: 'Narrative arc', hint: 'Follow: setup → event → action → result → reflection. Use narrative connectors (at first, after that, in the end).' },
  ],
  Q3: [
    { label: 'State your position early', hint: 'First sentence = your opinion. "In my opinion…" / "I believe that…" Don\'t start with background.' },
    { label: 'One side only', hint: 'This is an opinion task — give reasons for YOUR view only. Covering both sides weakens your answer.' },
    { label: 'Develop with examples', hint: 'One reason + one concrete example is better than two vague reasons. Use "For example…" / "For instance…"' },
  ],
  Q4: [
    { label: 'Both sides required', hint: 'Cover BOTH advantages AND disadvantages with roughly equal time (~40s each). Only one side loses ~1/3 of your task score.' },
    { label: 'Neutral register', hint: 'No personal opinion. Use: "There are several benefits…" / "One drawback is…" Not: "I think…"' },
    { label: 'Clear transition', hint: 'Use a pivot phrase: "However…" / "On the other hand…" to signal the switch between sides.' },
  ],
  Q5: [
    { label: 'Position in first 10–15s', hint: 'State your recommendation immediately. "I strongly believe…" / "I would recommend…" Not "I think maybe…"' },
    { label: 'Formal register throughout', hint: 'Address the authority figure directly. No informal language. Use: "I strongly believe…" / "I am convinced that…"' },
    { label: 'Commit — no hedging', hint: 'This is persuasion, not discussion. Don\'t give the other side or weaken your position.' },
  ],
};

function SpeakPlayer({ ex, res, update, readOnly }) {
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | recording | done
  const [seconds, setSeconds] = useState(0);
  const [typing, setTyping] = useState(false); // "type instead" alternative to recording
  const [playbackUrl, setPlaybackUrl] = useState(res?.audioB64 || null);
  const timerRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const transcriptRef = useRef(res?.transcript || '');

  // Keep transcriptRef in sync with the latest user input
  useEffect(() => { transcriptRef.current = res?.transcript || ''; }, [res?.transcript]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const target = ex.targetSeconds || 60;

  const start = async () => {
    if (readOnly) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRef.current.onstop = async () => {
        const blobType = chunksRef.current.length > 0 ? chunksRef.current[0].type : 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        // Immediate local playback regardless of where it's persisted.
        setPlaybackUrl(URL.createObjectURL(blob));
        const currentTranscript = transcriptRef.current;
        const ctx = getDbContext();
        if (ctx) {
          // Signed-in: upload to private Storage, persist only the object path.
          try {
            const rand = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
            const path = `${ctx.authUid}/${rand}/${ex.id || 'audio'}.webm`;
            await uploadSubmissionAudio(blob, path);
            update({ audioPath: path, audioB64: null, transcript: currentTranscript });
          } catch (e) {
            console.warn('[speak] audio upload failed:', e.message);
            // Fallback to base64 inline only if blob is small enough (< 500KB → ~700KB base64)
            if (blob.size < 500_000) {
              const reader = new FileReader();
              reader.onloadend = () => update({ audioB64: reader.result, audioPath: null, transcript: currentTranscript });
              reader.readAsDataURL(blob);
            } else {
              window.toast?.('Audio upload failed. Recording is too large for local storage.', 'warn');
              update({ audioB64: null, audioPath: null, transcript: currentTranscript });
            }
          }
        } else {
          // localStorage mode: keep the legacy base64-in-record behaviour.
          const reader = new FileReader();
          reader.onloadend = () => update({ audioB64: reader.result, transcript: currentTranscript });
          reader.readAsDataURL(blob);
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRef.current.start();
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      window.toast?.('Microphone access denied.', 'warn');
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setStatus('done');
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setSeconds(0);
    setStatus('idle');
    setPlaybackUrl(null);
    update({ audioB64: null, audioPath: null, transcript: '' });
  };

  useEffect(() => () => { clearInterval(timerRef.current); mediaRef.current?.stream?.getTracks().forEach(t => t.stop()); }, []);

  // Restore a previously-recorded answer (base64 inline, or a signed URL for a Storage path).
  useEffect(() => {
    if (res?.audioB64) { setPlaybackUrl(res.audioB64); setStatus('done'); return; }
    if (res?.audioPath) {
      setStatus('done');
      createSignedAudioUrl(res.audioPath).then(url => { if (url) setPlaybackUrl(url); });
    }
  }, [res]);

  return (
    <div>
      {ex.imageUrl ? (
        <div style={{ marginBottom: 14, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg)' }}>
          <img
            src={ex.imageUrl}
            alt={ex.imageAlt || ex.imageDescription || 'Speaking prompt image'}
            style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }}
          />
          {ex.imageDescription && (
            <p style={{ margin: 0, padding: '8px 12px', fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>{ex.imageDescription}</p>
          )}
        </div>
      ) : ex.imageDescription ? (
        <div style={{ marginBottom: 14, padding: '14px 16px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-border, var(--border))' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Picture to describe</div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text)', lineHeight: 1.6 }}>{ex.imageDescription}</p>
        </div>
      ) : null}

      {(ex.metTaskType || ex.metTask) && (() => {
        const taskKey = ex.metTaskType || ex.metTask;
        const label = MET_TASK_LABELS[taskKey];
        if (!label) return null;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '4px 10px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>MET</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>{label}</span>
          </div>
        );
      })()}

      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Speaking prompt</div>
        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--text)', lineHeight: 1.55, fontWeight: 500 }}>
          {ex.prompt}
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}> Target: {target} seconds.</span>
        </p>
      </div>

      {/* SCAFFOLDING */}
      {(ex.scaffolding?.vocabulary?.length > 0 || ex.scaffolding?.structure?.length > 0) && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
          {ex.scaffolding.vocabulary?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: 6 }}>Vocabulary:</span>
              {ex.scaffolding.vocabulary.map((word, i) => (
                <span key={i} style={{ display: 'inline-block', background: 'var(--white)', padding: '2px 6px', borderRadius: 0, marginRight: 4, border: '1px solid var(--accent-soft)' }}>{word}</span>
              ))}
            </div>
          )}
          {ex.scaffolding.structure?.length > 0 && (
            <div>
              <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: 6 }}>Structure:</span>
              <ul style={{ margin: '4px 0 0 16px', padding: 0, color: 'var(--text-2)' }}>
                {ex.scaffolding.structure.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Strategy checklist — task-specific, collapsible, shown before recording */}
      {!readOnly && status === 'idle' && (() => {
        const taskChecks = ex.metTask && SPEAKING_STRATEGY_CHECKS[ex.metTask]
          ? SPEAKING_STRATEGY_CHECKS[ex.metTask]
          : Object.values(SPEAKING_STRATEGY_CHECKS).flat();
        const taskName = ex.metTask ? MET_TASK_LABELS[ex.metTask]?.replace(/\s*·.*/, '') || 'this task' : 'this task';
        return (
          <div style={{ marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setStrategyOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-sans)' }}
            >
              <span style={{ display: 'inline-flex', transform: strategyOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><Icon.chevronRight size={10} /></span>
              Tips for {taskName}
            </button>
            {strategyOpen && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                {taskChecks.map((c) => (
                  <div key={c.label} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0, fontSize: 'var(--text-xs)', marginTop: 1 }}>→</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.55 }}>
                      <strong style={{ color: 'var(--text)' }}>{c.label}:</strong> {c.hint}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {status === 'idle' && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary" onClick={start} disabled={readOnly}>
              <Icon.mic size={13} /> Start recording
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTyping(t => !t)} disabled={readOnly}>
              {typing ? 'Hide typing' : 'Type my answer instead'}
            </Button>
          </div>
          {typing && (
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your written answer
              </span>
              <textarea
                className="input" rows={5} value={res?.transcript || ''}
                onChange={e => update({ transcript: e.target.value })}
                disabled={readOnly}
                placeholder="Type your full answer here — this counts as your response if you can't record."
                style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, marginTop: 6 }}
              />
            </div>
          )}
        </>
      )}

      {status === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button variant="danger" onClick={stop}>
            <span style={{ width: 8, height: 8, background: '#fff', display: 'inline-block', borderRadius: 2 }} />
            Stop · {fmt(seconds)}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
            <span style={{
              width: 8, height: 8, borderRadius: 0, background: 'var(--danger)',
              animation: 'vv-pulse 1s ease-in-out infinite',
            }} />
            Recording
          </div>
          <style>{`@keyframes vv-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
          {/* Mini waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{
                width: 2, height: 22,
                background: 'var(--primary)', borderRadius: 0,
                transform: `scaleY(${(4 + Math.abs(Math.sin(seconds * 0.7 + i * 0.4)) * 18) / 22})`,
                transformOrigin: 'bottom', transition: 'transform .2s',
              }} />
            ))}
          </div>
        </div>
      )}

      {status === 'done' && (
        <div>
          {playbackUrl && (
            <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg)', borderRadius: 8 }}>
              <audio controls src={playbackUrl} style={{ width: '100%', height: 36 }} />
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Optional — type a transcript
            </span>
          </div>
          <textarea
            className="input" rows={3} value={res?.transcript || ''}
            onChange={e => update({ transcript: e.target.value })}
            disabled={readOnly}
            placeholder="Type what you said…"
            style={{ fontSize: 'var(--text-sm)' }}
          />
          {!readOnly && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button variant="ghost" size="sm" onClick={reset}>Re-record</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── 5. ORDER SENTENCES ───────────────────────────────────── */
function OrderPlayer({ ex, res, update, readOnly }) {
  const sentences = ex.sentences || [];

  // Initialize shuffled order if not set
  const [order, setLocalOrder] = useState(() => {
    if (res?.order?.length === sentences.length) return res.order;
    const indices = sentences.map((_, i) => i);
    return shuffleArray(indices, ex.id);
  });

  // Sync order to response
  useEffect(() => {
    if (!readOnly && order.length > 0) update({ order });
  }, [order, readOnly, update]);

  const move = (i, dir) => {
    if (readOnly) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setLocalOrder(next);
  };

  const isCorrect = order.every((idx, i) => idx === i);

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
        Put the sentences in the correct order. Use the arrows.
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {order.map((idx, i) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center',
            padding: '12px 14px', borderRadius: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <span style={{
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--text-lg)',
              color: 'var(--accent)', width: 24, textAlign: 'center',
            }}>{i + 1}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', lineHeight: 1.5 }}>{sentences[idx]}</span>
            {!readOnly && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={orderArrowStyle(i === 0)}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === order.length - 1} style={orderArrowStyle(i === order.length - 1)}>↓</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {isCorrect && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 0,
          background: 'var(--success-bg)', color: 'var(--success)', fontSize: 'var(--text-sm)',
        }}>
          <Icon.check size={14} /> Correct order!
        </div>
      )}
      {isCorrect && ex.explanation && (
        <div className="exercise-callout exercise-callout--explanation" style={{ marginTop: 10 }}>
          <strong className="exercise-callout-kicker">Explanation</strong>
          {ex.explanation}
        </div>
      )}
    </div>
  );
}

function orderArrowStyle(disabled) {
  return {
    width: 24, height: 22, padding: 0, fontFamily: 'var(--font-sans)',
    fontSize: 12, border: '1px solid var(--border)', borderRadius: 0,
    background: 'var(--surface)', color: disabled ? 'var(--faint)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

/* ─── 6. ERROR CORRECTION ──────────────────────────────────── */
const FIX_MAX_TRIES = 5;

function FixPlayer({ ex, res, update, readOnly }) {
  const text = res?.text ?? ex.errorText;
  const corrected = (ex.correctedText || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const current = (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const isFixed = corrected && current === corrected;
  const hasChanged = text !== ex.errorText;
  const attempts = res?.fixAttempts || 0;
  const lastTried = res?.fixLastTried || '';
  const revealed = !!ex.correctedText && attempts >= FIX_MAX_TRIES;

  // Count a try when the student checks a changed-but-still-wrong fix. Identical
  // consecutive submissions aren't double-counted. After FIX_MAX_TRIES, reveal the
  // correct version.
  const check = () => {
    if (readOnly || isFixed || revealed || !hasChanged) return;
    if (current === lastTried) return;
    update({ fixAttempts: attempts + 1, fixLastTried: current });
  };

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
        Find and correct all errors. Edit the text directly.
      </p>
      {ex.hint && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: 'var(--warning-bg)',
          color: 'var(--warning)', borderRadius: 0,
          fontSize: 'var(--text-xs)', marginBottom: 12,
        }}>
          <Icon.spark size={11} /> {ex.hint}
        </div>
      )}
      {!readOnly && !isFixed && !revealed && !!ex.correctedText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--primary)' }}>
          <Icon.info size={13} />
          <span>Edit the text, then press Check. The correct version is shown after {FIX_MAX_TRIES} tries.</span>
        </div>
      )}
      <textarea
        className="input" rows={4} value={text}
        onChange={e => update({ text: e.target.value })}
        disabled={readOnly}
        style={{ fontSize: 'var(--text-sm)', lineHeight: 1.75 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 10 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>
          Edit the text above to fix the errors.
        </span>
        {hasChanged && (
          <Pill tone={isFixed ? 'success' : 'warning'}>
            {isFixed ? <><Icon.check size={12} /> All errors fixed</> : 'Keep going'}
          </Pill>
        )}
      </div>
      {!readOnly && !isFixed && !revealed && !!ex.correctedText && (
        <Button variant="ghost" size="sm" onClick={check} disabled={!hasChanged || current === lastTried} style={{ marginTop: 8 }}>
          Check my fix
        </Button>
      )}
      {!isFixed && !revealed && attempts > 0 && (
        <div style={{ marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>
          Not fixed yet — keep editing. ({attempts}/{FIX_MAX_TRIES})
        </div>
      )}
      {revealed && !isFixed && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Correct version (shown after {FIX_MAX_TRIES} tries)
          </div>
          <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text)' }}>{ex.correctedText}</div>
        </div>
      )}
      {(isFixed || revealed) && ex.explanation && (
        <div className="exercise-callout exercise-callout--explanation" style={{ marginTop: 10 }}>
          <strong className="exercise-callout-kicker">Explanation</strong>
          {ex.explanation}
        </div>
      )}
    </div>
  );
}

/* ─── 7. FLASHCARDS ─────────────────────────────────────────── */
function FlashPlayer({ ex, res, update, readOnly }) {
  const pairs = (ex.pairs || []).filter(p => p.term || p.def);
  const [mode, setMode] = useState('cards');
  const [idx, setIdx] = useState(res?.idx || 0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState(res?.learned || 0);
  // Match game state
  const [matchPairs, setMatchPairs] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [wrongFlash, setWrongFlash] = useState(null);

  if (pairs.length === 0) return <p style={{ color: 'var(--muted)' }}>No flashcards defined.</p>;

  const card = pairs[Math.min(idx, pairs.length - 1)];

  const next = () => { setFlipped(false); setIdx(i => Math.min(i + 1, pairs.length - 1)); };
  const prev = () => { setFlipped(false); setIdx(i => Math.max(i - 1, 0)); };
  const mark = () => {
    const newLearned = learned + 1;
    setLearned(newLearned);
    if (!readOnly) update({ idx: Math.min(idx + 1, pairs.length - 1), learned: newLearned });
    next();
  };

  const startMatch = () => {
    const shuffledDefs = shuffleArray(pairs.map((p, i) => ({ ...p, origIdx: i })), ex.id);
    setMatchPairs(shuffledDefs);
    setSelectedTerm(null);
    setMatched(new Set());
    setWrongFlash(null);
    setMode('match');
  };

  const handleMatchDef = (defOrigIdx) => {
    if (selectedTerm === null) return;
    if (selectedTerm === defOrigIdx) {
      const next = new Set(matched);
      next.add(defOrigIdx);
      setMatched(next);
      setSelectedTerm(null);
    } else {
      setWrongFlash(defOrigIdx);
      setTimeout(() => { setWrongFlash(null); setSelectedTerm(null); }, 600);
    }
  };

  const allMatched = matched.size === pairs.length;

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{ id: 'cards', label: 'Flashcards' }, { id: 'match', label: 'Match Game' }].map(m => (
          <button key={m.id} onClick={m.id === 'match' ? startMatch : () => setMode('cards')}
            style={{
              padding: '5px 14px', borderRadius: 0, border: '1.5px solid',
              fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
              borderColor: mode === m.id ? 'var(--primary)' : 'var(--border)',
              background: mode === m.id ? 'var(--accent-subtle)' : 'var(--surface)',
              color: mode === m.id ? 'var(--primary)' : 'var(--text-2)',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'match' && matchPairs ? (
        allMatched ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--success-bg)', borderRadius: 0, border: '1.5px solid var(--success)' }}>
            <Icon.party size={32} style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 'var(--text-lg)' }}>All matched!</div>
            <Button variant="ghost" size="sm" onClick={startMatch} style={{ marginTop: 12 }}>Play again</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Terms</div>
              {pairs.map((p, origIdx) => {
                  if (matched.has(origIdx)) {
                  return <div key={origIdx} style={{ padding: '10px 14px', borderRadius: 0, background: 'var(--success-bg)', border: '1.5px solid var(--success)', color: 'var(--success)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{p.term}</div>;
                }
                const isSelected = selectedTerm === origIdx;
                return (
                  <button key={origIdx} onClick={() => !readOnly && setSelectedTerm(isSelected ? null : origIdx)}
                    style={{
                      padding: '10px 14px', borderRadius: 0, border: '1.5px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                      background: isSelected ? 'var(--accent-subtle)' : 'var(--surface)',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      fontSize: 'var(--text-sm)', color: isSelected ? 'var(--primary)' : 'var(--text)',
                      textAlign: 'left', transition: 'all .15s',
                    }}>
                    {p.term}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Definitions</div>
              {matchPairs.map((p) => {
                const origIdx = p.origIdx;
                if (matched.has(origIdx)) {
                  return <div key={origIdx} style={{ padding: '10px 14px', borderRadius: 0, background: 'var(--success-bg)', border: '1.5px solid var(--success)', color: 'var(--success)', fontSize: 'var(--text-sm)' }}>{p.def}</div>;
                }
                const isWrong = wrongFlash === origIdx;
                return (
                  <button key={origIdx} onClick={() => !readOnly && handleMatchDef(origIdx)}
                    style={{
                      padding: '10px 14px', borderRadius: 0, border: '1.5px solid',
                       borderColor: isWrong ? 'var(--error)' : selectedTerm !== null ? 'var(--primary)' : 'var(--border)',
                       background: isWrong ? 'var(--error-bg)' : selectedTerm !== null ? 'rgba(61,166,166,.06)' : 'var(--surface)',
                      cursor: selectedTerm !== null ? 'pointer' : 'default',
                      fontFamily: 'inherit', fontSize: 'var(--text-sm)', color: 'var(--text)',
                      textAlign: 'left', transition: 'all .15s',
                    }}>
                    {p.def}
                  </button>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>{idx + 1} of {pairs.length}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--success)' }}><Icon.check size={12} /> {learned} learned</span>
          </div>
          <div onClick={() => setFlipped(f => !f)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f); } }}
            aria-label={flipped ? 'Card showing definition, click to flip back' : 'Card showing term, click to flip'}
            style={{
              background: flipped ? 'var(--primary)' : 'var(--surface)',
              color: flipped ? '#F0F6FC' : 'var(--text)',
              border: `2px solid ${flipped ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 0, padding: '40px 28px', textAlign: 'center',
              minHeight: 160, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'background .3s var(--ease), color .3s var(--ease), border-color .3s var(--ease)',
            }}>
            <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', color: flipped ? 'rgba(240,246,252,.55)' : 'var(--faint)', marginBottom: 14 }}>
              {flipped ? 'Definition' : 'Term'}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: flipped ? 'var(--text-lg)' : 'var(--text-2xl)', lineHeight: 1.3, maxWidth: 480 }}>
              {flipped ? card.def : card.term}
            </div>
            <div style={{ marginTop: 16, fontSize: 'var(--text-xs)', color: flipped ? 'rgba(240,246,252,.4)' : 'var(--faint)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              Click to flip
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={prev} disabled={idx === 0}>
              <Icon.arrowL size={12} /> Previous
            </Button>
            <div style={{ display: 'flex', gap: 8 }}>
              {flipped && !readOnly && (
                <Button variant="primary" size="sm" onClick={mark}>
                  <Icon.check size={12} /> Learned
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={next} disabled={idx === pairs.length - 1}>
                Next <Icon.arrowR size={12} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── HOMEWORK STEP-THROUGH WRAPPER ─────────────────────────── */

/**
 * HomeworkStepThrough — renders exercises one at a time with progress bar + navigation.
 * Used in the student dashboard to walk through a homework set.
 */
/* ─── 12. READING ───────────────────────────────────────── */

function ReadPlayer({ ex, res, update, readOnly }) {
  const answers = res?.answers || {};
  const questions = ex.questions || [];
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(null);

  function handleSelect(qId, optionIdx) {
    if (readOnly || checked) return;
    update({ answers: { ...answers, [qId]: optionIdx } });
  }

  function handleCheck() {
    if (readOnly) return;
    let hits = 0;
    const perQ = questions.map(q => {
      const correct = answers[q.id] === q.correct;
      if (correct) hits++;
      return { correct, selected: answers[q.id], expected: q.correct };
    });
    const total = questions.length || 1;
    setResults({ hits, total, perQ });
    setChecked(true);
  }

  const vocab = ex.vocabulary || ex.scaffolding?.vocabulary || [];

  return (
    <div>
      {/* Skimming & Scanning strategy guide */}
      <div style={{
        padding: '12px 14px', marginBottom: 14,
        background: 'var(--ex-selected-bg, #f0f5ff)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--accent-soft, #b8d4e3)',
        fontSize: 'var(--text-xs)', color: 'var(--text)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 6, color: 'var(--primary)' }}>
          Skimming &amp; Scanning — MET Reading Strategies
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <strong>Skim</strong> first — read the title, headings, and first sentence of each paragraph to get the <strong>main idea</strong>. Don't read every word. Useful for: "What is the passage mainly about?"
          </div>
          <div>
            <strong>Scan</strong> next — look for <strong>specific information</strong> (names, dates, keywords) by moving your eyes quickly through the text. Stop when you find the target. Useful for: "According to the passage, why did…?"
          </div>
        </div>
        <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(184,118,26,.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(184,118,26,.2)' }}>
          <strong style={{ color: 'var(--warning-text, #b8761a)' }}>Pro tip:</strong> Read the question first, then skim the passage, then scan for the evidence. MET questions follow the order of the text — answer them in sequence.
        </div>
      </div>

      {/* Vocabulary preview */}
      {vocab.length > 0 && (
        <div style={{
          padding: '8px 12px', marginBottom: 14,
          background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)', border: '1px solid var(--accent-soft)',
        }}>
          <strong style={{ color: 'var(--primary)', marginRight: 6 }}>Key vocabulary:</strong>
          {vocab.map((word, i) => (
            <span key={i} style={{
              display: 'inline-block', background: 'var(--white)', padding: '2px 8px',
              borderRadius: 0, marginRight: 4, marginBottom: 2,
              border: '1px solid var(--accent-soft)', fontWeight: 600,
              color: 'var(--text)',
            }}>{typeof word === 'string' ? word : word.word || word.term || ''}</span>
          ))}
        </div>
      )}

      {ex.imageUrl && (
        <div style={{ marginBottom: 14, textAlign: 'center' }}>
          <img src={ex.imageUrl} alt={ex.imageAlt || ''} style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
        </div>
      )}

      {/* Passage */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 14,
        maxHeight: 260, overflowY: 'auto', lineHeight: 1.8,
        fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
        color: 'var(--text)',
      }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ex.passage || 'No passage provided.'}</p>
        {ex.source && (
          <p style={{ margin: '8px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--font-sans)' }}>
            — {ex.source}
          </p>
        )}
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map((q, qi) => (
          <div key={q.id} style={{
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: 12, background: 'var(--bg)',
          }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 8, color: 'var(--text)' }}>
              {qi + 1}. {q.question}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(q.options || []).map((opt, oi) => {
                const isSelected = answers[q.id] === oi;
                const isCorrect = results && oi === q.correct;
                const isWrong = results && isSelected && oi !== q.correct;
                let bg = 'var(--surface)';
                let borderColor = 'var(--border)';
                if (results && isCorrect) { bg = 'rgba(46,106,63,.08)'; borderColor = 'var(--success)'; }
                if (results && isWrong) { bg = 'rgba(138,43,38,.08)'; borderColor = 'var(--danger)'; }
                if (!results && isSelected) { bg = 'var(--accent-subtle)'; borderColor = 'var(--accent)'; }
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => handleSelect(q.id, oi)}
                    disabled={readOnly || checked}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: (readOnly || checked) ? 'default' : 'pointer',
                      padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`,
                      background: bg, color: 'var(--text)', fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)', textAlign: 'left', transition: 'border-color .15s, background .15s',
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-xs)', flexShrink: 0,
                      background: results && isCorrect ? 'var(--success)' : (results && isWrong ? 'var(--danger)' : (isSelected ? 'var(--accent)' : 'var(--faint)')),
                      color: 'white',
                    }}>{String.fromCharCode(65 + oi)}</span>
                    <span>{opt}</span>
                    {results && isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--success)' }}><Icon.check size={14} color="var(--success)" /></span>}
                    {results && isWrong && <span style={{ marginLeft: 'auto', color: 'var(--danger)' }}><Icon.close size={14} color="var(--danger)" /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Check / Results */}
      {!checked ? (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="sm" onClick={handleCheck} disabled={Object.keys(answers).length === 0}>
            <Icon.check size={13} /> Check answers
          </Button>
        </div>
      ) : (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          background: results && results.hits === results.total ? 'rgba(46,106,63,.1)' : 'rgba(184,118,26,.1)',
          border: `1px solid ${results && results.hits === results.total ? 'var(--success)' : 'var(--warning)'}`,
          fontSize: 'var(--text-sm)', fontWeight: 600, color: results && results.hits === results.total ? 'var(--success)' : 'var(--warning-text)',
        }}>
          {results.hits} / {results.total} correct
          {results.hits === results.total ? ' — Great work!' : ''}
        </div>
      )}
      {checked && ex.explanation && (
        <div className="exercise-callout exercise-callout--explanation" style={{ marginTop: 10 }}>
          <strong className="exercise-callout-kicker">Explanation</strong>
          {ex.explanation}
        </div>
      )}
    </div>
  );
}

const CONFIDENCE_LEVELS = [
  { value: 0, label: 'Guess', desc: 'I was mostly guessing' },
  { value: 1, label: 'Not sure', desc: 'I am unsure about my answers' },
  { value: 2, label: 'Pretty sure', desc: 'I feel fairly confident' },
  { value: 3, label: 'Very sure', desc: 'I am confident I did well' },
];

export function HomeworkStepThrough({ exercises, responses, onResponse, onSubmit, onSave, initialExerciseId, currentExerciseRef, onNavigate, readOnly = false }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [confidence, setConfidence] = useState(null);
  const [showConfidence, setShowConfidence] = useState(false);

  useEffect(() => {
    if (!initialExerciseId || !Array.isArray(exercises)) return;
    const idx = exercises.findIndex(ex => ex.id === initialExerciseId);
    if (idx >= 0) setCurrentIdx(idx);
  }, [initialExerciseId, exercises]);

  useEffect(() => {
    if (currentExerciseRef && exercises?.[currentIdx]?.id) {
      currentExerciseRef.current = exercises[currentIdx].id;
    }
  }, [currentIdx, exercises, currentExerciseRef]);

  if (!exercises || exercises.length === 0) return null;

  const total = exercises.length;
  const current = exercises[currentIdx];
  const currentRes = responses?.[current?.id] || {};
  const progress = ((currentIdx + 1) / total) * 100;

  const goPrev = () => {
    if (onNavigate && exercises[currentIdx]?.id) onNavigate(exercises[currentIdx].id);
    setCurrentIdx(i => Math.max(i - 1, 0));
  };
  const goNext = () => {
    if (onNavigate && exercises[currentIdx]?.id) onNavigate(exercises[currentIdx].id);
    setCurrentIdx(i => Math.min(i + 1, total - 1));
  };
  const isLast = currentIdx === total - 1;

  function handleSubmitClick() {
    if (isLast && !showConfidence) {
      setShowConfidence(true);
      return;
    }
    onSubmit?.(confidence);
  }

  if (showConfidence) {
    return (
      <div className="student-step-through">
        <div className="student-step-progress">
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-2)' }}>
            Almost done! How confident are you?
          </span>
          <div style={{ flex: 1, height: 5, background: 'var(--divider)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 'var(--radius-pill)' }} />
          </div>
        </div>

        <Card small className="student-exercise-mini-card" style={{ marginBottom: 10 }}>
          <div style={{ padding: '8px 0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-base)', color: 'var(--text)' }}>How sure are you about your answers?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CONFIDENCE_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setConfidence(level.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${confidence === level.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: confidence === level.value ? 'var(--accent-subtle)' : 'var(--surface)',
                    color: 'var(--text)', fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)', textAlign: 'left', transition: 'border-color .15s, background .15s',
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                    fontSize: 'var(--text-xs)', flexShrink: 0,
                    background: confidence === level.value ? 'var(--accent)' : 'var(--faint)',
                    color: confidence === level.value ? 'white' : 'var(--text-2)',
                  }}>{level.value + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{level.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 2 }}>{level.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="student-step-actions">
          <Button variant="ghost" size="sm" onClick={() => { setShowConfidence(false); setConfidence(null); }}>
            <Icon.arrowL size={12} /> Back
          </Button>
          <Button variant="primary" onClick={handleSubmitClick} disabled={confidence === null}>
            <Icon.check size={13} /> Submit Homework
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-step-through">
      {/* Progress bar */}
      <div className="student-step-progress">
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
          Exercise {currentIdx + 1} / {total}
        </span>
        <div style={{ flex: 1, height: 5, background: 'var(--divider)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 'var(--radius-pill)', transform: `scaleX(${progress / 100})`, transformOrigin: 'left', transition: 'transform 0.3s var(--ease)' }} />
        </div>
      </div>

      {/* Current exercise — slower transition for cognitively demanding types */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: ['fix','short','speak','order'].includes(current?.type) ? 0.38 : 0.18, ease: 'easeOut' }}
        >
          <Card small className="student-exercise-mini-card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <ExTypeBadge typeId={current.type} size="md" />
            </div>
            <ExercisePlayer
              exercise={current}
              response={currentRes}
              onResponse={(updated) => onResponse?.(current.id, updated)}
              readOnly={readOnly}
            />
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="student-step-actions">
        <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIdx === 0}>
          <Icon.arrowL size={12} /> Previous
        </Button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={() => onSave?.(current?.id)} disabled={readOnly}>
            <Icon.check size={12} /> Save progress
          </Button>
          {isLast ? (
            <Button variant="primary" onClick={handleSubmitClick} disabled={readOnly}>
              <Icon.check size={13} /> Submit Homework
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={goNext}>
              Next <Icon.arrowR size={12} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

