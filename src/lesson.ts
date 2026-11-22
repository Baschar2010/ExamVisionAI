import { buildGroundedQuestions, difficultyOf, terms, type Difficulty, type SourcePassage } from './core.ts';

export type LessonLabels = {
  draftTitle: string;
  subject: string;
  topic: string;
  language: string;
  duration: string;
  difficulty: string;
  form: string;
  objectives: string;
  phases: string;
  phaseWarmup: string;
  phaseInput: string;
  phasePractice: string;
  phaseClosure: string;
  teacher: string;
  students: string;
  materials: string;
  differentiation: string;
  assessment: string;
  sources: string;
  defaultObjective: string;
  easy: string;
  medium: string;
  hard: string;
};

export type LessonOptions = {
  subject: string;
  topic: string;
  language: string;
  minutes: number;
  objectives: string;
  difficulty: Difficulty;
  form: string;
  passages: SourcePassage[];
  labels: LessonLabels;
};

export type LessonPhase = {
  name: string;
  minutes: number;
  activity: string;
  teacher: string;
  students: string;
  material: string;
};

export type LessonPlan = {
  title: string;
  meta: Array<{ label: string; value: string }>;
  objectives: string[];
  phases: LessonPhase[];
  differentiation: string;
  assessment: string;
  sources: string[];
  notes: string;
};

function excerpt(text: string, max = 260): string {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function buildLessonPlan(options: LessonOptions): LessonPlan {
  const { labels, passages } = options;
  const minutes = Math.max(20, Math.min(180, Math.round(options.minutes) || 45));
  const ratios = [0.15, 0.3, 0.35, 0.2];
  const durations = ratios.map((ratio, index) => index === ratios.length - 1
    ? minutes - Math.round(minutes * ratios[0]) - Math.round(minutes * ratios[1]) - Math.round(minutes * ratios[2])
    : Math.round(minutes * ratio));
  const first = passages[0];
  const second = passages[Math.min(1, Math.max(0, passages.length - 1))];
  const groundedPassages = passages.map(passage => ({ ...passage, topic: options.topic || passage.topic }));
  const questions = buildGroundedQuestions(groundedPassages, 3, undefined, {
    difficulty: options.difficulty,
    language: options.language,
    unknownTopic: options.topic || labels.topic
  });
  const objectives = options.objectives.split(/[\n,;]+/).map(x => x.trim()).filter(Boolean).slice(0, 6);
  if (!objectives.length) objectives.push(`${labels.defaultObjective} ${options.topic || labels.topic}.`);
  const difficultyLabel = labels[options.difficulty] || labels.medium;
  const detected = passages.map(passage => difficultyOf(passage.text));
  const hardCount = detected.filter(x => x === 'hard').length;
  const easyCount = detected.filter(x => x === 'easy').length;
  return {
    title: `${labels.draftTitle}: ${options.topic || labels.topic}`,
    meta: [
      { label: labels.subject, value: options.subject || '—' },
      { label: labels.topic, value: options.topic || '—' },
      { label: labels.language, value: options.language || '—' },
      { label: labels.duration, value: `${minutes} min` },
      { label: labels.difficulty, value: difficultyLabel },
      { label: labels.form, value: options.form || '—' }
    ],
    objectives,
    phases: [
      {
        name: labels.phaseWarmup,
        minutes: durations[0],
        activity: first ? excerpt(first.text) : labels.defaultObjective,
        teacher: `${labels.teacher}: ${labels.phaseWarmup}`,
        students: `${labels.students}: ${labels.defaultObjective}`,
        material: first?.name || labels.materials
      },
      {
        name: labels.phaseInput,
        minutes: durations[1],
        activity: second ? excerpt(second.text) : first ? excerpt(first.text) : labels.defaultObjective,
        teacher: `${labels.teacher}: ${labels.phaseInput}`,
        students: `${labels.students}: ${labels.objectives}`,
        material: second?.name || first?.name || labels.materials
      },
      {
        name: labels.phasePractice,
        minutes: durations[2],
        activity: questions.map((question, index) => `${index + 1}. ${question.prompt}`).join('\n'),
        teacher: `${labels.teacher}: ${labels.assessment}`,
        students: `${labels.students}: ${labels.phasePractice}`,
        material: questions.map(question => question.source).filter((value, index, all) => all.indexOf(value) === index).join(', ')
      },
      {
        name: labels.phaseClosure,
        minutes: durations[3],
        activity: questions.map(question => question.answer).join(' '),
        teacher: `${labels.teacher}: ${labels.phaseClosure}`,
        students: `${labels.students}: ${labels.sources}`,
        material: labels.materials
      }
    ],
    differentiation: `${labels.differentiation}: ${easyCount} ${labels.easy}, ${hardCount} ${labels.hard}.`,
    assessment: `${labels.assessment}: ${questions.length} ${labels.phases.toLowerCase()}.`,
    sources: passages.map(passage => passage.name).filter((value, index, all) => all.indexOf(value) === index),
    notes: `${labels.materials}: ${terms(passages.map(passage => passage.text).join(' ')).slice(0, 12).join(', ')}.`
  };
}
