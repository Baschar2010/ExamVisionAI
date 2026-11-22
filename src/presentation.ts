import { buildGroundedQuestions, terms, type Difficulty, type SourcePassage } from './core.ts';

export type PresentationLabels = {
  titlePrefix: string;
  objective: string;
  concept: string;
  application: string;
  summary: string;
  source: string;
  teacherNote: string;
  defaultObjective: string;
};

export type Slide = {
  id: string;
  kind: 'title' | 'objectives' | 'concept' | 'quiz' | 'summary';
  title: string;
  bullets: string[];
  note: string;
  source: string;
};

export type Presentation = {
  title: string;
  subtitle: string;
  slides: Slide[];
};

function sentences(text: string, limit: number): string[] {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?؟])\s+/).map(x => x.trim()).filter(x => x.length >= 25).slice(0, limit)
    .map(x => x.length > 200 ? `${x.slice(0, 199).trimEnd()}…` : x);
}

export function buildPresentation(
  passages: SourcePassage[],
  options: { topic: string; subject: string; objectives?: string; difficulty?: Difficulty; language?: string; labels: PresentationLabels }
): Presentation {
  const { labels } = options;
  const objectives = (options.objectives || '').split(/[\n,;]+/).map(x => x.trim()).filter(Boolean).slice(0, 5);
  if (!objectives.length) objectives.push(`${labels.defaultObjective} ${options.topic}.`);
  const questions = buildGroundedQuestions(passages, 2, undefined, {
    difficulty: options.difficulty || 'medium',
    language: options.language || 'de'
  });
  const chosen = passages.slice(0, 5);
  const slides: Slide[] = [
    { id: 'title', kind: 'title', title: `${labels.titlePrefix}: ${options.topic}`, bullets: [options.subject || ''].filter(Boolean), note: labels.teacherNote, source: '' },
    { id: 'objectives', kind: 'objectives', title: labels.objective, bullets: objectives, note: labels.teacherNote, source: '' }
  ];
  for (const [index, passage] of chosen.entries()) {
    slides.push({
      id: `concept-${index + 1}`,
      kind: 'concept',
      title: `${labels.concept} ${index + 1}: ${passage.topic}`,
      bullets: sentences(passage.text, 3),
      note: `${labels.source}: ${passage.name}`,
      source: passage.name
    });
  }
  if (questions.length) {
    slides.push({
      id: 'quiz',
      kind: 'quiz',
      title: labels.application,
      bullets: questions.map((question, index) => `${index + 1}. ${question.prompt}`),
      note: questions.map(question => question.answer).join(' '),
      source: questions.map(question => question.source).join(', ')
    });
  }
  const counts = new Map<string, number>();
  for (const term of terms(passages.map(passage => passage.text).join(' '))) counts.set(term, (counts.get(term) || 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([term, count]) => `${term} (${count})`);
  slides.push({ id: 'summary', kind: 'summary', title: labels.summary, bullets: top, note: labels.teacherNote, source: '' });
  return { title: `${labels.titlePrefix}: ${options.topic}`, subtitle: options.subject, slides };
}
