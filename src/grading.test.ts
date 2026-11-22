import test from 'node:test';
import assert from 'node:assert/strict';
import { localFeedback, type FeedbackLabels } from './grading.ts';
import type { Evaluation } from './core.ts';

const labels: FeedbackLabels = {
  fbEmpty: 'Keine Antwort',
  fbUncertain: 'Unsicher',
  fbFull: 'Vollständig',
  fbPartial: 'Teilweise',
  fbMissing: 'Fehlt:',
  fbNoNumber: 'Keine Nummer erkannt',
  fbPartialReview: 'Teilweise, bitte prüfen',
  fbNoConcepts: 'Keine Konzepte erkannt'
};

const result = (ratio: number, missing: string[] = []): Evaluation => ({
  points: 1, maxPoints: 4, ratio, confidence: .8, uncertain: false,
  missingConcepts: missing, method: 'local-evidence'
});

test('local feedback distinguishes empty, full, partial and missing answers', () => {
  assert.equal(localFeedback(result(0), '', labels), labels.fbEmpty);
  assert.equal(localFeedback(result(.9), 'Alpha wird durch Papier gestoppt.', labels), labels.fbFull);
  assert.match(localFeedback(result(.5, ['lead']), 'Gamma dringt tief ein.', labels), /Teilweise/);
  assert.match(localFeedback(result(.5, ['lead']), 'Gamma dringt tief ein.', labels), /lead/);
  assert.equal(localFeedback(result(.1), 'Keine Ahnung.', labels), labels.fbNoConcepts);
});

test('unreadable answer sheets are never treated as correct', () => {
  const ocr = localFeedback(result(.9), 'maybe alpha', labels, { unassigned: true, ocrReview: true });
  assert.equal(ocr, labels.fbNoNumber);
  const review = localFeedback(result(.5, ['blei']), 'strahlung', labels, { ocrReview: true });
  assert.match(review, /bitte prüfen/);
  assert.match(review, /blei/);
});
