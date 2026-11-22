import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTemplate, buildGroundedQuestions, evaluateAnswer, extractAnswerAssignments, textParts } from './core.ts';
import { validateAiConfig, validateGrade, validateQuestions } from './ai-provider.ts';

test('PDF sentence extraction preserves distinct source passages', () => {
  const parts = textParts('Radiation has three types: alpha, beta and gamma. Each type has different penetrating power and shielding.');
  assert.equal(parts.length, 2);
});

test('template profile reads task count, points, task kinds and subparts', () => {
  const profile = analyzeTemplate('Aufgabe 1 (a) Erkläre die Strahlung. 4 Punkte\nAufgabe 2 (b) Vergleiche Alpha und Beta. 6 Punkte');
  assert.equal(profile.questionCount, 2);
  assert.deepEqual(profile.pointValues, [4, 6]);
  assert.ok(profile.taskKinds.includes('explain'));
  assert.ok(profile.taskKinds.includes('compare'));
  assert.equal(profile.subtaskCount, 2);
});

test('question set uses material passages only and never template answer text', () => {
  const materials = [
    { name: 'class-notes.pdf', text: 'Alpha radiation is stopped by paper. Beta radiation passes through paper but is stopped by thin aluminium.' },
    { name: 'class-notes.pdf', text: 'Gamma radiation is more penetrating and can be reduced by thick lead.' }
  ].flatMap(d => textParts(d.text).map(text => ({ ...d, text, topic: text.toLowerCase().includes('gamma') ? 'gamma' : 'alpha' })));
  const oldStyle = analyzeTemplate('Question 1 Explain your answer. (a) Compare these values. 4 points');
  const questions = buildGroundedQuestions(materials, 4, oldStyle);
  assert.ok(questions.length <= materials.length);
  assert.ok(questions.every(q => q.source === 'class-notes.pdf'));
  assert.ok(questions.every(q => !q.answer.toLowerCase().includes('electric power')));
  assert.ok(questions.some(q => q.prompt.toLowerCase().includes('vergleiche')));
  assert.ok(questions.every(q => q.points === 4));
});

test('evaluation accepts a paraphrase through known concept aliases and gives partial credit', () => {
  const full = evaluateAnswer('Alpha radiation is stopped by paper.', 'Alpha radiation is blocked by paper.', 4);
  assert.equal(full.points, 4);
  const partial = evaluateAnswer('Gamma radiation is more penetrating and can be reduced by thick lead.', 'Gamma rays penetrate deeply.', 4);
  assert.ok(partial.points > 0 && partial.points < 4);
  assert.equal(partial.method, 'local-evidence');
  assert.ok(partial.uncertain);
});

test('numbered answer import maps answers to question indices', () => {
  const assignments = extractAnswerAssignments('1. Alpha radiation is stopped by paper. 2. A Geiger Muller tube detects radiation. 3. Gamma radiation is reduced by thick lead.', 3);
  assert.equal(assignments.get(0), 'Alpha radiation is stopped by paper.');
  assert.equal(assignments.get(1), 'A Geiger Muller tube detects radiation.');
  assert.equal(assignments.get(2), 'Gamma radiation is reduced by thick lead.');
});

test('unmarked answer text is not guessed into a question assignment', () => {
  const assignments = extractAnswerAssignments('Alpha radiation is stopped by paper.', 3);
  assert.equal(assignments.size, 0);
});

test('AI gateway requires explicit sharing consent and HTTPS', () => {
  assert.throws(() => validateAiConfig({ endpoint: 'http://model.example', model: 'local', shareConsent: true }), /HTTPS/);
  assert.throws(() => validateAiConfig({ endpoint: 'https://model.example', model: 'local', shareConsent: false }), /ausdrücklich/);
});

test('AI question validation rejects evidence absent from current lessons', () => {
  const source = 'Alpha radiation is stopped by paper and is one of the three radiation types described here.';
  assert.throws(() => validateQuestions({ questions: [{ prompt: 'Explain electrical power?', answer: 'Power is voltage times current.', evidence: source, sourceIndex: 0, topic: 'electrical power', points: 2 }] }, [source], 2), /Thema/);
});

test('AI grade schema limits points to question total', () => {
  assert.throws(() => validateGrade({ points: 6, confidence: .8, explanation: 'Good.', missing: [] }, 4), /Schema/);
  assert.equal(validateGrade({ points: 2, confidence: .6, explanation: 'Some evidence.', missing: ['shielding'] }, 4).points, 2);
});
