import { saveTextFile, type SavedFile } from './native-io.ts';
import { normalizeProfile } from './profile.ts';
import type { Profile } from './types.ts';

export const DATA_FORMAT = 'examvision-ai-profile';

export function serializeProfile(profile: Profile): string {
  return JSON.stringify({
    format: DATA_FORMAT,
    version: 1,
    exported: new Date().toISOString(),
    profile
  }, null, 2);
}

export function parseProfile(text: string): Profile {
  const raw: any = JSON.parse(text);
  if (!raw || raw.format !== DATA_FORMAT || !raw.profile || typeof raw.profile !== 'object' || Array.isArray(raw.profile)) {
    throw new Error('invalid profile file');
  }
  return normalizeProfile(raw.profile);
}

export function downloadTextFile(filename: string, text: string, mime = 'application/json'): Promise<SavedFile> {
  return saveTextFile(filename, text, mime);
}
