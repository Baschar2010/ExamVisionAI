import type { ExamTimer } from './timer.ts';
import type { TemplateProfile } from './core.ts';
import type { AssistantIntent } from './assistant-router.ts';

export type Doc = {
  id: string;
  name: string;
  type: string;
  text: string;
  pages: number;
  quality: number;
  role: 'material' | 'template' | 'answers';
  added: string;
  profile?: TemplateProfile;
  ocrWarnings?: number[];
};

export type Q = {
  id: string;
  prompt: string;
  answer: string;
  source: string;
  topic: string;
  points: number;
  response: string;
  earned?: number;
  feedback?: string;
  confidence?: number;
  uncertain?: boolean;
  missingConcepts?: string[];
  grader?: 'local' | 'ai';
  gradedBy?: 'local' | 'ai';
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  created: string;
  mode: string;
  questions: Q[];
  duration: number;
  submitted?: boolean;
  timer?: ExamTimer;
};

export type ArtifactKind = 'lesson' | 'worksheet' | 'practice' | 'presentation' | 'graphic';

export type Artifact = {
  id: string;
  kind: ArtifactKind;
  title: string;
  subject: string;
  topic: string;
  created: string;
  lang: string;
  data: any;
};

export type ChatTurn = {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  created: string;
  mode: 'local' | 'ai';
  intent?: AssistantIntent;
};

export type Profile = {
  docs: Doc[];
  exams: Exam[];
  artifacts: Artifact[];
  chat: ChatTurn[];
  lang: string;
  ocrLang: string;
  scale: number[];
  minutes: number;
  weak: string[];
  aiEndpoint?: string;
  aiModel?: string;
};
