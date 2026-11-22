import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, normalizeProfile, PROFILE_KEY } from './profile.ts';

test('profile storage key is stable for migration', () => {
  assert.equal(PROFILE_KEY, 'examvision-profile');
  assert.deepEqual(emptyProfile.scale, [92, 81, 67, 50, 25]);
});

test('normalizeProfile repairs missing, invalid and partially saved data', () => {
  const profile = normalizeProfile({
    lang: 'ar',
    ocrLang: 'ara',
    minutes: 999,
    scale: [90, 80],
    weak: ['alpha', 42],
    docs: [{ id: 'd1', text: 'lesson' }, null],
    exams: [{ id: 'e1', questions: [] }, 'bad'],
    aiEndpoint: 'https://model.example',
    aiModel: 'local-model'
  });
  assert.equal(profile.lang, 'ar');
  assert.equal(profile.minutes, 180);
  assert.deepEqual(profile.scale, [92, 81, 67, 50, 25]);
  assert.deepEqual(profile.weak, ['alpha']);
  assert.equal(profile.docs.length, 1);
  assert.equal(profile.exams.length, 1);
  assert.equal(profile.aiEndpoint, 'https://model.example');
  assert.equal(profile.aiModel, 'local-model');
});

test('normalizeProfile tolerates an empty or corrupt fallback', () => {
  assert.deepEqual(normalizeProfile(null), emptyProfile);
  assert.equal(normalizeProfile({ lang: 'xx' }).lang, 'de');
});
