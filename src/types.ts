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
  /** Optional metadata written by the five-step creation assistant. */
  formatId?: string;
  blockId?: string;
  options?: string[];
  correctIndex?: number;
  operator?: string;
  requirementLevel?: string;
  objectiveIds?: string[];
};

/** One configurable block of tasks in the creation assistant. */
export type CreationBlock = {
  id: string;
  formatId: string;
  count: number;
  points: number;
  instruction: string;
  operator: string;
  requirementLevel: 'I' | 'II' | 'III';
};

export type CreationLanguage = 'de' | 'en' | 'ar' | 'fr' | 'es';
export type CreationSourceMode = 'materials' | 'text' | 'topic' | 'mixed';
export type CreationExamKind = 'classwork' | 'test' | 'practice' | 'worksheet';
export type Differentiation = 'foundation' | 'regular' | 'support' | 'mixed';

export type CreationConfig = {
  lang: CreationLanguage;
  gradeLevel: string;
  subject: string;
  topic: string;
  title: string;
  goal: string;
  sourceMode: CreationSourceMode;
  selectedDocIds: string[];
  templateDocId: string;
  templateId: string;
  sourceText: string;
  autoFormat: boolean;
  preferredFormats: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  objectives: string[];
  blocks: CreationBlock[];
  examKind: CreationExamKind;
  duration: number;
  differentiation: Differentiation;
  scaffolding: boolean;
  partialPoints: boolean;
  showSolutions: boolean;
  headerName: string;
  headerClass: string;
  headerDate: string;
};

export type ExamMeta = Pick<CreationConfig,
  'lang' | 'gradeLevel' | 'topic' | 'goal' | 'sourceMode' | 'selectedDocIds' |
  'templateDocId' | 'templateId' | 'sourceText' | 'autoFormat' | 'preferredFormats' |
  'difficulty' | 'objectives' | 'blocks' | 'examKind' | 'differentiation' |
  'scaffolding' | 'partialPoints' | 'showSolutions' | 'headerName' | 'headerClass' | 'headerDate'
>;

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
  solutionDocId?: string;
  correctionDocId?: string;
  /** Creation-assistant settings; absent on exams created before version 1.4. */
  meta?: ExamMeta;
};

export type ArtifactKind = 'lesson' | 'worksheet' | 'practice' | 'presentation' | 'graphic' | 'unit' | 'scaffolding';

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
