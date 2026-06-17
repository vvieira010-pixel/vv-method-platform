import { useState, useMemo, useEffect } from 'react';
import { STUDENTS, SAMPLE_DX, SAMPLE_HW, ERRORS_BY_STUDENT, SKILL_LABELS, CYCLE_CONFIG } from '../lib/data';
import { Avatar, cycleLabel, cycleTone, fmtDate, hwTone, toast } from '../lib/utils';
import Markdown from 'react-markdown';
import { UserPlus, Calendar, Activity, X, Sparkles, Check, Loader2, Sparkles as SparklesIcon, Eye, Send } from 'lucide-react';

export function Students() {
  const [q, setQ] = useState('');
  const filtered = q
    ? STUDENTS.filter(
        (s) =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.id.toLowerCase().includes(q.toLowerCase())
      )
    : STUDENTS;

  return (
    <div className="page active">
      <div className="page-inner">
        <div className="sec-hdr mb-6">
          <div>
            <h1 className="page-title">Students</h1>
            <p className="page-sub">{STUDENTS.length} students in your roster</p>
          </div>
          <button className="btn btn-primary" onClick={() => toast('Student form coming soon')}>
            <UserPlus size={14} className="mr-1" /> Add Student
          </button>
        </div>
        <div className="mb-4">
          <input className="inp max-w-[320px]" placeholder="Search students by name or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <div className="card p-[32px] text-center text-[var(--muted)]">No students match your search.</div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="card card-sm mb-2 p-3">
              <div className="flex items-center gap-[12px] flex-wrap">
                <Avatar name={s.name} size={36} />
                <div className="flex-1 min-w-[160px]">
                  <div className="font-bold text-[14.5px]">{s.name}</div>
                  <div className="text-[11.5px] text-[var(--muted)] mt-[2px]">
                    {s.band} → {s.bandTarget} · {s.goal}
                    {s.email ? ' · ' + s.email : ''}
                  </div>
                </div>
                <span className="pill p-muted">{s.band}</span>
                <span className="text-[11.5px] text-[var(--muted)]">Session {s.session}/{s.totalSessions}</span>
                <span className={"pill " + cycleTone(s.cycle)}>{cycleLabel(s.cycle)}</span>
                <div className="flex gap-[6px] items-center">
                  <button className="btn btn-primary btn-sm" onClick={() => toast("Opening " + s.firstName + " profile")}>View Profile</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function CalendarPage() {
  return (
    <div className="page active">
      <div className="page-inner">
        <h1 className="page-title mb-2">Calendar</h1>
        <p className="page-sub mb-6">Schedule and track your classes.</p>
        <div className="card p-[40px] text-center">
          <Calendar size={48} className="mx-auto mb-4 text-[var(--muted)]" />
          <p className="text-[var(--muted)] text-[14px]">No classes scheduled for today.</p>
          <button className="btn btn-primary btn-sm mt-4" onClick={() => toast('Class scheduling coming soon')}>
            Schedule a class
          </button>
        </div>
      </div>
    </div>
  );
}

export function Diagnostics() {
  return (
    <div className="page active">
      <div className="page-inner">
        <div className="sec-hdr mb-6">
          <div>
            <h1 className="page-title">Diagnostics</h1>
            <p className="page-sub">{SAMPLE_DX.length} total · {SAMPLE_DX.filter((d) => d.status === 'approved').length} approved</p>
          </div>
          <button className="btn btn-primary" onClick={() => toast('Run a new diagnosis')}>
            <Activity size={14} className="mr-1" /> New Diagnosis
          </button>
        </div>
        <div>
          {SAMPLE_DX.map((dx) => (
            <div key={dx.id} className="card card-sm dx-row mb-2">
              <div className="flex items-center gap-[12px] flex-wrap">
                <Avatar name={dx.studentName} size={34} />
                <div className="flex-1 min-w-[160px]">
                  <div className="font-bold text-[13px]">{dx.studentName}</div>
                  <div className="text-[11.5px] text-[var(--muted)] mt-1">{fmtDate(dx.date)} · {dx.summary.slice(0, 70)}…</div>
                </div>
                <span className="text-[11.5px] text-[var(--muted)]">{dx.approved}/{dx.sections} approved</span>
                <span className={"pill " + (dx.status === 'approved' ? 'p-success' : 'p-warning')}>{dx.status}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => toast('Opening diagnosis review')}>
                  {dx.status === 'approved' ? 'View' : 'Review'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Homework() {
  return (
    <div className="page active">
      <div className="page-inner">
        <div className="sec-hdr mb-6">
          <div>
            <h1 className="page-title">Homework</h1>
            <p className="page-sub">{SAMPLE_HW.length} total</p>
          </div>
        </div>
        <div>
          {SAMPLE_HW.map((h) => {
            const st = STUDENTS.find((s) => s.id === h.studentId);
            return (
              <div key={h.id} className="card card-sm mb-2">
                <div className="flex items-center gap-[12px] flex-wrap">
                  <Avatar name={st?.name || '?'} size={32} />
                  <div className="flex-1 min-w-[160px]">
                    <div className="font-bold text-[13px]">{h.title}</div>
                    <div className="text-[11.5px] text-[var(--muted)] mt-[2px]">
                      {st?.name} · {h.type} · Assigned {fmtDate(h.assignedAt)}
                    </div>
                  </div>
                  <span className={"pill " + hwTone(h.status)}>{h.status}</span>
                  {h.status === 'submitted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => toast('Reviewing')}>Review</button>
                  )}
                  <button className="btn-icon border border-[var(--border)] text-[var(--danger)]" onClick={() => toast('Deleted')}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Submissions() {
  return (
    <div className="page active">
      <div className="page-inner">
        <h1 className="page-title mb-2">Submissions</h1>
        <p className="page-sub mb-6">0 pending review</p>
        <div className="card p-[32px] text-center">
          <p className="text-[var(--muted)]">No submissions awaiting review.</p>
        </div>
      </div>
    </div>
  );
}

export function AIStudio() {
  const [mode, setMode] = useState('Mixed Interactive Set');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [strategy, setStrategy] = useState<'focused' | 'exploratory'>('focused');

  const MODES = [
    'Mixed Interactive Set',
    '5 MCQs (Grammar/Vocab)',
    '5 Fill-in-the-Blanks',
    'Match the Pairs (Vocab)',
    'True or False (Reading Context)',
    'Error Correction Exercises'
  ];

  const handleGenerate = async () => {
    if (!studentId) {
      toast('Please select a student', 'warn');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const st = STUDENTS.find(s => s.id === studentId);
      const studentName = st ? st.name : 'a student';
      const dxContext = SAMPLE_DX.find(dx => dx.studentId === studentId)?.summary || 'Needs general improvement to reach B2.';
      const errors = ERRORS_BY_STUDENT[studentId]?.map(e => e.error + ' -> ' + e.correct).join(', ') || 'No specific errors recorded.';

      const ctxt = strategy === 'focused' 
        ? `Target: B2 English. Focus strictly on these specific recent errors: ${errors}. Diagnosis summary: ${dxContext}.`
        : `Target: B2 English. Provide a broader exploratory exercise covering general B2 English concepts based on this diagnosis summary: ${dxContext}. (Do not limit only to recent errors).`;

      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentName,
          mode,
          context: ctxt
        })
      });
      
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'danger');
      } else {
        let parsed;
        try {
          if (typeof data.content === 'string') {
            let cleaned = data.content.trim();
            if (cleaned.startsWith("```")) {
              cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
            }
            parsed = JSON.parse(cleaned);
          } else {
            parsed = data.content;
          }
          setResult(parsed);
          toast('Generated successfully', 'ok');
        } catch (parseErr) {
          console.error("Failed to parse generated layout:", parseErr);
          toast('Failed to parse generated exercise. Viewing raw details.', 'warn');
          // Fallback structure in case format is fully text/non-JSON
          setResult({
            title: "Generated Exercise Details",
            description: "Here is the raw text from the generator:",
            items: [
              {
                type: "multiple_choice",
                question: String(data.content),
                options: ["Review details"],
                correctIndex: 0,
                explanation: "The model did not return a valid schema, here is the raw response."
              }
            ]
          });
        }
      }
    } catch (err) {
      toast('Failed to generate. Ensure Gemini API key is set.', 'danger');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active">
      <div className="page-inner">
        <h1 className="page-title mb-1 flex items-center gap-[10px]">
          <Sparkles className="text-[var(--accent)]" size={22} /> AI Studio
        </h1>
        <p className="page-sub mb-6">MET Content Laboratory — generate interactive exercises from student data.</p>
        <div className="g2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="card p-4">
              <div className="sec-title text-[13px] mb-3">Target Student</div>
              <select className="inp mb-4" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select student…</option>
                {STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <div className="sec-title text-[13px] mb-3">Strategy</div>
              <div className="flex gap-2 mb-4 p-1 bg-[var(--bg-deep)] rounded-[var(--r-sm)] border border-[var(--border)]">
                <button 
                  className={"flex-1 py-1.5 text-[12.5px] rounded-[var(--r-sm)] transition-colors " + (strategy === 'focused' ? 'bg-[var(--bg)] shadow-sm font-medium text-[var(--accent-deep)]' : 'text-[var(--muted)] hover:text-[var(--text)]')}
                  onClick={() => setStrategy('focused')}
                >
                  Focused
                </button>
                <button 
                  className={"flex-1 py-1.5 text-[12.5px] rounded-[var(--r-sm)] transition-colors " + (strategy === 'exploratory' ? 'bg-[var(--bg)] shadow-sm font-medium text-[var(--accent-deep)]' : 'text-[var(--muted)] hover:text-[var(--text)]')}
                  onClick={() => setStrategy('exploratory')}
                >
                  Exploratory
                </button>
              </div>

              <div className="sec-title text-[13px] mb-2">Generation Format</div>
              <div className="flex flex-col gap-2">
                {MODES.map((m) => (
                  <button key={m} className={"flex items-center gap-2 px-3 py-2 text-left rounded-[var(--r-sm)] border " + (mode === m ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-deep)]' : 'border-transparent hover:bg-[var(--bg-deep)] text-[var(--text)]')} onClick={() => setMode(m)}>
                    <Check size={16} className={mode === m ? 'opacity-100' : 'opacity-0'} /> 
                    <span className="text-[13.5px]">{m}</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-primary w-full mt-4 flex justify-center py-2.5" onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <SparklesIcon size={16} />}
                {loading ? 'Generating...' : 'Start Generation'}
              </button>
            </div>
          </div>
          <div>
            {!result && !loading ? (
              <div className="card h-full flex flex-col items-center justify-center p-[60px] text-center border-2 border-dashed border-[var(--border)] bg-transparent shadow-none">
                <SparklesIcon size={48} className="text-[var(--muted)] mb-4 opacity-50" />
                <h3 className="text-[16px] font-semibold text-[var(--muted)] mb-2">Ready for Content Creation</h3>
                <p className="text-[var(--muted)] max-w-[400px] mx-auto text-[13px]">Select a student and a generation mode to create tailored exercises based on their diagnostic data.</p>
              </div>
            ) : loading ? (
              <div className="card h-full flex flex-col items-center justify-center p-[60px] text-center">
                <Loader2 size={48} className="animate-spin text-[var(--accent)] mb-4" />
                <p className="text-[var(--text-2)] font-medium">Writing tailored content...</p>
              </div>
            ) : (
              <div className="flex flex-col h-full gap-4">
                <div className="card p-4 flex items-center justify-between">
                  <div className="text-[13px] font-medium text-[var(--muted)]">Exercise generated successfully.</div>
                  <div className="flex gap-2">
                    <button className="btn btn-quiet btn-sm flex items-center gap-2" onClick={() => setPreviewOpen(true)}>
                      <Eye size={14} /> Preview
                    </button>
                    <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => toast('Assigned to student')}>
                      <Send size={14} /> Assign
                    </button>
                  </div>
                </div>
                <div className="card p-6 min-h-[400px]">
                  <TeacherExerciseReview data={result} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl animate-[fadeUp_0.2s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="font-bold">Student Preview</div>
              <button className="btn-icon" onClick={() => setPreviewOpen(false)}><X size={16} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <InteractiveExercise data={result} />
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end">
              <button className="btn btn-primary btn-sm" onClick={() => { setPreviewOpen(false); toast('Assigned to student'); }}>Assign to Student</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherExerciseReview({ data }: { data: any }) {
  if (!data?.items) return <div className="text-[var(--muted)] text-[13px]">Invalid exercise data generated.</div>;
  return (
    <div>
      <h2 className="font-syne text-[20px] font-bold text-[var(--accent-deep)] mb-1">{data.title}</h2>
      <p className="text-[var(--text-2)] text-[13.5px] mb-6">{data.description}</p>
      <div className="flex flex-col gap-4">
        {data.items.map((item: any, i: number) => (
          <div key={i} className="border border-[var(--border)] rounded-[var(--r-md)] p-4 bg-[var(--bg-deep)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-[14px] text-[var(--accent)]">Q{i+1}</span>
              <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--border)]">{item.type.replace(/_/g, ' ')}</span>
            </div>
            
            {item.type === 'multiple_choice' && (
              <>
                <div className="font-medium text-[14px] mb-2">{item.question}</div>
                <div className="flex flex-col gap-1 text-[13px] mb-3">
                  {item.options.map((opt: string, optI: number) => (
                    <div key={optI} className={optI === item.correctIndex ? "text-[var(--success)] font-bold flex items-center gap-2" : "text-[var(--text-2)] ml-6"}>
                      {optI === item.correctIndex && <span>✓</span>}
                      {opt}
                    </div>
                  ))}
                </div>
              </>
            )}

            {item.type === 'fill_in_the_blank' && (
              <>
                <div className="font-medium text-[14px] mb-2">{item.textBefore} <span className="text-[var(--success)] font-bold underline px-1">{item.answer}</span> {item.textAfter}</div>
              </>
            )}

            {item.type === 'match_pairs' && (
              <>
                <div className="font-medium text-[14px] mb-2">{item.instruction}</div>
                <div className="grid grid-cols-2 gap-2 text-[13px] mb-3">
                  {item.pairs.map((p: any, pI: number) => (
                     <div key={pI} className="col-span-2 flex gap-4 text-[var(--text-2)]">
                        <div className="flex-1 p-2 bg-[var(--bg)] rounded border border-[var(--border)]">{p.left}</div>
                        <div className="flex items-center text-[var(--success)]">→</div>
                        <div className="flex-1 p-2 bg-[var(--bg)] rounded border border-[var(--success-soft)] font-medium text-[var(--success)]">{p.right}</div>
                     </div>
                  ))}
                </div>
              </>
            )}

            {item.type === 'true_false' && (
              <>
                <div className="font-medium text-[14px] mb-2">{item.statement}</div>
                <div className="text-[13px] font-bold text-[var(--success)] mb-3">{item.isTrue ? 'True' : 'False'}</div>
              </>
            )}

            {item.type === 'error_correction' && (
              <>
                <div className="text-[14px] mb-2 italic text-[var(--danger)] line-through">{item.sentenceWithMistake}</div>
                <div className="text-[14px] mb-3 font-medium text-[var(--success)]">{item.correctSentence}</div>
              </>
            )}

            <div className="text-[12px] text-[var(--text-2)] border-t border-[var(--border)] pt-2 mt-2">
               <strong className="text-[var(--text)]">Explanation:</strong> {item.explanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InteractiveExercise({ data }: { data: any }) {
  if (!data?.items) return <div className="text-[var(--muted)] text-[13px]">Invalid exercise data generated.</div>;
  return (
    <div>
      <h2 className="font-syne text-[20px] font-bold text-[var(--accent-deep)] mb-1">{data.title}</h2>
      <p className="text-[var(--text-2)] text-[13.5px] mb-6">{data.description}</p>
      <div className="flex flex-col gap-6">
        {data.items.map((item: any, i: number) => (
          <div key={i} className="border border-[var(--border)] rounded-[var(--r-md)] p-5">
            {item.type === 'multiple_choice' && <MCQ item={item} i={i} />}
            {item.type === 'fill_in_the_blank' && <FillBlank item={item} i={i} />}
            {item.type === 'match_pairs' && <MatchPairs item={item} i={i} />}
            {item.type === 'true_false' && <TrueFalse item={item} i={i} />}
            {item.type === 'error_correction' && <ErrorCorrection item={item} i={i} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function MCQ({ item, i }: { item: any, i: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div>
      <div className="font-bold text-[14px] mb-3"><span className="text-[var(--accent)] mr-2">{i+1}.</span>{item.question}</div>
      <div className="flex flex-col gap-[8px]">
        {item.options.map((opt: string, optI: number) => {
          let sClass = "border border-[var(--border)] rounded-[var(--r-sm)] p-3 text-[13.5px] cursor-pointer hover:bg-[var(--bg-deep)] transition";
          if (selected === optI && optI === item.correctIndex) sClass += " bg-[var(--success-bg)] border-[var(--success-soft)] text-[var(--success)] font-medium";
          else if (selected === optI) sClass += " bg-[var(--danger-bg)] border-[var(--danger-soft)] text-[var(--danger)] font-medium";
          else if (selected !== null && optI === item.correctIndex) sClass += " border-[var(--success-soft)] text-[var(--success)] font-medium";
          
          return (
            <div key={optI} className={sClass} onClick={() => selected === null && setSelected(optI)}>
              {opt}
            </div>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-4 p-3 bg-[var(--bg-deep)] rounded-[var(--r-sm)] text-[13px] text-[var(--text-2)]">
          <strong className="text-[var(--text)]">Explanation:</strong> {item.explanation}
        </div>
      )}
    </div>
  );
}

function FillBlank({ item, i }: { item: any, i: number }) {
  const [ans, setAns] = useState('');
  const [checked, setChecked] = useState(false);
  
  const isCorrect = ans.trim().toLowerCase() === String(item.answer).trim().toLowerCase();

  return (
    <div>
      <div className="text-[14px] mb-3 leading-[1.8]"><span className="text-[var(--accent)] mr-2 font-bold">{i+1}.</span>
        {item.textBefore} 
        <input 
          className={"inline-block border-b-2 bg-transparent w-[120px] mx-2 px-1 text-center outline-none " + (checked ? (isCorrect ? 'border-[var(--success)] text-[var(--success)]' : 'border-[var(--danger)] text-[var(--danger)]') : 'border-[var(--border)]')} 
          value={ans} 
          onChange={(e) => { setAns(e.target.value); setChecked(false); }}
          disabled={checked && isCorrect}
        />
        {item.textAfter}
      </div>
      {!checked ? (
        <button className="btn btn-quiet btn-sm mt-2" onClick={() => ans && setChecked(true)}>Check Answer</button>
      ) : (
        <div className="mt-2 text-[13px]">
          {isCorrect ? <span className="text-[var(--success)] font-bold">✓ Correct!</span> : <span className="text-[var(--danger)] font-bold">✗ Incorrect. <button className="ml-2 text-[var(--text-2)] underline" onClick={() => setAns('')}>Try again</button></span>}
          <div className="mt-3 p-3 bg-[var(--bg-deep)] rounded-[var(--r-sm)] text-[13px] text-[var(--text-2)]">
            <strong className="text-[var(--text)]">Explanation:</strong> {item.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchPairs({ item, i }: { item: any, i: number }) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const lefts = useMemo(() => item.pairs.map((p: any) => p.left), [item]);
  const rights = useMemo(() => [...item.pairs.map((p: any) => p.right)].sort(() => Math.random() - 0.5), [item]);

  const handleRightClick = (right: string) => {
    if (selectedLeft) {
      setMatches({ ...matches, [selectedLeft]: right });
      setSelectedLeft(null);
      setChecked(false);
    }
  };

  const isComplete = Object.keys(matches).length === lefts.length;
  
  const checkAnswers = () => {
    if (!isComplete) return;
    setChecked(true);
  };

  const score = item.pairs.filter((p: any) => matches[p.left] === p.right).length;

  return (
    <div>
      <div className="font-bold text-[14px] mb-2"><span className="text-[var(--accent)] mr-2">{i+1}.</span>{item.instruction}</div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex flex-col gap-2">
          {lefts.map((l: string) => (
            <div 
              key={l} 
              className={"p-2 px-3 border rounded-[var(--r-sm)] text-[13px] cursor-pointer transition " + (selectedLeft === l ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-deep)] font-medium' : matches[l] ? 'border-[var(--border)] bg-[var(--bg-deep)] opacity-80' : 'border-[var(--border)] hover:bg-[var(--bg-deep)]')}
              onClick={() => { setSelectedLeft(l); setChecked(false); }}
            >
              {l}
              {matches[l] && <div className="text-[11.5px] text-[var(--muted)] mt-1">↳ {matches[l]}</div>}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rights.map((r: string) => {
            const isMatched = Object.values(matches).includes(r);
            return (
              <div 
                key={r} 
                className={"p-2 px-3 border rounded-[var(--r-sm)] text-[13px] " + (isMatched ? 'border-transparent bg-transparent opacity-30 cursor-default' : 'border-[var(--border)] hover:border-[var(--accent)] cursor-pointer text-[var(--text)]')}
                onClick={() => !isMatched && handleRightClick(r)}
              >
                {r}
              </div>
            );
          })}
        </div>
      </div>
      
      {!checked ? (
        <div className="mt-4 flex gap-2">
          <button className="btn btn-primary btn-sm" disabled={!isComplete} onClick={checkAnswers}>Check Answers</button>
          <button className="btn btn-quiet btn-sm" onClick={() => { setMatches({}); setSelectedLeft(null); }}>Reset</button>
        </div>
      ) : (
        <div className="mt-4 text-[13px]">
          {score === lefts.length ? <span className="text-[var(--success)] font-bold">✓ All correct!</span> : <span className="text-[var(--danger)] font-bold">✗ {score} out of {lefts.length} correct. <button className="ml-2 text-[var(--text-2)] underline" onClick={() => { setMatches({}); setChecked(false); }}>Try again</button></span>}
          <div className="mt-3 p-3 bg-[var(--bg-deep)] rounded-[var(--r-sm)] text-[13px] text-[var(--text-2)]">
            <strong className="text-[var(--text)]">Explanation:</strong> {item.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

function TrueFalse({ item, i }: { item: any, i: number }) {
  const [ans, setAns] = useState<boolean | null>(null);

  return (
    <div>
      <div className="font-bold text-[14px] mb-3"><span className="text-[var(--accent)] mr-2">{i+1}.</span>{item.statement}</div>
      <div className="flex gap-3">
        {[true, false].map((val) => {
          let c = "flex-1 py-3 text-center border rounded-[var(--r-sm)] font-medium text-[13.5px] cursor-pointer transition ";
          if (ans === val) {
            if (val === item.isTrue) c += "border-[var(--success-soft)] bg-[var(--success-bg)] text-[var(--success)]";
            else c += "border-[var(--danger-soft)] bg-[var(--danger-bg)] text-[var(--danger)]";
          } else {
            if (ans !== null && val === item.isTrue) c += "border-[var(--success-soft)] text-[var(--success)]";
            else c += "border-[var(--border)] hover:bg-[var(--bg-deep)] text-[var(--text)]";
          }
          return (
            <div key={String(val)} className={c} onClick={() => ans === null && setAns(val)}>
              {val ? 'True' : 'False'}
            </div>
          )
        })}
      </div>
      {ans !== null && (
        <div className="mt-4 p-3 bg-[var(--bg-deep)] rounded-[var(--r-sm)] text-[13px] text-[var(--text-2)]">
          <strong className="text-[var(--text)]">Explanation:</strong> {item.explanation}
        </div>
      )}
    </div>
  );
}

function ErrorCorrection({ item, i }: { item: any, i: number }) {
  const [ans, setAns] = useState('');
  const [checked, setChecked] = useState(false);

  // very naive matching, stripping punctuation and downcasing
  const normalize = (str: string) => str.replace(/[.,!?]/g, '').trim().toLowerCase();
  const isCorrect = normalize(ans) === normalize(item.correctSentence);

  return (
    <div>
      <div className="font-bold text-[14px] mb-1"><span className="text-[var(--accent)] mr-2">{i+1}.</span> Correct the mistake:</div>
      <div className="text-[14px] text-[var(--text-2)] mb-3 italic">"{item.sentenceWithMistake}"</div>
      <input 
        className={"inp w-full mb-3 " + (checked ? (isCorrect ? 'border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]' : 'border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]') : '')} 
        value={ans} 
        onChange={(e) => { setAns(e.target.value); setChecked(false); }}
        placeholder="Type the correct sentence..."
        disabled={checked && isCorrect}
      />
      {!checked ? (
        <button className="btn btn-quiet btn-sm" onClick={() => ans && setChecked(true)}>Check</button>
      ) : (
        <div className="text-[13px]">
          {isCorrect ? <span className="text-[var(--success)] font-bold">✓ Correct!</span> : <span className="text-[var(--danger)] font-bold mb-2 block">✗ Incorrect. Expected: {item.correctSentence}</span>}
          <div className="mt-3 p-3 bg-[var(--bg-deep)] rounded-[var(--r-sm)] text-[13px] text-[var(--text-2)]">
            <strong className="text-[var(--text)]">Explanation:</strong> {item.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorBank() {
  const allErrs = useMemo(() => {
    let arr: any[] = [];
    for (const [sid, errs] of Object.entries(ERRORS_BY_STUDENT)) {
      const s = STUDENTS.find((x) => x.id === sid);
      errs.forEach((e) => arr.push({ ...e, studentName: s?.firstName || '?', sId: sid }));
    }
    return arr;
  }, []);

  return (
    <div className="page active">
      <div className="page-inner">
        <h1 className="page-title mb-2">Error Bank</h1>
        <p className="page-sub mb-6">Long-term catalogue of recurring errors.</p>
        {STUDENTS.filter((s) => ERRORS_BY_STUDENT[s.id]).map((s) => {
          const errs = ERRORS_BY_STUDENT[s.id] || [];
          return (
            <div key={s.id} className="card mb-4 p-[18px]">
              <div className="flex items-center gap-[10px] mb-[14px]">
                <Avatar name={s.name} size={32} />
                <div className="font-bold">{s.name}</div>
              </div>
              {errs.map((e, idx) => (
                <div key={idx} className="error-row" style={{ background: e.status === 'solved' ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
                  <span className="flex-1 font-semibold" style={{ color: e.status === 'solved' ? 'var(--success)' : 'var(--danger)' }}>{e.error}</span>
                  <span>→</span>
                  <span className="flex-1 font-semibold text-[var(--success)]">{e.correct}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Reports() {
  const [filterCycle, setFilterCycle] = useState('all');
  const filteredStudents = useMemo(() => filterCycle === 'all' ? STUDENTS : STUDENTS.filter(s => s.cycle === filterCycle), [filterCycle]);
  const [studentId, setStudentId] = useState(filteredStudents[0]?.id || '');
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    if (filteredStudents.length > 0 && !filteredStudents.find(s => s.id === studentId)) {
      setStudentId(filteredStudents[0].id);
      setReportGenerated(false);
    } else if (filteredStudents.length === 0) {
      setStudentId('');
      setReportGenerated(false);
    }
  }, [filterCycle, filteredStudents, studentId]);

  const s = STUDENTS.find((x) => x.id === studentId);

  return (
    <div className="page active">
      <div className="page-inner page-inner-sm">
        <h1 className="page-title mb-1">Reports</h1>
        <p className="page-sub mb-6">Generate progress reports per student.</p>
        <div className="card p-[18px] mb-5">
          <div className="flex gap-[10px] items-end flex-wrap">
            <select className="inp max-w-[180px]" value={filterCycle} onChange={(e) => setFilterCycle(e.target.value)}>
              <option value="all">All Stages</option>
              {Object.entries(CYCLE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select className="inp flex-1 min-w-[160px]" value={studentId} onChange={(e) => { setStudentId(e.target.value); setReportGenerated(false); }} disabled={filteredStudents.length === 0}>
              {filteredStudents.length === 0 && <option value="">No students in this stage</option>}
              {filteredStudents.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => { setReportGenerated(true); toast('Report generated'); }} disabled={filteredStudents.length === 0}>Generate Report</button>
          </div>
        </div>
        {reportGenerated && s && (
          <div className="card p-5 animate-[fadeUp_.22s_var(--ease)_both]">
            <div className="flex items-center gap-[14px]">
              <Avatar name={s.name} size={48} />
              <div>
                <h2 className="font-syne text-[18px] font-bold m-0">{s.name}</h2>
                <p className="text-[var(--muted)] text-[13px] mt-1 m-0">{s.band} → {s.bandTarget}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="page active">
      <div className="page-inner page-inner-sm">
        <h1 className="page-title mb-2">Settings</h1>
        <div className="card p-5">
          <div className="sec-title mb-3">AI Keys</div>
          <input className="inp" type="password" placeholder="gsk_…" />
          <button className="btn btn-primary btn-sm mt-[14px]" onClick={() => toast('Keys saved')}>Save keys</button>
        </div>
      </div>
    </div>
  );
}
