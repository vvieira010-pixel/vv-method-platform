import { Student, Homework, Diagnostic, ErrorPattern } from '../types';

export const STUDENTS: Student[] = [
  { id:'s1',  name:'Ana Paula',      firstName:'Ana',      band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:4,  totalSessions:24, email:'anapbnurse@gmail.com',        cycle:'submitted',         skills:[62,58,70,45,55,60] },
  { id:'s2',  name:'Cybilla',        firstName:'Cybilla',  band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:3,  totalSessions:24, email:'cybillarodrigues@gmail.com',   cycle:'needs-diagnosis',   skills:[50,48,55,42,50,52] },
  { id:'s3',  name:'Fernanda',       firstName:'Fernanda', band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:6,  totalSessions:24, email:'fercoli18@hotmail.com',         cycle:'homework-assigned', skills:[65,60,72,55,62,68] },
  { id:'s4',  name:'Helen',          firstName:'Helen',    band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:2,  totalSessions:24, email:'helenibamorim@gmail.com',       cycle:'needs-diagnosis',   skills:[45,42,50,38,44,48] },
  { id:'s5',  name:'Lorena',         firstName:'Lorena',   band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:8,  totalSessions:24, email:'klomacedo10@gmail.com',         cycle:'diagnosed',         skills:[68,64,75,60,70,72] },
  { id:'s6',  name:'Mari Asuncao',   firstName:'Mari',     band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:5,  totalSessions:24, email:'assuncao_marina@hotmail.com',   cycle:'feedback-sent',     skills:[60,57,68,52,58,64] },
  { id:'s7',  name:'Nilda',          firstName:'Nilda',    band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:10, totalSessions:24, email:'nildacesar@gmail.com',          cycle:'reviewed',          skills:[72,68,80,65,75,78] },
  { id:'s8',  name:'Rosangela',      firstName:'Rosangela',band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:1,  totalSessions:24, email:'rosangela@gmail.com',           cycle:'needs-diagnosis',   skills:[40,38,45,34,40,42] },
  { id:'s9',  name:'Sabrina',        firstName:'Sabrina',  band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:7,  totalSessions:24, email:'sabrinacavalcanti@gmail.com',   cycle:'homework-assigned', skills:[66,62,73,58,64,70] },
  { id:'s10', name:'Tamara',         firstName:'Tamara',   band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:3,  totalSessions:24, email:'tamaratertovieira@gmail.com',   cycle:'needs-diagnosis',   skills:[52,50,58,45,54,55] },
  { id:'s11', name:'Vanessa Reis',   firstName:'Vanessa',  band:'B1', bandTarget:'B2', goal:'Pass MET B2', session:12, totalSessions:24, email:'vanessareis@gmail.com',         cycle:'reviewed',          skills:[75,72,82,68,78,80] },
];

export const CYCLE_CONFIG: Record<string, any> = {
  'needs-diagnosis':   { label:'Needs Diagnosis',  tone:'p-danger',   action:'Run Diagnosis' },
  'diagnosed':         { label:'Diagnosed',         tone:'p-info',     action:'Send Feedback' },
  'feedback-sent':     { label:'Feedback Sent',     tone:'p-info',     action:'Assign Homework' },
  'homework-assigned': { label:'HW Assigned',       tone:'p-warning',  action:'Waiting…' },
  'submitted':         { label:'Submitted',         tone:'p-success',  action:'Review Now' },
  'reviewed':          { label:'Reviewed',          tone:'p-success',  action:'New Diagnosis' },
};

export const SKILL_LABELS = ['Speaking','Writing','Reading','Listening','Grammar','Vocabulary'];

export const SAMPLE_HW: Homework[] = [
  { id:'hw1', studentId:'s1', title:'Grammar Practice — Articles & Determiners',  type:'grammar',  status:'submitted',  assignedAt:'2026-05-25', dueDate:'2026-05-30' },
  { id:'hw2', studentId:'s3', title:'Fernanda — MET Writing Task 1 (Email)',       type:'writing',  status:'not-started', assignedAt:'2026-05-27', dueDate:'2026-06-01' },
  { id:'hw3', studentId:'s5', title:'Lorena — Vocabulary Flashcards (B2 Core)',    type:'vocabulary',status:'not-started',assignedAt:'2026-05-28', dueDate:'2026-06-02' },
  { id:'hw4', studentId:'s9', title:'Sabrina — Speaking Prompts (MET Part 2)',     type:'speaking', status:'not-started', assignedAt:'2026-05-28', dueDate:'2026-06-03' },
];

export const SAMPLE_DX: Diagnostic[] = [
  { id:'dx1', studentId:'s1', studentName:'Ana Paula',   date:'2026-05-24', status:'approved', sections:6, approved:6, summary:'Strong grammar foundations but struggles with article usage and reading comprehension under timed conditions.' },
  { id:'dx2', studentId:'s3', studentName:'Fernanda',    date:'2026-05-26', status:'approved', sections:6, approved:5, summary:'Good speaking fluency. Main priority: formal writing register and vocabulary range for MET Writing sections.' },
  { id:'dx3', studentId:'s5', studentName:'Lorena',      date:'2026-05-27', status:'approved', sections:6, approved:6, summary:'Consistently strong across skills. Focus on test strategy and timed performance to reach MET B2 benchmark.' },
  { id:'dx4', studentId:'s7', studentName:'Nilda',       date:'2026-05-20', status:'approved', sections:6, approved:6, summary:'Excellent progress. Near B2 standard. Vocabulary depth and academic reading are final blockers.' },
  { id:'dx5', studentId:'s6', studentName:'Mari Asuncao',date:'2026-05-22', status:'draft',    sections:6, approved:3, summary:'Mid-cycle assessment. Listening and pronunciation need targeted work before feedback is sent.' },
];

export const ERRORS_BY_STUDENT: Record<string, ErrorPattern[]> = {
  's1': [
    { error:'I have went to the store',      correct:'I have gone to the store',     type:'grammar',    status:'active' },
    { error:'She does not know the answer',  correct:'She does not know the answer', type:'grammar',    status:'active' },
    { error:'informations',                  correct:'information (uncountable)',    type:'vocabulary', status:'practicing' },
  ],
  's3': [
    { error:'I am agree with you',           correct:'I agree with you',             type:'grammar',    status:'active' },
    { error:'despite of the rain',           correct:'despite the rain',             type:'grammar',    status:'active' },
  ],
  's5': [
    { error:'He suggested to go',            correct:'He suggested going',           type:'grammar',    status:'solved' },
    { error:'advices',                       correct:'advice (uncountable)',          type:'vocabulary', status:'active' },
  ],
};
