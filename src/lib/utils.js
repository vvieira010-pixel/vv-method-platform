export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function generateShortId(prefix = '') {
  return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
}