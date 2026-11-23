import test from 'node:test';
import assert from 'node:assert/strict';
import { artifactPdfFilename, correctionPdfFilename, documentFilename, safeFilename, workPdfFilename } from './file-naming.ts';
import type { Artifact, Exam } from './types.ts';

const exam: Exam = {
  id: 'e1',
  title: 'Klassenarbeit',
  subject: 'Mathematik',
  created: '2026-11-23T10:00:00.000Z',
  mode: 'exam',
  questions: [],
  duration: 45,
};

test('safeFilename keeps German letters and removes path separators', () => {
  assert.equal(safeFilename('Mathematik/Klassenarbeit? 23'), 'Mathematik_Klassenarbeit_ 23');
  assert.equal(safeFilename('   '), 'ExamVision-AI');
});

test('document filename uses subject, title and German date order', () => {
  assert.equal(documentFilename({ subject: 'Mathematik', title: 'Klassenarbeit', date: '2026-11-23T10:00:00Z' }), 'Mathematik_Klassenarbeit_23-11-2026.pdf');
  assert.equal(documentFilename({ subject: 'Mathematik', title: 'Klassenarbeit Mathematik', date: '2026-11-23T10:00:00Z' }), 'Klassenarbeit Mathematik_23-11-2026.pdf');
});

test('work, model solution and correction filenames stay distinguishable', () => {
  assert.equal(workPdfFilename(exam), 'Mathematik_Klassenarbeit_23-11-2026.pdf');
  assert.equal(workPdfFilename(exam, { suffix: 'Musterloesung' }), 'Mathematik_Klassenarbeit_Musterloesung_23-11-2026.pdf');
  assert.equal(correctionPdfFilename(exam), 'Mathematik_Klassenarbeit_Korrektur_23-11-2026.pdf');
});

test('artifact filenames use the artifact subject and creation date', () => {
  const artifact: Artifact = {
    id: 'a1',
    kind: 'worksheet',
    title: 'Bruchrechnung',
    subject: 'Mathematik',
    topic: 'Brüche',
    created: '2026-01-02T10:00:00Z',
    lang: 'de',
    data: {},
  };
  assert.equal(artifactPdfFilename(artifact), 'Mathematik_Bruchrechnung_02-01-2026.pdf');
});
