import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_FORMAT, parseProfile, serializeProfile } from './data-transfer.ts';
import { emptyProfile } from './profile.ts';

test('exported profile keeps artifacts, chat and original documents', () => {
  const profile = {
    ...emptyProfile,
    docs: [{ id: 'd1', name: 'notes.pdf', type: 'application/pdf', text: 'Alpha radiation is stopped by paper.', pages: 1, quality: .9, role: 'material' as const, added: '2026-01-01T00:00:00.000Z' }],
    artifacts: [{ id: 'a1', kind: 'lesson' as const, title: 'Lesson', subject: 'Physics', topic: 'Radiation', created: '2026-01-02T00:00:00.000Z', lang: 'de', data: { phases: [] } }],
    chat: [{ id: 'c1', question: 'What stops alpha?', answer: 'Paper.', sources: ['notes.pdf'], created: '2026-01-03T00:00:00.000Z', mode: 'local' as const }]
  };
  const serialized = serializeProfile(profile);
  assert.match(serialized, new RegExp(DATA_FORMAT));
  const restored = parseProfile(serialized);
  assert.equal(restored.docs[0].text, profile.docs[0].text);
  assert.equal(restored.artifacts[0].kind, 'lesson');
  assert.equal(restored.chat[0].sources[0], 'notes.pdf');
});

test('import rejects unrelated JSON files', () => {
  assert.throws(() => parseProfile('{"hello":"world"}'));
  assert.throws(() => parseProfile('not json'));
});
