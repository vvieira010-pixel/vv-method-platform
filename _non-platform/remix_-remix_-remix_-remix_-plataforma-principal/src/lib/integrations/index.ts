// src/lib/integrations/index.ts
import { ClassroomAdapter } from './classroom';
import { CanvasAdapter } from './canvas';
import { MoodleAdapter } from './moodle';
import { LMSAdapter } from './types';

export type LMSType = 'classroom' | 'canvas' | 'moodle';

export function getAdapter(type: LMSType, credential: string): LMSAdapter {
  switch (type) {
    case 'classroom':
      return new ClassroomAdapter(credential);
    case 'canvas':
      return new CanvasAdapter(credential);
    case 'moodle':
      return new MoodleAdapter(credential);
    default:
      throw new Error(`Unsupported LMS: ${type}`);
  }
}
