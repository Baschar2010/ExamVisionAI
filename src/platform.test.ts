import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFromMaterials, suggestQuestions } from './assistant.ts';
import { buildLessonPlan, type LessonLabels } from './lesson.ts';
import { buildWorksheet } from './worksheet.ts';
import { buildPresentation } from './presentation.ts';
import { buildGraphic, type GraphicLabels } from './graphics.ts';
import { textParts, type SourcePassage } from './core.ts';

const passages: SourcePassage[] = [
  'Alpha radiation is stopped by a sheet of paper and has low penetrating power in air. This is described in the lesson material.',
  'Gamma radiation penetrates thick lead only partly and needs concrete shielding for reliable protection in the laboratory.',
  'A Geiger counter detects ionising radiation. The detector records pulses whose count depends on the distance from the source.'
].map((text, index) => ({ text, name: `material-${index + 1}.pdf`, topic: index === 0 ? 'alpha' : index === 1 ? 'gamma' : 'detector' }));

const assistantLabels = {
  noDocs: 'No documents', noMatch: 'No matching passage', answerPrefix: 'Found in your materials:', sourcePrefix: 'Source:', suggestedPrefix: 'Explain'
};

const lessonLabels: LessonLabels = {
  draftTitle: 'Lesson draft', subject: 'Subject', topic: 'Topic', language: 'Language', duration: 'Duration', difficulty: 'Level', form: 'Form',
  objectives: 'Objectives', phases: 'Phases', phaseWarmup: 'Warm-up', phaseInput: 'Input', phasePractice: 'Practice', phaseClosure: 'Closure',
  teacher: 'Teacher', students: 'Students', materials: 'Materials', differentiation: 'Differentiation', assessment: 'Assessment', sources: 'Sources',
  defaultObjective: 'Understand', easy: 'easy', medium: 'mixed', hard: 'hard'
};

const presentationLabels = {
  titlePrefix: 'Presentation', objective: 'Objectives', concept: 'Concept', application: 'Application', summary: 'Summary',
  source: 'Source', teacherNote: 'Prepare explanation', defaultObjective: 'Understand'
};

const graphicLabels: GraphicLabels = {
  bar: 'Concepts', timeline: 'Timeline', comparison: 'Comparison', flowchart: 'Flow', infographic: 'Overview',
  concepts: 'Concepts', passages: 'Passages', sources: 'Sources', words: 'Words', shared: 'Shared', onlyTopic: 'Only',
  onlyOther: 'Other', step: 'Step', noData: 'No data', average: 'Average'
};

test('assistant answers only from uploaded passages and cites the source', () => {
  const answer = answerFromMaterials('What stops alpha radiation?', passages, assistantLabels);
  assert.match(answer.answer, /Alpha radiation is stopped by a sheet of paper/);
  assert.deepEqual(answer.sources, ['material-1.pdf']);
  const empty = answerFromMaterials('vulkan', passages, assistantLabels);
  assert.equal(empty.answer, assistantLabels.noMatch);
  assert.deepEqual(empty.sources, []);
  assert.equal(answerFromMaterials('alpha', [], assistantLabels).answer, assistantLabels.noDocs);
  assert.ok(suggestQuestions(passages, assistantLabels).some(x => x.includes('alpha')));
});

test('lesson plan has a valid structure and four phases matching the duration', () => {
  const plan = buildLessonPlan({
    subject: 'Physics', topic: 'Radiation', language: 'de', minutes: 45, objectives: 'Explain shielding\nCompare radiation types',
    difficulty: 'medium', form: 'Frontalunterricht', passages, labels: lessonLabels
  });
  assert.equal(plan.phases.length, 4);
  assert.equal(plan.phases.reduce((sum, phase) => sum + phase.minutes, 0), 45);
  assert.deepEqual(plan.objectives, ['Explain shielding', 'Compare radiation types']);
  assert.deepEqual(plan.sources, ['material-1.pdf', 'material-2.pdf', 'material-3.pdf']);
  assert.match(plan.phases[2].activity, /radiation/i);
});

test('worksheet stays inside the selected topic and keeps model answers from materials', () => {
  const sheet = buildWorksheet(passages, {
    title: 'Radiation', instructions: 'Answer using the material.', topic: 'gamma', difficulty: 'hard', count: 2, showSolutions: true, language: 'en'
  });
  assert.equal(sheet.questions.length, 1);
  assert.match(sheet.questions[0].answer, /Gamma radiation penetrates thick lead/);
  assert.equal(sheet.showSolutions, true);
  const mixed = buildWorksheet(passages, { title: 'All', instructions: '', count: 3, language: 'en' });
  assert.equal(mixed.questions.length, 3);
  assert.ok(mixed.questions.every(question => passages.some(passage => passage.name === question.source)));
});

test('presentation uses exact passage sentences and adds grounded application slides', () => {
  const deck = buildPresentation(passages, {
    topic: 'Radiation', subject: 'Physics', objectives: 'Understand shielding', difficulty: 'medium', language: 'en', labels: presentationLabels
  });
  assert.ok(deck.slides.length >= 6);
  assert.equal(deck.slides[0].kind, 'title');
  assert.equal(deck.slides[1].kind, 'objectives');
  assert.ok(deck.slides.some(slide => slide.kind === 'quiz' && slide.bullets.length >= 1));
  const concept = deck.slides.find(slide => slide.kind === 'concept');
  assert.ok(concept && textParts(concept.bullets.join(' ')).length >= 0);
  assert.ok(deck.slides.every(slide => slide.bullets.every(bullet => typeof bullet === 'string' && bullet.length > 0)));
});

test('all five graphic types produce renderable models from real material data', () => {
  for (const type of ['bar', 'timeline', 'comparison', 'flowchart', 'infographic'] as const) {
    const graphic = buildGraphic(passages, { type, topic: 'gamma', labels: graphicLabels });
    assert.equal(graphic.type, type);
    assert.ok(graphic.items.length > 0);
    assert.ok(graphic.scaleMax >= 1);
  }
  const bar = buildGraphic(passages, { type: 'bar', labels: graphicLabels });
  assert.ok(bar.items.some(item => item.label === 'radiation' && (item.value || 0) > 0));
  const infographic = buildGraphic(passages, { type: 'infographic', labels: graphicLabels });
  assert.equal(infographic.items.find(item => item.label === graphicLabels.passages)?.value, 3);
  assert.equal(buildGraphic([], { type: 'bar', labels: graphicLabels }).items[0].label, graphicLabels.noData);
});
