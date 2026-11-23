import { answerFromMaterials, type AssistantAnswer, type AssistantLabels } from './assistant.ts';
import type { SourcePassage } from './core.ts';

export const ASSISTANT_INTENTS = [
  'conversation',
  'generalKnowledge',
  'materialQuestion',
  'examCreation',
  'practiceTasks',
  'correction'
] as const;

export type AssistantIntent = typeof ASSISTANT_INTENTS[number];

export type AssistantRouterLabels = AssistantLabels & {
  modeConversation: string;
  modeGeneral: string;
  modeMaterial: string;
  modeExam: string;
  modePractice: string;
  modeCorrection: string;
  chatHello: string;
  chatMorning: string;
  chatHowAreYou: string;
  chatThanks: string;
  chatBye: string;
  chatWho: string;
  chatHelp: string;
  chatCapabilities: string;
  generalPrefix: string;
  generalFallback: string;
  guideMaterial: string;
  guideExam: string;
  guidePractice: string;
  guideCorrection: string;
};

export type RoutedAssistantAnswer = AssistantAnswer & { intent: AssistantIntent };

const CONVERSATION: Array<{ pattern: RegExp; key: 'chatHello' | 'chatMorning' | 'chatHowAreYou' | 'chatThanks' | 'chatBye' | 'chatWho' | 'chatHelp' | 'chatCapabilities' }> = [
  { pattern: /^(hallo|hi|hey|guten tag|guten abend)\b/i, key: 'chatHello' },
  { pattern: /guten morgen/i, key: 'chatMorning' },
  { pattern: /wie geht( es)? (dir|ihnen)?\??$/i, key: 'chatHowAreYou' },
  { pattern: /^(danke|vielen dank|thanks|merci|gracias)\b/i, key: 'chatThanks' },
  { pattern: /(auf wiedersehen|tschüss|bis bald|goodbye|bye)/i, key: 'chatBye' },
  { pattern: /wer bist du|was bist du|who are you/i, key: 'chatWho' },
  { pattern: /kannst du mir helfen|kannst du helfen|hilf mir|can you help/i, key: 'chatHelp' },
  { pattern: /was kannst du(\s+alles)?|was kann die app|what can you do/i, key: 'chatCapabilities' }
];

const CREATION = /(erstell|erzeug|generier|schreib|formulier|mach|mache|baue|create|make|generate)/i;
const EXAM = /(klassenarbeit|klassen test|arbeit\b|prüfung|test\b|exam|quiz)/i;
const PRACTICE = /(übung|uebung|aufgabe|trainier|training|practice|exercise)/i;
const CORRECTION = /(korrigier|korrektur|bewert|benot|note\b|feedback|grade|correct)/i;
const MATERIAL = /(meine[nrsm]?\s+)?(materialien|unterlagen|dokumente|dateien|hochgeladen|material\b)/i;
const EXPLAIN = /(erklär|erklaer|beschreib|erörter|zusammenfass|fass(e)? zusammen|was steht|bedeutet|define|explain)/i;
const GENERAL = /(hauptstadt|wie viele|wann wurde|wer war|was ist ein\b|was ist die\b|capital of|how many)/i;

export function classifyIntent(message: string): AssistantIntent {
  const text = String(message || '').trim();
  if (!text) return 'conversation';
  if (CONVERSATION.some(item => item.pattern.test(text))) return 'conversation';
  if (CORRECTION.test(text)) return 'correction';
  if (CREATION.test(text) && EXAM.test(text)) return 'examCreation';
  if (CREATION.test(text) && PRACTICE.test(text)) return 'practiceTasks';
  if (MATERIAL.test(text) || EXPLAIN.test(text)) return 'materialQuestion';
  if (GENERAL.test(text)) return 'generalKnowledge';
  if (/[?？]\s*$/.test(text)) return 'generalKnowledge';
  return 'conversation';
}

const FACTS: Array<{ pattern: RegExp; answer: string }> = [
  { pattern: /(hauptstadt von frankreich|capital of france|frankreich.*hauptstadt)/i, answer: 'Die Hauptstadt von Frankreich ist Paris.' },
  { pattern: /(hauptstadt von deutschland|capital of germany|deutschland.*hauptstadt)/i, answer: 'Die Hauptstadt von Deutschland ist Berlin.' },
  { pattern: /(hauptstadt von österreich|hauptstadt von oesterreich|austria.*capital)/i, answer: 'Die Hauptstadt von Österreich ist Wien.' },
  { pattern: /(hauptstadt von italien|italien.*hauptstadt|capital of italy)/i, answer: 'Die Hauptstadt von Italien ist Rom.' },
  { pattern: /(hauptstadt von spanien|spanien.*hauptstadt|capital of spain)/i, answer: 'Die Hauptstadt von Spanien ist Madrid.' },
  { pattern: /(hauptstadt von der schweiz|schweiz.*hauptstadt)/i, answer: 'Die Schweiz hat keine offizielle Hauptstadt; Bern ist der Regierungssitz.' },
  { pattern: /(wie viele farben hat der regenbogen|colors of the rainbow)/i, answer: 'Der Regenbogen hat klassisch sieben Farben: Rot, Orange, Gelb, Grün, Blau, Indigo und Violett.' },
  { pattern: /(lichtgeschwindigkeit|speed of light)/i, answer: 'Die Lichtgeschwindigkeit im Vakuum beträgt etwa 300.000 Kilometer pro Sekunde.' },
  { pattern: /(wie viele minuten hat eine stunde|minutes in an hour)/i, answer: 'Eine Stunde hat 60 Minuten.' }
];

function answerFromGeneralKnowledge(question: string, labels: AssistantRouterLabels): RoutedAssistantAnswer {
  const fact = FACTS.find(item => item.pattern.test(question));
  const answer = fact ? fact.answer : `${labels.generalPrefix}\n\n${labels.generalFallback}`;
  return { answer, sources: [], passages: [], confident: Boolean(fact), intent: 'generalKnowledge' };
}

function answerFromConversation(question: string, labels: AssistantRouterLabels): RoutedAssistantAnswer {
  const match = CONVERSATION.find(item => item.pattern.test(question));
  return {
    answer: labels[match?.key || 'chatHello'],
    sources: [],
    passages: [],
    confident: true,
    intent: 'conversation'
  };
}

function answerFromGrounded(
  question: string,
  passages: SourcePassage[],
  labels: AssistantRouterLabels,
  intent: Exclude<AssistantIntent, 'conversation' | 'generalKnowledge'>
): RoutedAssistantAnswer {
  const result = answerFromMaterials(question, passages, labels);
  const guides: Record<typeof intent, string> = {
    materialQuestion: labels.guideMaterial,
    examCreation: labels.guideExam,
    practiceTasks: labels.guidePractice,
    correction: labels.guideCorrection
  };
  const guide = guides[intent];
  return {
    ...result,
    answer: guide ? `${guide}\n\n${result.answer}` : result.answer,
    intent
  };
}

export function routeAssistant(
  question: string,
  passages: SourcePassage[],
  labels: AssistantRouterLabels
): RoutedAssistantAnswer {
  const intent = classifyIntent(question);
  if (intent === 'conversation') return answerFromConversation(question, labels);
  if (intent === 'generalKnowledge') return answerFromGeneralKnowledge(question, labels);
  return answerFromGrounded(question, passages, labels, intent);
}

export function intentLabel(intent: AssistantIntent, labels: AssistantRouterLabels): string {
  const keys: Record<AssistantIntent, keyof AssistantRouterLabels> = {
    conversation: 'modeConversation',
    generalKnowledge: 'modeGeneral',
    materialQuestion: 'modeMaterial',
    examCreation: 'modeExam',
    practiceTasks: 'modePractice',
    correction: 'modeCorrection'
  };
  return String(labels[keys[intent]]);
}
