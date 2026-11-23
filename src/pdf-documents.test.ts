import test from 'node:test';
import assert from 'node:assert/strict';
import { imageBlock, paginateBlocks, tableBlocks, textBlocks } from './pdf-layout.ts';
import { buildArtifactPdfBlocks, buildCorrectionBlocks, buildOverviewBlocks, buildWorksheetBlocks } from './pdf-documents.ts';
import type { Artifact, Exam } from './types.ts';
import type { Worksheet } from './worksheet.ts';

const labels: Record<string, string> = {
  date: 'Datum', subject: 'Fach', value: 'Wert', objectives: 'Lernziele', phases: 'Phasen',
  minutesShort: 'Min', differentiation: 'Differenzierung', assessment: 'Leistungsfeststellung',
  sources: 'Quellen', taskLabel: 'Nr.', prompt: 'Aufgabe', points: 'Punkte', solution: 'Lösung',
  source: 'Quelle', slide: 'Folie', slideNotes: 'Hinweise', topic: 'Thema', concepts: 'Begriffe',
  details: 'Details', correction: 'Korrektur', achieved: 'erreicht', feedback: 'Rückmeldung',
  answer: 'Antwort', reportExams: 'Arbeiten', reportMinutes: 'Minuten', avgScore: 'Durchschnitt',
  reportWeak: 'Wiederholen', noWeak: 'keine', topicResults: 'Themenergebnisse', percent: 'Prozent',
  result: 'Ergebnis', reportTrend: 'Trend'
};

const worksheet: Worksheet = {
  title: 'Strahlung',
  instructions: 'Beantworte alle Fragen.',
  topic: 'Strahlung',
  difficulty: 'medium',
  showSolutions: true,
  questions: [
    { id: 'q1', prompt: 'Was stoppt Alpha-Strahlung?', answer: 'Ein Blatt Papier.', source: 'physik.pdf', topic: 'alpha', points: 3 },
    { id: 'q2', prompt: 'Wie schirmt man Gamma-Strahlung ab?', answer: 'Blei und Beton.', source: 'physik.pdf', topic: 'gamma', points: 4 }
  ]
};

test('worksheet PDF uses a table and keeps long cell text inside the row', () => {
  const blocks = buildWorksheetBlocks(worksheet, labels);
  const cells = blocks.flatMap(block => block.lines).filter(line => line.cells);
  assert.ok(cells.length >= 4);
  assert.ok(cells.every(line => line.cells!.every(cell => cell.lines.every(part => part.length > 0))));
  const text = JSON.stringify(cells);
  assert.match(text, /Alpha-Strahlung/);
  assert.match(text, /Ein Blatt Papier/);
  assert.ok(cells.every(line => line.height > 0));
});

test('table headers repeat on new pages and never exceed the bottom margin', () => {
  const blocks = tableBlocks(['Nr.', 'Text'], Array.from({ length: 40 }, (_, i) => [String(i + 1), `Zeile ${i + 1}`]), { id: 'long-table' });
  const pages = paginateBlocks(blocks, { top: 20, bottom: 100 });
  assert.ok(pages.length > 2);
  assert.ok(pages.slice(1).every(page => page[0]?.header === true));
  assert.ok(pages.every(page => page.every(line => line.y! + line.height <= 100)));
});

test('graphic artifact embeds the image and keeps Arabic text RTL', () => {
  const artifact: Artifact = {
    id: 'a1', kind: 'graphic', title: 'الإشعاع', subject: ' physically', topic: 'اشعة',
    created: new Date().toISOString(), lang: 'ar',
    data: {
      type: 'bar', title: 'الإشعاع', subtitle: 'أنواع الإشعاع', scaleMax: 10,
      footer: 'المصدر: الكتاب', items: [{ label: 'اشعة الفا', value: 4, text: 'ورقة', detail: 'تفاصيل' }]
    }
  };
  const image = { src: 'data:image/png;base64,AAAA', width: 170, height: 80 };
  const blocks = buildArtifactPdfBlocks(artifact, labels, image);
  const lines = blocks.flatMap(block => block.lines);
  assert.ok(lines.some(line => line.image?.src === image.src));
  assert.ok(lines.some(line => line.rtl && line.text.includes('الإشعاع')));
  const pages = paginateBlocks(blocks, { top: 20, bottom: 120 });
  assert.ok(pages.every(page => page.every(line => line.y! + line.height <= 120)));
});

test('correction and overview blocks include feedback, tables and page numbers metadata', () => {
  const exam: Exam = {
    id: 'e1', title: 'Test', subject: 'Physik', created: new Date().toISOString(), mode: 'normal',
    duration: 45, questions: [{ id: 'q1', prompt: 'Erkläre Alpha.', answer: 'Papier.', source: 'pdf', topic: 'alpha', points: 3, response: 'Papier', earned: 2, feedback: 'Fast richtig.' }]
  };
  const flatten = (lines: Array<{ text: string; cells?: Array<{ lines: string[] }> }>) =>
    lines.map(line => line.cells ? line.cells.flatMap(cell => cell.lines).join(' ') : line.text).join(' ');
  const correction = flatten(buildCorrectionBlocks(exam, labels).flatMap(block => block.lines));
  assert.match(correction, /Fast richtig/);
  assert.match(correction, /Papier/);
  const overview = flatten(buildOverviewBlocks({
    title: 'Lernübersicht', submitted: 2, minutes: 60, percent: 70, weakest: ['alpha'],
    topics: [{ topic: 'alpha', percent: 70, earned: 7, possible: 10 }],
    trend: [{ label: 'Nov', percent: 70 }]
  }, labels).flatMap(block => block.lines));
  assert.match(overview, /Themenergebnisse/);
  assert.match(overview, /alpha/);
  const withText = textBlocks([{ text: 'Seitenzahl wird im PDF gesetzt', size: 10 }]);
  assert.equal(withText.length, 1);
  assert.ok(imageBlock({ src: 'data:image/png;base64,AAAA', width: 100, height: 50 }).lines[0].image);
});
