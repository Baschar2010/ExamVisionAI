import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { del, get, set } from 'idb-keyval';
import { emptyProfile } from './profile.ts';
import {
  createSaveEnvelope,
  IDB_PROFILE_KEY,
  LEGACY_PROFILE_KEY,
  mergeProfileCandidates,
  NATIVE_PROFILE_PATH,
  parseLegacyProfile,
  unwrapSavedProfile,
  type ProfileCandidate,
} from './profile-merge.ts';
import type { Profile } from './types.ts';

export type LoadResult = {
  profile: Profile;
  sources: string[];
  error?: string;
};

let writeChain: Promise<void> = Promise.resolve();

export async function loadProfile(): Promise<LoadResult> {
  const candidates: ProfileCandidate[] = [];
  const sources: string[] = [];
  let error = '';

  const local = parseLegacyProfile(safeLocalStorageRead(LEGACY_PROFILE_KEY));
  if (local) {
    candidates.push({ source: 'localStorage', ...local, profile: local.profile as Profile });
    sources.push('localStorage');
  }

  try {
    const idbValue = await get(IDB_PROFILE_KEY);
    if (idbValue != null) {
      const parsed = unwrapSavedProfile(idbValue);
      candidates.push({ source: 'IndexedDB', ...parsed, profile: parsed.profile as Profile });
      sources.push('IndexedDB');
    }
  } catch {
    error = 'IndexedDB konnte nicht gelesen werden.';
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.readFile({
        path: NATIVE_PROFILE_PATH,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const native = parseLegacyProfile(String(result.data));
      if (native) {
        candidates.push({ source: 'Gerätespeicher', ...native, profile: native.profile as Profile });
        sources.push('Gerätespeicher');
      }
    } catch {
      // A missing native backup is normal on first start or after migration.
    }
  }

  return {
    profile: candidates.length ? mergeProfileCandidates(candidates) : { ...emptyProfile },
    sources,
    error,
  };
}

function safeLocalStorageRead(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const savedAt = new Date().toISOString();
  const envelope = createSaveEnvelope(profile, savedAt);
  const serialized = JSON.stringify(profile);

  try {
    localStorage.setItem(LEGACY_PROFILE_KEY, serialized);
  } catch {
    // IndexedDB and the native backup remain authoritative if localStorage is full.
  }
  try {
    await set(IDB_PROFILE_KEY, profile);
  } catch {
    // The native backup and localStorage still hold the current profile.
  }

  if (!Capacitor.isNativePlatform()) return;
  writeChain = writeChain
    .catch(() => undefined)
    .then(() =>
      Filesystem.writeFile({
        path: NATIVE_PROFILE_PATH,
        data: envelope,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      }),
    )
    .then(() => undefined);
  await writeChain;
}

export async function clearProfile(): Promise<void> {
  writeChain = writeChain.catch(() => undefined).then(async () => {
    try {
      localStorage.removeItem(LEGACY_PROFILE_KEY);
    } catch {
      // Ignore storage access errors; the other stores are still cleared.
    }
    await del(IDB_PROFILE_KEY).catch(() => undefined);
    if (Capacitor.isNativePlatform()) {
      await Filesystem.deleteFile({
        path: NATIVE_PROFILE_PATH,
        directory: Directory.Data,
      }).catch(() => undefined);
    }
  });
  await writeChain;
}
