import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSaveEnvelope,
  inferSavedAt,
  mergeProfileCandidates,
  parseLegacyProfile,
  unwrapSavedProfile,
  type ProfileCandidate,
} from './profile-merge.ts';
import { emptyProfile } from './profile.ts';
import type { Exam } from './types.ts';

const exam = (id: string, created: string, title: string): Exam => ({
  id,
  title,
  subject: 'Mathematik',
  created,
  mode: 'normal',
  questions: [{ id: `${id}-q`, prompt: 'Frage', answer: 'Antwort', source: 'Material', topic: 'Thema', points: 2, response: '' }],
  duration: 0,
});

test('merge keeps works from every source and does not delete older data', () => {
  const older = {
    ...emptyProfile,
    exams: [exam('e1', '2026-11-20T10:00:00Z', 'Arbeit A')],
    docs: [{ id: 'd1', name: 'alt.pdf', type: 'application/pdf', text: 'Alt', pages: 1, quality: .9, role: 'material' as const, added: '2026-11-20T10:00:00Z' }],
  };
  const newer = {
    ...emptyProfile,
    exams: [exam('e2', '2026-11-23T10:00:00Z', 'Arbeit B')],
    artifacts: [{ id: 'a1', kind: 'lesson' as const, title: 'Entwurf', subject: 'Mathematik', topic: 'Thema', created: '2026-11-23T10:00:00Z', lang: 'de', data: {} }],
  };
  const candidates: ProfileCandidate[] = [
    { source: 'localStorage', savedAt: '2026-11-20T10:00:00Z', profile: older },
    { source: 'Gerätespeicher', savedAt: '2026-11-23T10:00:00Z', profile: newer },
  ];
  const merged = mergeProfileCandidates(candidates);
  assert.deepEqual(merged.exams.map((item) => item.id).sort(), ['e1', 'e2']);
  assert.equal(merged.docs[0].name, 'alt.pdf');
  assert.equal(merged.artifacts[0].title, 'Entwurf');
});

test('duplicate id uses the newer backup but preserves non-empty questions', () => {
  const oldExam = exam('e1', '2026-11-20T10:00:00Z', 'Alter Titel');
  const staleCopy = exam('e1', '2026-11-20T10:00:00Z', 'Kopie');
  const newCopy = { ...exam('e1', '2026-11-23T10:00:00Z', 'Neuer Titel'), questions: [] };
  const merged = mergeProfileCandidates([
    { source: 'a', savedAt: '2026-11-22T00:00:00Z', profile: { ...emptyProfile, exams: [oldExam, staleCopy] } },
    { source: 'b', savedAt: '2026-11-23T00:00:00Z', profile: { ...emptyProfile, exams: [newCopy] } },
  ]);
  assert.equal(merged.exams.length, 1);
  assert.equal(merged.exams[0].title, 'Neuer Titel');
  assert.equal(merged.exams[0].questions.length, 1);
});

test('save envelope and legacy profiles are both readable', () => {
  const profile = { ...emptyProfile, exams: [exam('e1', '2026-11-23T10:00:00Z', 'Arbeit')] };
  const envelope = createSaveEnvelope(profile, '2026-11-23T12:00:00Z');
  const canonical = '2026-11-23T12:00:00.000Z';
  assert.equal(inferSavedAt(JSON.parse(envelope)), canonical);
  assert.equal(unwrapSavedProfile(JSON.parse(envelope)).savedAt, canonical);
  assert.equal(parseLegacyProfile(envelope)?.savedAt, canonical);
  assert.deepEqual(parseLegacyProfile(JSON.stringify(profile))?.profile, profile as any);
});
