import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamPdfBlocks, isRtlText, paginateBlocks, wrapText } from './pdf-layout.ts';

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

test('pagination starts a new page before the bottom margin and resets y', () => {
  const blocks = Array.from({ length: 8 }, () => ({ lines: [{ text: 'Zeile', x: 18, size: 10, rtl: false, height: 40 }], gapAfter: 0 }));
  const pages = paginateBlocks(blocks, { top: 20, bottom: 100 });
  assert.equal(pages.length, 4);
  assert.equal(pages[0].length, 2);
  assert.equal(pages[1][0].y, 20);
});
