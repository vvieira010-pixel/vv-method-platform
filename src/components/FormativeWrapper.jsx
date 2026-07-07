import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, Pill, Button } from './shared.jsx';
import { Card } from './ui/Card.jsx';
import { callAI } from '../lib/callAI.js';
import { withSkills } from '../education-skills/active-skills.js';

export default function FormativeWrapper({ exercise, response, onResponse, children, readOnly = false }) {
  const [stage, setStage] = useState('probe'); // probe | feedback | answer
  const [probeText, setProbeText] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize state from response if available
  useEffect(() => {
    if (response?.reasoning && response?.reasoningSolved) {
      setStage('answer');
    }
  }, [response]);

  const handleAnalyzeReasoning = async () => {
    if (!probeText.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `
        You are a professional MET (Michigan English Test) tutor. 
        Exercise Type: ${exercise.type}
        Prompt: ${exercise.prompt || exercise.question || 'N/A'}
        Correct Answer/Logic: ${exercise.correct || exercise.explanation || 'N/A'}
        Student Reasoning: "${probeText}"

        Analyze the student's reasoning. 
        1. Is the reasoning conceptually sound? (Yes/No)
        2. If no, what is the specific misconception?
        3. Provide a short, redirective hint (max 2 sentences) that doesn't give the answer but nudges them toward the correct logic.

        Return JSON:
        {
          "isSound": boolean,
          "misconception": "string",
          "hint": "string"
        }
      `;
      
      const data = await callAI(prompt, await withSkills('feedback', { temperature: 0.5 }));
      const raw = data.content?.map(b => b.text || '').join('') || '';
      
      // Simple JSON extraction
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (parsed) {
        setAiFeedback(parsed);
        if (parsed.isSound) {
          setStage('answer');
          onResponse({ 
            ...response, 
            reasoning: probeText, 
            reasoningSolved: true,
            reasoningFailures: response.reasoningFailures || 0 
          });
        } else {
          setStage('feedback');
          onResponse({ 
            ...response, 
            reasoning: probeText, 
            reasoningSolved: false,
            reasoningFailures: (response.reasoningFailures || 0) + 1 
          });
        }
      }
    } catch (e) {
      console.error('Reasoning analysis failed:', e);
      // Fallback: let them proceed if AI fails
      setStage('answer');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (readOnly) return children;

  return (
    <div className="formative-wrapper">
      <AnimatePresence mode="wait">
        {stage === 'probe' && (
          <motion.div 
            key="probe"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="formative-probe-container"
          >
            <div className="formative-probe-header">
              <Icon.spark size={16} color="var(--primary)" />
              <span className="formative-probe-title">Reasoning Probe</span>
            </div>
            <p className="formative-probe-text">
              Before you answer, briefly explain your thinking. 
              Why is this the correct approach?
            </p>
            <textarea 
              className="input" 
              value={probeText}
              onChange={e => setProbeText(e.target.value)}
              placeholder="I think the answer is... because..."
              rows={3}
            />
            <Button 
              variant="primary" 
              onClick={handleAnalyzeReasoning} 
              disabled={isAnalyzing || !probeText.trim()}
              style={{ marginTop: 12 }}
            >
              {isAnalyzing ? 'Analyzing logic...' : 'Check Reasoning'}
            </Button>
          </motion.div>
        )}

        {stage === 'feedback' && (
          <motion.div 
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="formative-feedback-container"
          >
            <div className="formative-feedback-header">
              <Icon.warning size={16} color="var(--warning)" />
              <span className="formative-feedback-title">Refine your thinking</span>
            </div>
            <div className="formative-feedback-body">
              {aiFeedback?.hint}
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setStage('probe')} 
              style={{ marginTop: 12 }}
            >
              Try reasoning again
            </Button>
          </motion.div>
        )}

        {stage === 'answer' && (
          <motion.div 
            key="answer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="formative-answer-container"
          >
            <div className="formative-success-pill">
              <Icon.check size={12} /> Reasoning sound. Now, provide the answer.
            </div>
            <div className="formative-exercise-player">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .formative-wrapper {
          width: 100%;
          position: relative;
        }
        .formative-probe-container, .formative-feedback-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .formative-probe-header, .formative-feedback-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .formative-probe-title, .formative-feedback-title {
          font-weight: 700;
          font-size: var(--text-sm);
          color: var(--text);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .formative-probe-text {
          font-size: var(--text-sm);
          color: var(--text-2);
          margin-bottom: 12px;
          line-height: 1.6;
        }
        .formative-feedback-body {
          font-size: var(--text-sm);
          color: var(--text);
          line-height: 1.6;
          background: var(--warning-bg);
          padding: 12px;
          border-radius: var(--radius-sm);
           border: 1px solid var(--warning-soft);
        }
        .formative-success-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: var(--success-bg);
          color: var(--success);
          font-size: var(--text-xs);
          font-weight: 600;
          border-radius: var(--radius-pill);
          margin-bottom: 12px;
        }
        .formative-exercise-player {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
