import { emptyProfile, normalizeProfile, PROFILE_KEY } from './profile.ts';
import type { Doc, Exam, Artifact, ChatTurn, Profile } from './types.ts';

export type ProfileCandidate = {
  source: string;
  savedAt: string;
  profile: Profile;
};

export const SAVE_ENVELOPE_FORMAT = 'examvision-ai-save';
export const NATIVE_PROFILE_PATH = 'profile.json';
export const IDB_PROFILE_KEY = 'profile';

function object(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function array(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function timestamp(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? '' : new Date(parsed).toISOString();
}

export function inferSavedAt(value: unknown): string {
  const raw = object(value);
  const direct = timestamp(raw.savedAt) || timestamp(raw.exported);
  if (direct) return direct;
  const times = [
    ...array(raw.docs).map((item) => timestamp(item?.added)),
    ...array(raw.exams).map((item) => timestamp(item?.created)),
    ...array(raw.artifacts).map((item) => timestamp(item?.created)),
    ...array(raw.chat).map((item) => timestamp(item?.created)),
  ].filter(Boolean).sort();
  return times.length ? times[times.length - 1] : '';
}

export function unwrapSavedProfile(value: unknown): { profile: unknown; savedAt: string } {
  const raw = object(value);
  if (raw.format === SAVE_ENVELOPE_FORMAT && raw.profile && typeof raw.profile === 'object') {
    return { profile: raw.profile, savedAt: inferSavedAt(raw) || inferSavedAt(raw.profile) };
  }
  if (raw && raw.profile && typeof raw.profile === 'object' && !Array.isArray(raw.profile) && raw.savedAt) {
    return { profile: raw.profile, savedAt: inferSavedAt(raw) };
  }
  return { profile: value, savedAt: inferSavedAt(value) };
}

function mergeById<T extends { id: string }>(
  older: T[],
  newer: T[],
  preserveKeys: Array<keyof T>,
): T[] {
  const result = new Map<string, T>(older.map((item) => [item.id, item]));
  for (const item of newer) {
    const previous = result.get(item.id);
    if (!previous) {
      result.set(item.id, item);
      continue;
    }
    const merged = { ...previous, ...item } as T;
    for (const key of preserveKeys) {
      const previousValue = previous[key];
      const nextValue = item[key];
      const nextEmpty = nextValue == null || (Array.isArray(nextValue) && nextValue.length === 0) || (typeof nextValue === 'string' && !nextValue.trim());
      if (nextEmpty && previousValue != null) merged[key] = previousValue;
    }
    result.set(item.id, merged);
  }
  return [...result.values()];
}

export function mergeProfileCandidates(candidates: ProfileCandidate[]): Profile {
  const ordered = candidates
    .slice()
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  let result: Profile = { ...emptyProfile };
  for (const candidate of ordered) {
    const profile = normalizeProfile(candidate.profile);
    result = {
      ...result,
      ...profile,
      docs: mergeById<Doc>(result.docs, profile.docs, ['text', 'profile']),
      exams: mergeById<Exam>(result.exams, profile.exams, ['questions', 'title', 'subject']),
      artifacts: mergeById<Artifact>(result.artifacts, profile.artifacts, ['data', 'title']),
      chat: mergeById<ChatTurn>(result.chat, profile.chat, ['answer', 'sources']),
    };
  }
  return result;
}

export function createSaveEnvelope(profile: Profile, savedAt = new Date().toISOString()): string {
  return JSON.stringify({
    format: SAVE_ENVELOPE_FORMAT,
    version: 1,
    savedAt,
    profile,
  });
}

export function parseLegacyProfile(value: string): { profile: unknown; savedAt: string } | null {
  if (!value) return null;
  try {
    return unwrapSavedProfile(JSON.parse(value));
  } catch {
    return null;
  }
}

export const LEGACY_PROFILE_KEY = PROFILE_KEY;
