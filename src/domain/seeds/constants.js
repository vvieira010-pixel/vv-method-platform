// SEEDS Regenerative Inquiry Cycle — stage definitions for MET platform

export const SEEDS_STAGES = {
  sense: {
    id: 'sense',
    label: 'Sense',
    subtitle: 'Attunement',
    description: 'Observing current English patterns — recording speaking, identifying gaps, noticing what is strong and what needs attention.',
    studentDescription: 'We are noticing how your English sounds right now. This helps us understand what to work on.',
    color: 'var(--info)',
    order: 0,
    tone: 'info',
  },
  envision: {
    id: 'envision',
    label: 'Envision',
    subtitle: 'Grounded Ideation',
    description: 'Setting a clear goal based on what we observed — deciding what to develop and why.',
    studentDescription: 'We are planning what to improve based on what we learned about your English.',
    color: 'var(--accent)',
    order: 1,
    tone: 'accent',
  },
  experiment: {
    id: 'experiment',
    label: 'Experiment',
    subtitle: 'Prototyping & Action',
    description: 'Testing new strategies one at a time — trying, reviewing, adjusting.',
    studentDescription: 'You are trying new strategies in your practice. Each attempt teaches us what works for you.',
    color: 'var(--interaction)',
    order: 2,
    tone: 'warning',
  },
  designToLast: {
    id: 'designToLast',
    label: 'Design to Last',
    subtitle: 'Stewardship',
    description: 'Building habits and routines so progress continues after the course ends.',
    studentDescription: 'We are building a practice routine that will keep working even after our classes end.',
    color: 'var(--success)',
    order: 3,
    tone: 'success',
  },
  share: {
    id: 'share',
    label: 'Share',
    subtitle: 'Honest Assessment',
    description: 'Looking back at what improved, what did not, and what to focus on next.',
    studentDescription: 'We are reviewing what changed and what to work on next. This feeds into the next cycle.',
    color: 'var(--accent-soft)',
    order: 4,
    tone: 'info',
  },
};

export const SEEDS_STAGE_ORDER = ['sense', 'envision', 'experiment', 'designToLast', 'share'];

// Storage functions live in src/lib/workflow-seeds.js (Supabase-first, localStorage fallback).
// Import from lib/workflow.js or lib/workflow-seeds.js directly.
