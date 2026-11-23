import { terms, topicOf, type SourcePassage } from './core.ts';
import { suggestObjectives } from './creation.ts';
import type { CreationLanguage } from './types.ts';

export type UnitLesson = {
  id: string;
  title: string;
  topic: string;
  description: string;
  competencies: string[];
  objectives: string[];
  minutes: number;
  source: string;
};

export type UnitPlan = {
  title: string;
  subject: string;
  topic: string;
  language: string;
  objectives: string[];
  lessons: UnitLesson[];
  sources: string[];
};

export type ScaffoldingPhase = {
  id: string;
  name: string;
  subjectObjective: string;
  languageObjective: string;
  task: string;
  support: string;
  nextStep: string;
};

export type ScaffoldingPlan = {
  title: string;
  subject: string;
  topic: string;
  language: string;
  objectives: string[];
  phases: ScaffoldingPhase[];
  sources: string[];
};

export type FlowLabels = {
  unitLesson: string;
  scaffoldPhase1: string;
  scaffoldPhase2: string;
  scaffoldPhase3: string;
  scaffoldPhase4: string;
  strongSupport: string;
  sharedSupport: string;
  guidedSupport: string;
  independentSupport: string;
};

function excerpt(text: string, max = 190): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function chunk<T>(items: T[], count: number): T[][] {
  const size = Math.max(1, Math.ceil(items.length / Math.max(1, count)));
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  while (result.length < count) result.push([]);
  return result.slice(0, count);
}

function uniqueSources(passages: SourcePassage[]): string[] {
  return [...new Set(passages.map(passage => passage.name).filter(Boolean))];
}

function langOf(language: string): CreationLanguage {
  return (['de', 'en', 'ar', 'fr', 'es'].includes(language) ? language : 'de') as CreationLanguage;
}

/** Build a deterministic multi-lesson unit from the selected source passages. */
export function buildUnitPlan(options: {
  subject: string;
  topic: string;
  language: string;
  minutes: number;
  lessonCount: number;
  objectives?: string;
  passages: SourcePassage[];
  labels: FlowLabels;
}): UnitPlan {
  const passages = options.passages.filter(passage => passage.text.trim());
  const lang = langOf(options.language);
  const fallback = options.topic || options.subject || '';
  const objectives = String(options.objectives || '')
    .split(/[\n,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
  const derived = objectives.length ? objectives : suggestObjectives(passages, lang, 4);
  const groups = chunk(passages, options.lessonCount);
  const lessons: UnitLesson[] = groups.map((group, index) => {
    const first = group[0];
    const text = group.map(item => item.text).join(' ');
    const topic = first ? topicOf(first.text, first.topic || fallback) : `${fallback} ${index + 1}`.trim();
    const source = group.map(item => item.name).filter(Boolean).join(', ');
    const termsForLesson = [...new Set(group.flatMap(item => terms(item.text).slice(0, 12)))].slice(0, 5);
    return {
      id: `unit-lesson-${index + 1}`,
      title: `${options.labels.unitLesson} ${index + 1}: ${topic}`,
      topic,
      description: excerpt(text),
      competencies: termsForLesson,
      objectives: suggestObjectives(group, lang, 2),
      minutes: Math.max(20, Math.round(options.minutes / Math.max(1, options.lessonCount))),
      source
    };
  });
  return {
    title: `${options.subject || ''}${options.subject && fallback ? ': ' : ''}${fallback || options.labels.unitLesson}`.trim(),
    subject: options.subject,
    topic: fallback,
    language: options.language,
    objectives: derived,
    lessons,
    sources: uniqueSources(passages)
  };
}

/** Reorder unit lessons without losing their content. */
export function reorderUnitLessons(plan: UnitPlan, id: string, direction: -1 | 1): UnitPlan {
  const index = plan.lessons.findIndex(lesson => lesson.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= plan.lessons.length) return plan;
  const lessons = plan.lessons.slice();
  [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
  return { ...plan, lessons };
}

/** Build a four-phase scaffolding plan with gradually reduced support. */
export function buildScaffoldingPlan(options: {
  subject: string;
  topic: string;
  language: string;
  objectives?: string;
  passages: SourcePassage[];
  labels: FlowLabels;
}): ScaffoldingPlan {
  const passages = options.passages.filter(passage => passage.text.trim());
  const lang = langOf(options.language);
  const fallback = options.topic || options.subject || '';
  const entered = String(options.objectives || '')
    .split(/[\n,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
  const objectives = entered.length ? entered : suggestObjectives(passages, lang, 3);
  const names = [
    options.labels.scaffoldPhase1,
    options.labels.scaffoldPhase2,
    options.labels.scaffoldPhase3,
    options.labels.scaffoldPhase4
  ];
  const supports = [
    options.labels.strongSupport,
    options.labels.sharedSupport,
    options.labels.guidedSupport,
    options.labels.independentSupport
  ];
  const groups = chunk(passages, names.length);
  const phases: ScaffoldingPhase[] = names.map((name, index) => {
    const group = groups[index] || [];
    const sourceText = group.map(item => item.text).join(' ');
    const source = group.map(item => item.name).filter(Boolean).join(', ');
    const termsForPhase = [...new Set(group.flatMap(item => terms(item.text).slice(0, 8)))].slice(0, 4);
    const focus = termsForPhase.length ? termsForPhase.join(', ') : fallback;
    return {
      id: `scaffold-phase-${index + 1}`,
      name,
      subjectObjective: objectives[index % Math.max(1, objectives.length)] || fallback,
      languageObjective: `${supports[index]}: ${focus}`.trim(),
      task: excerpt(sourceText, 170) || fallback,
      support: supports[index],
      nextStep: index < names.length - 1 ? names[index + 1] : supports[index]
    };
  });
  return {
    title: `${options.subject || ''}${options.subject && fallback ? ': ' : ''}${fallback || options.labels.scaffoldPhase1}`.trim(),
    subject: options.subject,
    topic: fallback,
    language: options.language,
    objectives,
    phases,
    sources: uniqueSources(passages)
  };
}
