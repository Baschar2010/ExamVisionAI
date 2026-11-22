import { terms, textParts, topicOf, type SourcePassage } from './core.ts';

export type AssistantLabels = {
  noDocs: string;
  noMatch: string;
  answerPrefix: string;
  sourcePrefix: string;
  suggestedPrefix: string;
};

export type AssistantAnswer = {
  answer: string;
  sources: string[];
  passages: string[];
  confident: boolean;
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function suggestQuestions(passages: SourcePassage[], labels: AssistantLabels): string[] {
  const topics = unique(passages.map(passage => passage.topic)).slice(0, 3);
  return topics.map(topic => `${labels.suggestedPrefix} „${topic}“?`);
}

export function answerFromMaterials(question: string, passages: SourcePassage[], labels: AssistantLabels): AssistantAnswer {
  if (!passages.length) return { answer: labels.noDocs, sources: [], passages: [], confident: false };
  const questionTerms = unique(terms(question));
  if (!questionTerms.length) return { answer: labels.noMatch, sources: [], passages: [], confident: false };
  const scored = passages.map(passage => {
    const passageTerms = new Set(terms(passage.text));
    const matches = questionTerms.filter(term => passageTerms.has(term));
    const topicBonus = questionTerms.some(term => term === passage.topic) ? 0.5 : 0;
    return { passage, score: matches.length + topicBonus, matches };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return { answer: labels.noMatch, sources: [], passages: [], confident: false };
  const threshold = Math.min(2, scored[0].score);
  const relevant = scored.filter(item => item.score >= threshold).slice(0, 3);
  const excerpts = relevant.map(item => {
    const text = item.passage.text.length > 360 ? `${item.passage.text.slice(0, 357).trimEnd()}…` : item.passage.text;
    return `${labels.sourcePrefix} ${item.passage.name}: ${text}`;
  });
  return {
    answer: `${labels.answerPrefix}\n\n${excerpts.join('\n\n')}`,
    sources: unique(relevant.map(item => item.passage.name)),
    passages: relevant.map(item => item.passage.text),
    confident: relevant[0].score >= 2
  };
}

export function searchPassages(query: string, passages: SourcePassage[]): SourcePassage[] {
  const queryTerms = unique(terms(query));
  if (!queryTerms.length) return [];
  return passages.filter(passage => {
    const passageTerms = new Set(terms(passage.text));
    return queryTerms.some(term => passageTerms.has(term));
  });
}
