import { buildGroundedQuestions, type Difficulty, type SourcePassage } from './core.ts';

export type WorksheetQuestion = {
  id: string;
  prompt: string;
  answer: string;
  source: string;
  topic: string;
  points: number;
};

export type Worksheet = {
  title: string;
  instructions: string;
  topic: string;
  difficulty: Difficulty;
  showSolutions: boolean;
  questions: WorksheetQuestion[];
};

export function buildWorksheet(
  passages: SourcePassage[],
  options: { title: string; instructions: string; topic?: string; difficulty?: Difficulty; count?: number; showSolutions?: boolean; language?: string; unknownTopic?: string }
): Worksheet {
  const difficulty = options.difficulty || 'medium';
  const needle = (options.topic || '').toLocaleLowerCase().trim();
  const filtered = needle
    ? passages.filter(passage => passage.topic.toLocaleLowerCase().includes(needle) || passage.text.toLocaleLowerCase().includes(needle))
    : passages;
  const source = filtered.length ? filtered : passages;
  const questions = buildGroundedQuestions(source, Math.max(1, Math.min(12, options.count || 5)), undefined, {
    difficulty,
    language: options.language || 'de',
    unknownTopic: options.unknownTopic || 'Unklar'
  });
  return {
    title: options.title,
    instructions: options.instructions,
    topic: options.topic || '',
    difficulty,
    showSolutions: Boolean(options.showSolutions),
    questions: questions.map((question, index) => ({
      id: `ws-${index + 1}`,
      prompt: question.prompt,
      answer: question.answer,
      source: question.source,
      topic: question.topic,
      points: question.points
    }))
  };
}
