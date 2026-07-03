/**
 * exercise-player-new-types.jsx — Players for dialogue, swap, and levelup types.
 */
import { useState, useEffect, useCallback } from 'react';
import { Icon } from './shared.jsx';
import { Button } from './ui/Button.jsx';

/* ─── DIALOGUE PLAYER ──────────────────────────────────────── */
export function DialoguePlayer({ ex, res, update, readOnly }) {
  const lines = (ex.lines || []).filter(l => l.text?.trim());
  const [mode, setMode] = useState(res?.mode || 'read');
  const [revealed, setRevealed] = useState(new Set(res?.linesRevealed || []));
  const [activeLine, setActiveLine] = useState(null);
  const [playing, setPlaying] = useState(false);


  const speakerName = (s) => s === 'A' ? (ex.speakerA || 'Speaker A') : (ex.speakerB || 'Speaker B');
  const practiceRole = mode === 'practiceA' ? 'A' : mode === 'practiceB' ? 'B' : null;
  const isHidden = (line) => practiceRole && line.speaker === practiceRole && !revealed.has(line.id);

  const reveal = (id) => {
    const next = new Set(revealed);
    next.add(id);
    setRevealed(next);
    if (!readOnly) update({ linesRevealed: [...next], mode });
  };

  const changeMode = (m) => {
    setMode(m);
    setRevealed(new Set());
    stopTTS();
    if (!readOnly) update({ mode: m, linesRevealed: [] });
  };

  function stopTTS() {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setActiveLine(null);
  }

  function playAll() {
    if (!window.speechSynthesis) return;
    stopTTS();
    setPlaying(true);
    const visibleLines = lines.filter(l => !isHidden(l));
    let i = 0;
    const speakNext = () => {
      if (i >= visibleLines.length) { setPlaying(false); setActiveLine(null); return; }
      const line = visibleLines[i];
      setActiveLine(line.id);
      const u = new SpeechSynthesisUtterance(line.text);
      u.onend = () => { i++; speakNext(); };
      window.speechSynthesis.speak(u);
    };
    speakNext();
  }

  function speakLine(text) {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis?.speak(u);
  }

  useEffect(() => () => stopTTS(), []);

  const modeTabs = [
    { id: 'read', label: 'Read' },
    { id: 'practiceA', label: `Practice ${ex.speakerA || 'A'}` },
    { id: 'practiceB', label: `Practice ${ex.speakerB || 'B'}` },
  ];

  const speakerColor = (s) => s === 'A' ? '#0E5F6B' : '#5A2C5C';

  return (
    <div>
      {ex.instruction && (
        <p style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontStyle: 'italic' }}>{ex.instruction}</p>
      )}
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {modeTabs.map(t => (
          <button key={t.id} onClick={() => changeMode(t.id)}
            style={{
              padding: '5px 14px', borderRadius: 0, border: '1.5px solid',
              fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
              borderColor: mode === t.id ? '#0E5F6B' : 'var(--border)',
              background: mode === t.id ? '#0E5F6B' : 'var(--surface)',
              color: mode === t.id ? '#fff' : 'var(--text-2)',
              transition: 'all .15s',
            }}>
            {t.label}
          </button>
        ))}
        <button onClick={playing ? stopTTS : playAll}
          style={{
            marginLeft: 'auto', padding: '5px 14px', borderRadius: 0,
            border: '1.5px solid var(--border)', fontSize: 'var(--text-xs)',
            fontWeight: 700, cursor: 'pointer', background: 'var(--surface)',
            color: 'var(--text-2)',
          }}>
          {playing ? <><Icon.stop size={12} /> Stop</> : <><Icon.play size={12} /> Play all</>}
        </button>
      </div>

      {/* Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lines.map((line) => {
          const hidden = isHidden(line);
          const isActive = activeLine === line.id;
          const isA = line.speaker === 'A';

          return (
            <div key={line.id} style={{
              display: 'flex', gap: 10,
              flexDirection: isA ? 'row' : 'row-reverse',
              alignItems: 'flex-start',
              background: isActive ? 'rgba(14,95,107,0.06)' : 'transparent',
              borderRadius: 'var(--radius-sm)', padding: '4px 6px',
              transition: 'background .2s',
            }}>
              <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                background: speakerColor(line.speaker), color: '#fff',
                display: 'grid', placeItems: 'center', fontWeight: 700,
                fontSize: 'var(--text-xs)',
              }}>
                {line.speaker}
              </div>
              <div style={{ maxWidth: '72%' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 3 }}>
                  {speakerName(line.speaker)}
                </div>
                {hidden ? (
                  <button onClick={() => reveal(line.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 0,
                      border: '1.5px dashed var(--border)', background: 'var(--bg)',
                      cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--muted)',
                    }}>
                    Reveal my line
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block', padding: '9px 14px', borderRadius: 0,
                      background: isA ? 'rgba(14,95,107,.1)' : 'rgba(90,44,92,.1)',
                      color: 'var(--text)', fontSize: 'var(--text-sm)', lineHeight: 1.45,
                    }}>
                      {line.text}
                    </span>
                    <button onClick={() => speakLine(line.text)}
                      title="Listen"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, fontSize: 14 }}>
                      <Icon.volume size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lines.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>No dialogue lines yet.</p>
      )}
    </div>
  );
}

/* ─── SWAP PLAYER ──────────────────────────────────────────── */
export function SwapPlayer({ ex, res, update, readOnly }) {
  const swaps = ex.swaps || [];
  const sentence = ex.sentence || '';
  const selections = res?.swaps || {};
  const [open, setOpen] = useState(null);

  const segments = sentence.split(/(\[[^\]]+\])/);

  const getSwap = (word) => swaps.find(s => s.word === word);
  const getResult = (swapId) => {
    if (!(swapId in selections)) return null;
    const swap = swaps.find(s => s.id === swapId);
    if (!swap) return null;
    return selections[swapId] === swap.correct ? 'correct' : 'wrong';
  };
  const allDone = swaps.length > 0 && swaps.every(s => s.id in selections);

  const handleSelect = (swap, optIdx) => {
    if (readOnly) return;
    update({ swaps: { ...selections, [swap.id]: optIdx } });
    setOpen(null);
  };

  return (
    <div>
      {ex.instruction && (
        <p style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontStyle: 'italic' }}>{ex.instruction}</p>
      )}
      <div style={{ fontSize: 'var(--text-base)', lineHeight: 2.2, position: 'relative' }}>
        {segments.map((seg, i) => {
          if (!/^\[.*\]$/.test(seg)) return <span key={i}>{seg}</span>;
          const word = seg.slice(1, -1);
          const swap = getSwap(word);
          if (!swap) return <span key={i} style={{ color: '#5A2C5C', fontWeight: 600 }}>{word}</span>;

          const result = getResult(swap.id);
          const chosen = swap.id in selections ? swap.options[selections[swap.id]] : null;
          const isOpen = open === swap.id;

          const chipBg = result === 'correct' ? 'rgba(34,139,34,.12)' : result === 'wrong' ? 'rgba(200,50,50,.1)' : 'rgba(197,160,89,.15)';
          const chipColor = result === 'correct' ? '#226B22' : result === 'wrong' ? '#C03030' : '#7A5C10';
          const chipBorder = result === 'correct' ? '1.5px solid var(--success)' : result === 'wrong' ? '1.5px solid #C03030' : '1.5px dashed #C5A059';

          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => !readOnly && !result && setOpen(isOpen ? null : swap.id)}
                style={{
                  padding: '3px 10px', borderRadius: 'var(--radius-sm)', cursor: result || readOnly ? 'default' : 'pointer',
                  border: chipBorder, background: chipBg, color: chipColor,
                  fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'inherit',
                  transition: 'all .15s',
                }}>
                {chosen || word} {result === 'correct' ? <Icon.check size={12} color="var(--success)" /> : result === 'wrong' ? <Icon.close size={12} color="var(--danger)" /> : '▾'}
              </button>
              {isOpen && !readOnly && (
                <div style={{
                  position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: 8, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                  minWidth: 180,
                }}>
                  {(swap.options || []).filter(Boolean).map((opt, j) => (
                    <button key={j} onClick={() => handleSelect(swap, j)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '7px 12px', borderRadius: 0, border: 'none',
                        background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)',
                        color: 'var(--text)', fontFamily: 'inherit',
                        transition: 'background .1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      {String.fromCharCode(65 + j)}. {opt}
                    </button>
                  ))}
                </div>
              )}
            </span>
          );
        })}
      </div>

      {allDone && swaps.every(s => getResult(s.id) === 'correct') && (
        <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 0, background: 'var(--success-bg)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: 'var(--text-sm)', textAlign: 'center' }}>
          Sentence upgraded to B2!
        </div>
      )}
    </div>
  );
}

/* ─── LEVELUP PLAYER ───────────────────────────────────────── */
export function LevelUpPlayer({ ex, res, update, readOnly }) {
  const [levelShown, setLevelShown] = useState('b1');
  const [submitted, setSubmitted] = useState(res?.submitted || false);
  const selected = res?.selected ?? null;
  const sandbox = res?.sandbox || '';
  const keywords = ex.keywords || [];

  const options = (ex.options || []).filter(Boolean);
  const correct = ex.correct ?? 0;

  const submit = () => {
    if (selected === null || readOnly) return;
    setSubmitted(true);
    if (!readOnly) update({ selected, sandbox, submitted: true });
  };

  const pick = (i) => {
    if (submitted || readOnly) return;
    update({ selected: i, sandbox, submitted: false });
  };

  const levelConfig = {
    b1: { label: 'B1', color: '#6B7280', bg: 'rgba(107,114,128,.1)', text: ex.b1 },
    b2: { label: 'B2', color: '#1A5C2A', bg: 'rgba(26,92,42,.1)', text: ex.b2 },
    c1: { label: 'C1', color: '#5A2C5C', bg: 'rgba(90,44,92,.1)', text: ex.c1 },
  };

  return (
    <div>
      {/* Level tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['b1', 'b2', 'c1']).filter(l => levelConfig[l].text).map(l => {
          const cfg = levelConfig[l];
          const active = levelShown === l;
          return (
            <button key={l} onClick={() => setLevelShown(l)}
              style={{
                padding: '4px 14px', borderRadius: 0, border: '1.5px solid',
                fontWeight: 700, fontSize: 'var(--text-xs)', cursor: 'pointer',
                borderColor: active ? cfg.color : 'var(--border)',
                background: active ? cfg.bg : 'var(--surface)',
                color: active ? cfg.color : 'var(--muted)',
                transition: 'all .15s',
              }}>
              {cfg.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 16, background: levelConfig[levelShown].bg, border: '1px solid', borderColor: levelConfig[levelShown].color + '40', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text)' }}>
        {levelConfig[levelShown].text || <em style={{ color: 'var(--muted)' }}>No {levelShown.toUpperCase()} sentence defined.</em>}
      </div>

      {/* MCQ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 8 }}>
          Which is the B2 upgrade?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {options.map((opt, i) => {
            const isSelected = selected === i;
            const isRight = i === correct;
            let bg = 'var(--surface)', border = '1px solid var(--border)', color = 'var(--text)';
            if (submitted) {
              if (isRight) { bg = 'var(--success-bg)'; border = '1.5px solid var(--success)'; color = '#226B22'; }
              else if (isSelected) { bg = 'rgba(200,50,50,.08)'; border = '1.5px solid #C03030'; color = '#C03030'; }
            } else if (isSelected) {
              bg = 'var(--accent-subtle)'; border = '1.5px solid var(--primary)'; color = 'var(--primary)';
            }
            return (
              <button key={i} onClick={() => pick(i)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border, background: bg, cursor: submitted || readOnly ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', color, transition: 'all .15s' }}>
                <span style={{ fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{String.fromCharCode(65 + i)}.</span>
                <span style={{ fontSize: 'var(--text-sm)', lineHeight: 1.45 }}>{opt}</span>
                {submitted && isRight && <span style={{ marginLeft: 'auto', flexShrink: 0 }}><Icon.check size={12} color="var(--success)" /></span>}
                {submitted && isSelected && !isRight && <span style={{ marginLeft: 'auto', flexShrink: 0 }}><Icon.close size={12} color="var(--danger)" /></span>}
              </button>
            );
          })}
        </div>
        {!submitted && !readOnly && selected !== null && (
          <Button variant="primary" size="sm" onClick={submit} style={{ marginTop: 10 }}>Check answer</Button>
        )}
        {submitted && ex.explanation && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(14,95,107,.07)', borderRadius: 0, fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.5 }}>
            {ex.explanation}
          </div>
        )}
      </div>

      {/* Sandbox */}
      <div>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 8 }}>
          Write your own B2 version
        </div>
        <textarea
          className="input" rows={3}
          disabled={readOnly}
          value={sandbox}
          onChange={e => { if (!readOnly) update({ selected, sandbox: e.target.value, submitted }); }}
          placeholder="Rewrite the B1 sentence at B2 level…"
        />
        {keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {keywords.map(kw => {
              const found = sandbox.toLowerCase().includes(kw.toLowerCase());
              return (
                <span key={kw} style={{
                  padding: '3px 10px', borderRadius: 0, fontSize: 'var(--text-xs)', fontWeight: 600,
                  background: found ? 'rgba(34,139,34,.12)' : 'var(--bg)',
                  color: found ? '#226B22' : 'var(--muted)',
                  border: found ? '1px solid var(--success)' : '1px solid var(--border)',
                  transition: 'all .2s',
                }}>
                  {found ? <Icon.check size={10} color="var(--success)" /> : ''}{kw}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

