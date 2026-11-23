import type { Profile } from './types.ts';
import { ASSISTANT_INTENTS, type AssistantIntent } from './assistant-router.ts';

export const PROFILE_KEY = 'examvision-profile';

export const emptyProfile: Profile = {
  docs: [],
  exams: [],
  artifacts: [],
  chat: [],
  lang: 'de',
  ocrLang: 'deu',
  scale: [92, 81, 67, 50, 25],
  minutes: 45,
  weak: [],
  aiEndpoint: '',
  aiModel: ''
};

function object(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function array(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

export function normalizeProfile(value: unknown): Profile {
  const raw = object(value);
  const lang = typeof raw.lang === 'string' && ['de', 'en', 'ar', 'fr', 'es'].includes(raw.lang) ? raw.lang : 'de';
  const scale = array(raw.scale).map(Number).filter(n => Number.isFinite(n) && n >= 0 && n <= 100);
  return {
    docs: array(raw.docs).filter(doc => doc && typeof doc.id === 'string' && typeof doc.text === 'string'),
    exams: array(raw.exams).filter(exam => exam && typeof exam.id === 'string' && Array.isArray(exam.questions)),
    artifacts: array(raw.artifacts).filter(item => item && typeof item.id === 'string' && typeof item.kind === 'string' && item.data && typeof item.data === 'object'),
    chat: array(raw.chat)
      .filter(item => item && typeof item.id === 'string' && typeof item.question === 'string' && typeof item.answer === 'string')
      .map(item => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        sources: array(item.sources).filter(source => typeof source === 'string'),
        created: typeof item.created === 'string' ? item.created : new Date().toISOString(),
        mode: item.mode === 'ai' ? 'ai' : 'local',
        ...(ASSISTANT_INTENTS.includes(item.intent) ? { intent: item.intent as AssistantIntent } : {})
      })),
    lang,
    ocrLang: typeof raw.ocrLang === 'string' && raw.ocrLang.length ? raw.ocrLang : 'deu',
    scale: scale.length === 5 ? scale : [...emptyProfile.scale],
    minutes: Number.isFinite(Number(raw.minutes)) ? Math.max(1, Math.min(180, Number(raw.minutes))) : 45,
    weak: array(raw.weak).filter(x => typeof x === 'string'),
    aiEndpoint: typeof raw.aiEndpoint === 'string' ? raw.aiEndpoint : '',
    aiModel: typeof raw.aiModel === 'string' ? raw.aiModel : ''
  };
}
