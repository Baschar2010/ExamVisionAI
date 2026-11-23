import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamPdfBlocks, buildReportPdfBlocks, isRtlText, paginateBlocks, wrapText } from './pdf-layout.ts';

test('long words and wrapped text never exceed the requested width', () => {
  const lines = wrapText('kurz Absorptionsvermögen von Gammastrahlung', 12);
  assert.ok(lines.length > 1);
  assert.ok(lines.every(line => line.length <= 12));
  assert.deepEqual(wrapText('', 12), ['']);
});

test('Arabic and Hebrew text is detected as RTL, Latin text is not', () => {
  assert.equal(isRtlText('اشعة الفا'), true);
  assert.equal(isRtlText('Alpha radiation'), false);
});

test('exam blocks include numbered prompts, solutions and answer space', () => {
  const blocks = buildExamPdfBlocks(
    { title: 'Test', created: '2026-11-22T10:00:00.000Z', questions: [{ prompt: 'Erkläre Alpha.', answer: 'Paper stops alpha.', points: 4, earned: 2, response: 'Paper.' }] },
    true,
    { date: 'Datum', points: 'Punkte', solution: 'Lösung', answer: 'Antwort', achieved: 'erreicht' }
  );
  const text = blocks.flatMap(block => block.lines.map(line => line.text)).join('\n');
  assert.match(text, /1\. Erkläre Alpha\./);
  assert.match(text, /Lösung: Paper stops alpha\./);
  assert.match(text, /Antwort: Paper\./);
});

test('exam blocks show header, objectives, formats and marked multiple-choice options', () => {
  const blocks = buildExamPdfBlocks(
    {
      title: 'Biologie', created: '2026-11-23T10:00:00.000Z', subject: 'Biologie', gradeLevel: '8',
      headerName: 'Name', headerClass: 'Klasse', headerDate: 'Datum',
      goal: 'Die Fotosynthese erklären', objectives: ['Chlorophyll benennen'], gradingScale: '92/81/67',
      questions: [{ prompt: 'Wähle die richtige Antwort.', answer: 'Chlorophyll', points: 3, format: 'Multiple Choice', options: ['Glucose', 'Chlorophyll', 'Stärke', 'Wasser'], correctIndex: 1 }]
    },
    true,
    { date: 'Datum', points: 'Punkte', solution: 'Lösung', answer: 'Antwort', achieved: 'erreicht', correct: 'richtig' }
  );
  const text = blocks.flatMap(block => block.lines.map(line => line.text)).join('\n');
  assert.match(text, /Fach: Biologie/);
  assert.match(text, /Klasse: 8/);
  assert.match(text, /Lernziele:/);
  assert.match(text, /Chlorophyll benennen/);
  assert.match(text, /Multiple Choice/);
  assert.match(text, /B\) Chlorophyll richtig/);
  assert.match(text, /Notenschlüssel/);
});

test('pagination starts a new page before the bottom margin and resets y', () => {
  const blocks = Array.from({ length: 8 }, () => ({ lines: [{ text: 'Zeile', x: 18, size: 10, rtl: false, height: 40 }], gapAfter: 0 }));
  const pages = paginateBlocks(blocks, { top: 20, bottom: 100 });
  assert.equal(pages.length, 4);
  assert.equal(pages[0].length, 2);
  assert.equal(pages[1][0].y, 20);
});

test('learning report blocks keep Arabic topics and paginate without clipping', () => {
  const blocks = buildReportPdfBlocks(
    { title: 'Lernfortschritt', submitted: 3, minutes: 90, percent: 72, weakest: ['اشعة'], topics: [{ topic: 'اشعة الفا', percent: 40, earned: 2, possible: 5 }], trend: [{ label: 'Nov 26', percent: 72 }] },
    { exams: 'Arbeiten', minutes: 'Minuten', average: 'Durchschnitt', weak: 'Wiederholen', none: 'keine', topics: 'Themen', trend: 'Trend' }
  );
  const lines = blocks.flatMap(block => block.lines);
  assert.ok(lines.some(line => line.text.includes('اشعة الفا') && line.rtl));
  assert.ok(lines.every(line => line.height > 0 && wrapText(line.text, 200).length >= 1));
  const pages = paginateBlocks(blocks, { top: 20, bottom: 60 });
  assert.ok(pages.length >= 2);
  assert.ok(pages.every(page => page.every(line => (line.y || 0) + line.height <= 60)));
});
