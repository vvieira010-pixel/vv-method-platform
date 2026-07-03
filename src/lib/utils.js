import { lazy } from 'react';

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function generateShortId(prefix = '') {
  return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
}

export function lazyWithRetry(componentImport) {
  return lazy(() => {
    return new Promise((resolve) => {
      const attemptImport = async () => {
        try {
          const module = await componentImport();
          resolve(module);
        } catch (error) {
          console.error('[lazyWithRetry] Chunk load failed, retrying in 5s...', error);
          setTimeout(attemptImport, 5000);
        }
      };
      attemptImport();
    });
  });
}
