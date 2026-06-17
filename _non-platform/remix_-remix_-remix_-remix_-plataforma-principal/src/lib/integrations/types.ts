// src/lib/integrations/types.ts

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  lms: 'classroom' | 'canvas' | 'moodle';
}

export interface LMSAdapter {
  fetchAssignments(): Promise<Assignment[]>;
  pushAssignment(assignment: Omit<Assignment, 'id' | 'lms'>): Promise<Assignment>;
}
