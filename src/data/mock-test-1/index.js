export const MOCK_TEST_1 = {
  id: 'mock-test-1',
  title: 'MET Mock Test 1',
  totalTime: 155 * 60,
  sections: [
    { id: 'reading',   label: 'Reading & Grammar', time: 3900,  icon: 'book' },
    { id: 'listening', label: 'Listening',          time: 2100,  icon: 'headphones' },
    { id: 'speaking',  label: 'Speaking',           time: 600,   icon: 'mic' },
    { id: 'writing',   label: 'Writing',            time: 2700,  icon: 'edit' },
  ],
};

export const SCORING = {
  grammar_b1: 1,
  grammar_b2: 2,
  main_idea: 1,
  detail: 2,
  inference: 3,
};

export function getPoints(type, level) {
  if (type === 'grammar') {
    return SCORING[`grammar_${level || 'b1'}`] || 1;
  }
  return SCORING[type] || 1;
}

export function getCefrLevel(score, max) {
  if (max <= 0) return 'N/A';
  const pct = (score / max) * 100;
  if (pct < 50) return 'Below B1';
  if (pct < 70) return 'B1';
  if (pct < 85) return 'B2';
  return 'C1';
}

export function getCefrColor(level) {
  switch (level) {
    case 'Below B1': return '#dc2626';
    case 'B1': return '#e07000';
    case 'B2': return '#16a34a';
    case 'C1': return '#2a6db5';
    default: return '#888';
  }
}
