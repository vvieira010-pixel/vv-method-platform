import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeader } from '../components/ui/SectionHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { FormField } from '../components/ui/FormField.jsx';
import { getDiagnoses } from '../lib/workflow.js';
import { callAI } from '../lib/callAI.js';
import { buildTeacherSelfEvaluationReviewPrompt } from '../lib/prompts.js';

const EVALUATION_CATEGORIES = [
  {
    id: 'planning',
    title: '1. Lesson Planning',
    description: 'I check whether my lesson had a clear objective, matched the exam task, and followed a logical sequence such as model analysis, pre-writing or pre-speaking preparation, practice, and revision.',
    questions: [
      'Did I define the skill focus clearly?',
      'Did the lesson match the exam format and level?',
      'Did I prepare examples, prompts, and support material?',
      'Did I include enough time for practice and feedback?',
    ],
    ratingLabels: { 1: 'Not clear', 2: 'Partly clear', 3: 'Clear', 4: 'Very clear and well-structured' }
  },
  {
    id: 'clarity',
    title: '2. Clarity of Instruction',
    description: 'I evaluate whether my explanations were direct, simple, and easy for students to follow.',
    questions: [
      'Did I explain the task clearly before practice?',
      'Did students understand what they needed to do?',
      'Did I give step-by-step guidance?',
      'Was I straight to the point when needed?',
    ],
    ratingLabels: { 1: 'Confusing', 2: 'Sometimes clear', 3: 'Mostly clear', 4: 'Very clear and efficient' }
  },
  {
    id: 'skill',
    title: '3. Teaching the Exam Skill',
    description: 'I check whether I taught the actual skill being tested, not only general English.',
    questions: [
      'Did I teach students how to answer the task successfully?',
      'Did I focus on the correct assessment criteria?',
      'Did I connect classroom practice to exam performance?',
      'Did I show students what a strong answer looks like?',
    ],
    ratingLabels: { 1: 'Weak connection to exam', 2: 'Partial connection', 3: 'Good connection', 4: 'Strong and explicit connection' }
  },
  {
    id: 'practice',
    title: '4. Student Practice Time',
    description: 'I evaluate whether students had enough time to actually produce language.',
    questions: [
      'Did students speak or write enough during class?',
      'Did I avoid talking too much myself?',
      'Did I give timed practice when appropriate?',
      'Did students have a chance to try again after feedback?',
    ],
    ratingLabels: { 1: 'Very little practice', 2: 'Some practice', 3: 'Good practice time', 4: 'Excellent and purposeful practice' }
  },
  {
    id: 'feedback',
    title: '5. Feedback Quality',
    description: 'I check whether my feedback was specific, actionable, and connected to the rubric.',
    questions: [
      'Did I give feedback linked to clear criteria?',
      'Did I mention strengths and not only mistakes?',
      'Did I explain how to improve?',
      'Did I ask for rewriting, re-speaking, or correction after feedback?',
    ],
    ratingLabels: { 1: 'Too vague', 2: 'Partly useful', 3: 'Useful and relevant', 4: 'Precise, balanced, and actionable' }
  },
  {
    id: 'correction',
    title: '6. Error Correction',
    description: 'I evaluate how well I corrected grammar, vocabulary, pronunciation, and organization without overwhelming the student.',
    questions: [
      'Did I correct the most important errors first?',
      'Did I focus on errors that affect meaning or score?',
      'Did I help students notice patterns in their mistakes?',
      'Did I balance correction with encouragement?',
    ],
    ratingLabels: { 1: 'Ineffective', 2: 'Inconsistent', 3: 'Effective', 4: 'Very effective and well-balanced' }
  },
  {
    id: 'atmosphere',
    title: '7. Student Support and Atmosphere',
    description: 'I check whether I created a supportive and warm environment.',
    questions: [
      'Was my tone warm and respectful?',
      'Did I encourage participation from all students?',
      'Did students feel safe making mistakes?',
      'Did I stay patient and didactic?',
    ],
    ratingLabels: { 1: 'Weak support', 2: 'Acceptable', 3: 'Supportive', 4: 'Very supportive and motivating' }
  },
  {
    id: 'strategies',
    title: '8. Use of Strategies',
    description: 'I evaluate whether I taught useful strategies, not only content.',
    questions: [
      'Did I teach a strategy students can reuse independently?',
      'Did I use organizers, prompts, or guiding questions?',
      'Did I help students expand answers with details and examples?',
      'Did I train students to self-assess?',
    ],
    ratingLabels: { 1: 'No clear strategy', 2: 'Limited strategy use', 3: 'Good strategy use', 4: 'Strong and reusable strategy training' }
  },
  {
    id: 'level',
    title: '9. Alignment With Level',
    description: 'I check whether my lesson matched the learner\'s CEFR level and needs.',
    questions: [
      'Was the level appropriate for the student?',
      'Did I expect too much or too little?',
      'Did I scaffold enough for weaker learners?',
      'Did I push stronger learners to elaborate more?',
    ],
    ratingLabels: { 1: 'Poorly matched', 2: 'Partly matched', 3: 'Well matched', 4: 'Very well matched and differentiated' }
  },
  {
    id: 'nextstep',
    title: '10. Reflection and Next Step',
    description: 'I evaluate whether I finished the lesson with a clear next action.',
    questions: [
      'Did I identify the student\'s main weakness?',
      'Did I set one clear target for the next class?',
      'Did I record progress clearly?',
      'Did I leave the student knowing what to practice next?',
    ],
    ratingLabels: { 1: 'No follow-up', 2: 'Weak follow-up', 3: 'Clear follow-up', 4: 'Strong and focused follow-up' }
  },
];

function getPriorityItems(dx) {
  if (!dx) return [];
  return Array.isArray(dx?.priorityDiagnosis)
    ? dx.priorityDiagnosis
    : Array.isArray(dx?.sections?.priorityDiagnosis?.content)
      ? dx.sections.priorityDiagnosis.content
      : [];
}

function getClassSummary(dx) {
  if (!dx) return '';
  return dx.classSummary || dx.sections?.classSummary?.content || dx.content?.classSummary || '';
}

export default function TeacherEvaluationPage({ students = [], onNavigate }) {
  const [ratings, setRatings] = useState(
    EVALUATION_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {})
  );
  const [reflections, setReflections] = useState({
    workedWell: '',
    toImprove: '',
    studentTarget: '',
  });
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dx, setDx] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (!selectedStudent) { setDx(null); return; }
    getDiagnoses(selectedStudent).then(list => {
      setDx(list?.[0] || null);
    }).catch(() => setDx(null));
  }, [selectedStudent]);

  const priorities = getPriorityItems(dx);
  const summary = getClassSummary(dx);

  const totalScore = Object.values(ratings).reduce((sum, r) => sum + r, 0);

  const getScoreInterpretation = (score) => {
    if (score >= 36) return { text: 'Excellent teaching performance.', color: 'var(--success)' };
    if (score >= 28) return { text: 'Strong lesson, with a few points to improve.', color: 'var(--accent)' };
    if (score >= 20) return { text: 'Acceptable, but several areas need attention.', color: 'var(--warning)' };
    return { text: 'Lesson needs restructuring and clearer teaching choices.', color: 'var(--danger)' };
  };

  const handleRatingChange = (catId, val) => {
    setRatings(prev => ({ ...prev, [catId]: val }));
  };

  const handleReflectionChange = (field, val) => {
    setReflections(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    const payload = { ratings, reflections };
    if (selectedStudent) payload.studentId = selectedStudent;
    console.warn('Saving evaluation:', payload);
    if (window.toast) {
      window.toast('Evaluation saved successfully (simulated)', 'success');
    } else {
      console.warn('Evaluation saved successfully (simulated)');
    }
  };

  const handleAIReview = async () => {
    if (!selectedStudent || !dx) {
      window.toast?.('Please select a student to ground the AI review in their diagnostic', 'warn');
      return;
    }

    setIsReviewing(true);
    setAiReview(null);
    try {
      const student = students.find(s => s.id === selectedStudent);
      const prompt = buildTeacherSelfEvaluationReviewPrompt({
        student,
        dx,
        ratings,
        reflections
      });
      const result = await callAI(prompt);
      const parsed = JSON.parse(result);
      setAiReview(parsed);
      window.toast?.('AI Review generated', 'success');
    } catch (e) {
      console.error('AI Review failed:', e);
      window.toast?.('AI Review failed to generate', 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  const urgencyColor = (u) => {
    if (u === 'Critical') return 'var(--danger)';
    if (u === 'Developing') return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="page-shell">
       <SectionHeader
         title="Teacher Self-Evaluation"
         sub={selectedStudent
           ? `Evaluating lesson for ${students.find(s => s.id === selectedStudent)?.name || selectedStudent}`
           : 'Select a student below to ground your evaluation in their diagnostic, or rate yourself generically'}
         action={
           <div className="flex gap-2">
             <Button variant="secondary" onClick={handleAIReview} disabled={isReviewing}>
               {isReviewing ? 'Analyzing...' : 'AI Review'}
             </Button>
             <Button variant="primary" onClick={handleSave}>Save Evaluation</Button>
           </div>
         }
       />


      <div className="teacher-evaluation-container">
        <Card className="mb-4">
          <div className="flex items-center" style={{ gap: 12, padding: 'var(--space-3) var(--space-4)' }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text)' }}>
              Student:
            </label>
            <select
              className="input"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              style={{ maxWidth: 300 }}
            >
              <option value="">— No student (generic evaluation) —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.level ? `(${s.level})` : ''}
                </option>
              ))}
            </select>
            {dx && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>
                <IconCheck /> Latest diagnosis loaded
              </span>
            )}
          </div>
        </Card>

        {dx && (
          <Card className="mb-6">
            <div style={{ padding: 'var(--space-4)' }}>
              <h3 className="section-title" style={{ marginBottom: 8 }}>
                Diagnostic Context — {students.find(s => s.id === selectedStudent)?.name}
              </h3>
              {summary && (
                <p className="section-sub" style={{ marginBottom: 12, lineHeight: 1.6 }}>
                  {summary}
                </p>
              )}
              {priorities.length > 0 && (
                <div className="stack-list-lg">
                  {priorities.map((p, i) => (
<div key={i} className="eval-priority-item" style={{ '--accent-color': urgencyColor(p.urgency) }}>
                      <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                          background: p.urgency === 'Critical' ? 'var(--danger-subtle)' : p.urgency === 'Developing' ? 'var(--warning-bg)' : 'var(--success-bg)',
                          color: urgencyColor(p.urgency)
                        }}>
                          #{p.rank} {p.urgency}
                        </span>
                        <strong style={{ fontSize: 'var(--text-sm)' }}>{p.area}</strong>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--text-2)' }}>
                        {p.whatToImprove}
                      </div>
                      {p.howToImprove && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 4 }}>
                          Try: {p.howToImprove}
                        </div>
                      )}
                      {p.evidence && (
                        <div style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--muted)', marginTop: 4 }}>
                          Evidence: "{p.evidence}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {priorities.length === 0 && (
                <p className="card-row-meta">No priority items in this diagnosis.</p>
              )}
            </div>
          </Card>
        )}

         <Card className="mb-6">
           <div className="text-center" style={{ padding: 'var(--space-4)' }}>
             <p className="text-xs text-uppercase" style={{ letterSpacing: '0.1em', color: 'var(--muted)' }}>
               Current Score
             </p>
             <div className="text-4xl font-bold" style={{ color: 'var(--text)' }}>
               {totalScore} <span className="text-lg" style={{ color: 'var(--muted)' }}>/ 40</span>
             </div>
             <p className="mt-2 font-semibold" style={{ color: getScoreInterpretation(totalScore).color }}>
               {getScoreInterpretation(totalScore).text}
             </p>
           </div>
         </Card>

         {aiReview && (
           <Card className="mb-6" style={{ border: '2px solid var(--accent)' }}>
             <div style={{ padding: 'var(--space-4)' }}>
               <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
                 <div style={{ background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                   AI COACH REVIEW
                 </div>
                 <h3 className="section-title" style={{ margin: 0 }}>Pedagogical Analysis</h3>
               </div>
               
               <div className="mb-6 eval-verdict" style={{ padding: 'var(--space-3)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                 <p style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', lineHeight: 1.6 }}>
                   "{aiReview.overallVerdict}"
                 </p>
               </div>

               <div className="grid-square" style={{ gap: 16, marginBottom: 20 }}>
                 <div className="col-span-1">
                   <h4 className="text-xs font-bold text-uppercase" style={{ marginBottom: 8, color: 'var(--muted)' }}>Blind Spots</h4>
                   <div className="stack-list">
                     {aiReview.blindSpots.map((bs, i) => (
                       <div key={i} style={{ fontSize: 'var(--text-sm)', marginBottom: 12, padding: 'var(--space-3)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                         <strong style={{ color: 'var(--danger)' }}>{bs.area}</strong>: {bs.observation}
                         <div style={{ fontSize: 'var(--text-xs)', marginTop: 4, color: 'var(--accent)' }}>
                           Try: {bs.suggestion}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 <div className="col-span-1">
                   <h4 className="text-xs font-bold text-uppercase" style={{ marginBottom: 8, color: 'var(--muted)' }}>Strengths</h4>
                   <div className="stack-list">
                     {aiReview.strengths.map((s, i) => (
                       <div key={i} style={{ fontSize: 'var(--text-sm)', marginBottom: 12, padding: 'var(--space-3)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                         <strong style={{ color: 'var(--success)' }}>{s.point}</strong>: {s.impact}
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               <div style={{ padding: 'var(--space-4)', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)' }}>
                 <h4 className="text-xs font-bold text-uppercase" style={{ marginBottom: 8, color: 'var(--accent)' }}>Strategic Next Step</h4>
                 <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.5 }}>
                   {aiReview.strategicNextStep}
                 </p>
               </div>
             </div>
           </Card>
         )}


        <div className="stack-list-lg">
          {EVALUATION_CATEGORIES.map(cat => (
            <Card key={cat.id}>
              <div className="mb-4">
                <h3 className="section-title">{cat.title}</h3>
                <p className="section-sub">{cat.description}</p>
              </div>

              <div className="mb-6">
                <ul className="stack-list" style={{ listStyle: 'none', padding: 0 }}>
                  {cat.questions.map((q, i) => (
                    <li key={i} className="card-row-meta" style={{ marginBottom: 4, display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--accent)' }}>•</span> {q}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rating-selector flex justify-between items-center"
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)'
                }}>
                <span className="text-xs font-bold" style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}>
                  RATING
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => handleRatingChange(cat.id, num)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-pill)',
                        border: `2px solid ${ratings[cat.id] === num ? 'var(--accent)' : 'var(--border)'}`,
                        background: ratings[cat.id] === num ? 'var(--accent-subtle)' : 'transparent',
                        color: ratings[cat.id] === num ? 'var(--accent)' : 'var(--text)',
                        fontWeight: 'var(--weight-bold)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <span className="text-xs"
                  style={{
                    fontStyle: 'italic',
                    color: ratings[cat.id] > 0 ? 'var(--text)' : 'var(--muted)'
                  }}>
                  {ratings[cat.id] > 0 ? cat.ratingLabels[ratings[cat.id]] : '--'}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 mb-12">
          <SectionHeader title="Reflection" />
          <Card>
            <div className="stack-list-lg">
              <FormField label="What worked well in this lesson?">
                <textarea
                  className="input dx-edit-textarea"
                  rows={3}
                  value={reflections.workedWell}
                  onChange={e => handleReflectionChange('workedWell', e.target.value)}
                  placeholder="Describe your successes..."
                />
              </FormField>

              <FormField label="What should I improve next time?">
                <textarea
                  className="input dx-edit-textarea"
                  rows={3}
                  value={reflections.toImprove}
                  onChange={e => handleReflectionChange('toImprove', e.target.value)}
                  placeholder="Identify areas for growth..."
                />
              </FormField>

              <FormField label="What is the student's main target now?">
                <textarea
                  className="input dx-edit-textarea"
                  rows={3}
                  value={reflections.studentTarget}
                  onChange={e => handleReflectionChange('studentTarget', e.target.value)}
                  placeholder="Set a clear goal for the next session..."
                />
              </FormField>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
