import { useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { SectionHeader } from '../components/ui/SectionHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { FormField } from '../components/ui/FormField.jsx';

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
    description: 'I check whether my lesson matched the learner’s CEFR level and needs.',
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
      'Did I identify the student’s main weakness?',
      'Did I set one clear target for the next class?',
      'Did I record progress clearly?',
      'Did I leave the student knowing what to practice next?',
    ],
    ratingLabels: { 1: 'No follow-up', 2: 'Weak follow-up', 3: 'Clear follow-up', 4: 'Strong and focused follow-up' }
  },
];

export default function TeacherEvaluationPage() {
  const [ratings, setRatings] = useState(
    EVALUATION_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {})
  );
  const [reflections, setReflections] = useState({
    workedWell: '',
    toImprove: '',
    studentTarget: '',
  });

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
    // For now, just show a toast and log it.
    console.warn('Saving evaluation:', { ratings, reflections });
    if (window.toast) {
      window.toast('Evaluation saved successfully (simulated)', 'success');
    } else {
      console.warn('Evaluation saved successfully (simulated)');
    }
  };

  return (
    <div className="page-shell">
      <SectionHeader
        title="Teacher Self-Evaluation"
        sub="Evaluate your MET/Cambridge-style teaching performance"
        action={<Button variant="primary" onClick={handleSave}>Save Evaluation</Button>}
      />

      <div className="teacher-evaluation-container">
        <Card className="mb-6">
          <div className="text-center" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Current Score
            </h3>
            <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
              {totalScore} <span style={{ fontSize: 'var(--text-lg)', color: 'var(--muted)' }}>/ 40</span>
            </div>
            <p style={{ 
              marginTop: 'var(--space-2)', 
              fontWeight: 'var(--weight-semibold)', 
              color: getScoreInterpretation(totalScore).color 
            }}>
              {getScoreInterpretation(totalScore).text}
            </p>
          </div>
        </Card>

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

              <div className="rating-selector" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 'var(--space-4)',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--muted)' }}>
                  RATING
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
                <span style={{ 
                  fontSize: 'var(--text-xs)', 
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

              <FormField label="What is the student’s main target now?">
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

      <style dangerouslySetInnerHTML={{ __html: `
        .mb-4 { margin-bottom: var(--space-4); }
        .mb-6 { margin-bottom: var(--space-6); }
        .mb-12 { margin-bottom: var(--space-12); }
        .mt-8 { margin-top: var(--space-8); }
        .mt-2 { margin-top: var(--space-2); }
        .text-center { text-align: center; }
        .text-uppercase { text-transform: uppercase; }
        .text-xs { font-size: var(--text-xs); }
        .text-sm { font-size: var(--text-sm); }
        .text-lg { font-size: var(--text-lg); }
        .text-xl { font-size: var(--text-xl); }
        .text-2xl { font-size: var(--text-2xl); }
        .text-3xl { font-size: var(--text-3xl); }
        .text-4xl { font-size: var(--text-4xl); }
        .font-bold { font-weight: var(--weight-bold); }
        .font-semibold { font-weight: var(--weight-semibold); }
        .font-italic { font-style: italic; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .gap-2 { gap: var(--space-2); }
        .gap-4 { gap: var(--space-4); }
        .gap-6 { gap: var(--space-6); }
        .gap-8 { gap: var(--space-8); }
        .w-full { width: 100%; }
      ` }} />
    </div>
  );
}
