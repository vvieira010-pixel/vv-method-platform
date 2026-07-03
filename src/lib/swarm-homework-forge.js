import { callAI } from '../components/shared.jsx';
import { withSkills } from '../education-skills/active-skills.js';
import { parseAiJson } from '../lib/ai-helpers.js';
import { 
  buildHomeworkBlueprintPrompt, 
  buildTaskGeneratorPrompt, 
  buildFinalRefinementPrompt 
} from './prompts.js';

/**
 * The Homework Forge Swarm Orchestrator
 * Implements a Hierarchical Topology: Architect -> Specialists -> Auditor -> Synthesizer
 */
export async function forgeHomework(params) {
  const { student, diagnosis, onProgress } = params;
  const HOMEWORK_AI_OPTIONS = { max_tokens: 2500, temperature: 0.7 };

  try {
    // 1. ARCHITECT PHASE: Create the Strategic Map
    if (onProgress) onProgress('Architect is mapping the lesson strategy...');
    const bpPrompt = buildHomeworkBlueprintPrompt({ student, diagnosis });
    const bpData = await callAI(bpPrompt, await withSkills('homework', HOMEWORK_AI_OPTIONS));
    const blueprint = parseAiJson(bpData.content?.map(b => b.text || '').join('') || '');
    
    if (!blueprint || !blueprint.taskTypes) throw new Error('Architect failed to create a valid blueprint.');

    // 2. SPECIALIST PHASE: Parallel Forging
    if (onProgress) onProgress(`Specialists are forging ${blueprint.taskTypes.length} MET-style exercises...`);
    
    const taskPromises = blueprint.taskTypes.map(async (taskType) => {
      let attempts = 0;
      let lastError = '';
      let candidate;

      while (attempts < 3) {
        attempts++;
        
        // Generate Candidate
        const genPrompt = buildTaskGeneratorPrompt({ 
          student, 
          diagnosis, 
          taskBlueprint: blueprint, 
          taskType 
        });
        const genData = await callAI(genPrompt, await withSkills('exercise', HOMEWORK_AI_OPTIONS));
        candidate = parseAiJson(genData.content?.map(b => b.text || '').join('') || '');

        if (!candidate) {
          lastError = 'JSON parsing failed';
          continue;
        }

        // 3. AUDITOR PHASE: Quality Gate
        // We embed the auditor logic here for each task
        const auditorPrompt = `You are the MET Quality Auditor. 
        Review this candidate ${taskType} exercise for the MET exam.
        
        Candidate: ${JSON.stringify(candidate)}
        
        Check for:
        1. Ambiguity: Is the correct answer definitively correct? Are distractors plausible but clearly wrong?
        2. Naturalness: Does it sound like a real MET exam item? Is medical English natural?
        3. Alignment: Does it actually target the objective: ${blueprint.objective}?
        
        Return JSON: { "pass": boolean, "feedback": "if fail, specific correction directive" }`;
        
        const auditData = await callAI(auditorPrompt, { max_tokens: 500, temperature: 0.3 });
        const audit = parseAiJson(auditData.content?.map(b => b.text || '').join('') || '');

        if (audit?.pass) return candidate;
        
        lastError = audit?.feedback || 'Failed quality gate';
        // If we retry, we can pass the feedback back to the generator (though buildTaskGeneratorPrompt currently doesn't take it, we can adapt it)
      }
      
      throw new Error(`Task ${taskType} failed quality audit after 3 attempts: ${lastError}`);
    });

    const validatedTasks = await Promise.all(taskPromises);

    // 4. SYNTHESIZER PHASE: Final Polish
    if (onProgress) onProgress('Synthesizer is polishing the final set...');
    const refPrompt = buildFinalRefinementPrompt({ student, blueprint, tasks: validatedTasks });
    const refData = await callAI(refPrompt, await withSkills('homework', HOMEWORK_AI_OPTIONS));
    const refinement = parseAiJson(refData.content?.map(b => b.text || '').join('') || '');

    return {
      title: blueprint.title,
      objective: blueprint.objective,
      description: refinement?.instructions || '',
      exercises: validatedTasks,
      selfCheck: refinement?.selfCheck || [],
      teacherNotes: refinement?.teacherNotes || '',
      taskTypes: blueprint.taskTypes
    };

  } catch (e) {
    console.error('[HomeworkForge] Swarm error:', e);
    throw e;
  }
}
