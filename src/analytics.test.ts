import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLearning, examPercent, topicStats, trendStats, type ScoredExam } from './analytics.ts';

const exams: ScoredExam[] = [
  { id: 'e1', created: '2026-10-01T10:00:00.000Z', submitted: true, questions: [
    { topic: 'alpha', points: 4, earned: 4 },
    { topic: 'beta', points: 4, earned: 1 }
  ] },
  { id: 'e2', created: '2026-10-10T10:00:00.000Z', submitted: true, questions: [
    { topic: 'alpha', points: 4, earned: 3 },
    { topic: 'gamma', points: 4, earned: 4 }
  ] },
  { id: 'draft', created: '2026-10-20T10:00:00.000Z', questions: [
    { topic: 'alpha', points: 4, earned: 0 }
  ] }
];

test('exam percentage ignores unsubmitted drafts and clamps invalid values', () => {
  assert.equal(examPercent(exams[0]), 63);
  assert.equal(examPercent(exams[2]), 0);
});

test('topic statistics calculate per-topic percentages and keep explicit weak topics', () => {
  const stats = topicStats(exams, ['shielding']);
  const alpha = stats.find(x => x.topic === 'alpha');
  const beta = stats.find(x => x.topic === 'beta');
  const shielding = stats.find(x => x.topic === 'shielding');
  assert.equal(alpha?.percent, 88);
  assert.equal(alpha?.attempts, 2);
  assert.equal(beta?.percent, 25);
  assert.equal(shielding?.needsReview, true);
  assert.equal(shielding?.percent, 0);
});

test('trend follows chronological order and groups older exams first', () => {
  const trend = trendStats(exams, 2);
  assert.equal(trend.length, 2);
  assert.ok(trend[0].label.length > 0);
  assert.equal(trend[0].exams, 1);
  assert.equal(trend[0].percent, 63);
  assert.equal(trend[1].percent, 88);
});

test('learning analytics summarizes totals, weakest and strongest topics', () => {
  const result = analyzeLearning(exams, ['shielding'], 75);
  assert.equal(result.submitted, 2);
  assert.equal(result.earned, 12);
  assert.equal(result.possible, 16);
  assert.equal(result.percent, 75);
  assert.equal(result.minutes, 75);
  assert.ok(result.weakest.includes('beta'));
  assert.ok(result.strongest.includes('alpha'));
});

test('learning analytics returns safe empty values without submitted exams', () => {
  const result = analyzeLearning([], [], 0);
  assert.equal(result.percent, 0);
  assert.deepEqual(result.topics, []);
  assert.deepEqual(result.trend, []);
});
