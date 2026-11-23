import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TASK_FORMATS, FORMAT_BY_ID, defaultConfig, newBlock, inferFormats, suggestObjectives,
  makeChoiceOptions, buildCreation, defaultBlocks, reorderBlocks, reorderQuestions,
  validateCreation, gradeCreationQuestion, configFromExam, metaFromConfig, passagesFromText
} from './creation.ts';
import type { SourcePassage } from './core.ts';
import type { CreationConfig } from './types.ts';

const passages: SourcePassage[] = [
  { text: 'Pflanzen stellen Traubenzucker durch Fotosynthese her. Chlorophyll fängt das Sonnenlicht in den Blättern ein.', name: 'biologie.pdf', topic: 'Fotosynthese' },
  { text: 'Glucose wird in den Blättern gespeichert und dient als Energiespeicher für die Pflanze.', name: 'biologie.pdf', topic: 'Fotosynthese' },
  { text: 'Der Geigerzähler weist Gammastrahlung nach. Blei absorbiert die Strahlung stark.', name: 'physik.pdf', topic: 'Strahlung' },
  { text: 'Wasser und Kohlenstoffdioxid sind die Ausgangsstoffe der Fotosynthese.', name: 'biologie.pdf', topic: 'Fotosynthese' },
  { text: 'Papier stoppt Alpha-Strahlung bereits nach kurzer Strecke.', name: 'physik.pdf', topic: 'Strahlung' }
];

function configWith(formats: string[], overrides: Partial<CreationConfig> = {}): CreationConfig {
  const config = defaultConfig('de', 'Biologie');
  config.title = 'Klassenarbeit Fotosynthese';
  config.topic = 'Fotosynthese';
  config.goal = 'Die Schüler erklären die Fotosynthese.';
  config.objectives = ['Fotosynthese erklären'];
  config.selectedDocIds = ['doc1'];
  config.blocks = formats.map((id, index) => ({ ...newBlock(id, index), count: 1 }));
  return { ...config, ...overrides };
}

test('format catalogue contains more than 30 complete, unique formats', () => {
  assert.ok(TASK_FORMATS.length >= 40);
  assert.equal(new Set(TASK_FORMATS.map(format => format.id)).size, TASK_FORMATS.length);
  assert.equal(new Set(TASK_FORMATS.map(format => format.labelKey)).size, TASK_FORMATS.length);
  for (const format of TASK_FORMATS) {
    assert.equal(FORMAT_BY_ID.get(format.id), format);
    assert.ok(format.defaultLabel.length > 2);
    assert.ok(['open', 'choice', 'assign'].includes(format.kind));
    assert.ok(['I', 'II', 'III'].includes(format.requirementLevel));
  }
});

test('every catalogue format produces a grounded question', () => {
  for (const format of TASK_FORMATS) {
    const questions = buildCreation(configWith([format.id]), passages, 'Unklar');
    assert.equal(questions.length, 1, format.id);
    assert.ok(questions[0].prompt.length > 10, format.id);
    assert.ok(questions[0].answer.length > (format.kind === 'choice' ? 1 : 10), format.id);
    assert.ok(questions[0].points > 0, format.id);
    assert.equal(questions[0].formatId, format.id);
    assert.equal(questions[0].source.length > 0, true);
  }
});

test('multiple choice has exactly one correct and three distinct plausible distractors', () => {
  for (let index = 0; index < 40; index++) {
    const options = makeChoiceOptions(passages, index, 'de');
    assert.equal(options.options.length, 4);
    assert.equal(new Set(options.options).size, 4, `duplicate options at ${index}`);
    assert.ok(options.correctIndex >= 0 && options.correctIndex <= 3);
    assert.ok(options.options[options.correctIndex].length > 5);
    const repeated = makeChoiceOptions(passages, index, 'de');
    assert.deepEqual(repeated, options);
  }
  const single = makeChoiceOptions([passages[0]], 0, 'en');
  assert.equal(single.options.length, 4);
  assert.equal(new Set(single.options).size, 4);
});

test('true-false and statements use localised two-option sets', () => {
  const config = configWith(['true-false', 'statements']);
  const questions = buildCreation(config, passages, 'Unklar');
  assert.deepEqual(questions[0].options, ['Richtig', 'Falsch']);
  assert.deepEqual(questions[1].options, ['Trifft zu', 'Trifft nicht zu']);
  for (const question of questions) {
    assert.equal(question.options?.length, 2);
    assert.ok((question.correctIndex ?? -1) >= 0);
  }
  assert.deepEqual(validateCreation(config, questions), []);
  assert.ok(validateCreation(config, questions.map(question => ({ ...question, options: ['a', 'b', 'c', 'd'] }))).includes('wizardErrMc'));
});

test('cloze question contains a gap and a source-grounded solution', () => {
  const [question] = buildCreation(configWith(['cloze']), passages, 'Unklar');
  assert.match(question.prompt, /______/);
  assert.ok(question.answer.includes('—'));
});

test('description can be used to infer formats automatically', () => {
  assert.deepEqual(inferFormats('Erstelle ein Multiple-Choice-Quiz mit Wahr/Falsch'), ['multiple-choice', 'true-false']);
  assert.deepEqual(inferFormats('Vergleiche und analysiere', 'hard'), ['compare', 'analyze']);
  assert.deepEqual(inferFormats('', 'easy'), ['open', 'multiple-choice']);
  assert.ok(defaultBlocks(configWith([], { autoFormat: true, goal: 'Lückentext' })).length > 0);
});

test('objectives are derived from the selected material', () => {
  const objectives = suggestObjectives(passages, 'de', 3);
  assert.equal(objectives.length, 3);
  assert.ok(objectives.every(objective => objective.length > 8));
  assert.ok(suggestObjectives(passages, 'ar', 2).every(objective => /[\u0600-\u06ff]/.test(objective)));
});

test('blocks and questions can be reordered without mutating the input', () => {
  const blocks = [newBlock('open', 1), newBlock('explain', 2), newBlock('compare', 3)];
  const moved = reorderBlocks(blocks, blocks[2].id, -1);
  assert.equal(moved[1].id, blocks[2].id);
  assert.equal(blocks[1].id, moved[2].id);
  const questions = buildCreation(configWith(['open', 'explain']), passages, 'Unklar');
  const reordered = reorderQuestions(questions, questions[1].id, -1);
  assert.equal(reordered[0].id, questions[1].id);
  assert.equal(questions[0].id, reordered[1].id);
});

test('validation reports all missing creation requirements and passes for a complete setup', () => {
  const empty = validateCreation(defaultConfig('de'), []);
  for (const key of ['wizardErrTitle', 'wizardErrSubject', 'wizardErrTopic', 'wizardErrObjectives', 'wizardErrBlocks', 'wizardErrQuestions']) {
    assert.ok(empty.includes(key), key);
  }
  const config = configWith(['open']);
  const questions = buildCreation(config, passages, 'Unklar');
  assert.deepEqual(validateCreation(config, questions), []);
  const broken = questions.map((question, index) => index === 0 ? { ...question, points: 0, answer: '' } : question);
  const errors = validateCreation(config, broken);
  assert.ok(errors.includes('wizardErrPoints'));
  assert.ok(errors.includes('wizardErrAnswers'));
});

test('validation rejects malformed multiple-choice options', () => {
  const config = configWith(['multiple-choice']);
  const questions = buildCreation(config, passages, 'Unklar');
  const broken = questions.map(question => ({ ...question, options: ['a', 'b'], correctIndex: 9 }));
  assert.ok(validateCreation(config, broken).includes('wizardErrMc'));
});

test('grading uses the marked choice and keeps local grading for open tasks', () => {
  const [choice] = buildCreation(configWith(['multiple-choice']), passages, 'Unklar');
  const correct = choice.options![choice.correctIndex!];
  const wrong = choice.options!.find(option => option !== correct)!;
  assert.equal(gradeCreationQuestion(choice, correct).points, choice.points);
  assert.equal(gradeCreationQuestion(choice, wrong).points, 0);
  const [open] = buildCreation(configWith(['explain']), passages, 'Unklar');
  assert.ok(gradeCreationQuestion(open, open.answer, open.points).points > 0);
  assert.equal(gradeCreationQuestion(open, '', open.points).points, 0);
});

test('creation metadata survives a save and reload round trip', () => {
  const config = configWith(['open', 'multiple-choice'], { scaffolding: true, partialPoints: false });
  const questions = buildCreation(config, passages, 'Unklar');
  const exam = {
    id: 'e1', title: config.title, subject: config.subject, created: new Date().toISOString(),
    mode: 'classwork', questions, duration: 45, meta: metaFromConfig(config)
  };
  const restored = configFromExam(exam, 'de');
  assert.deepEqual(restored.blocks, config.blocks);
  assert.deepEqual(restored.objectives, config.objectives);
  assert.equal(restored.scaffolding, true);
  assert.equal(restored.partialPoints, false);
  assert.equal(restored.title, config.title);
});

test('topic-only mode can turn pasted text into source passages', () => {
  const created = passagesFromText('Die Fotosynthese ist ein biologischer Prozess. Pflanzen erzeugen dabei Traubenzucker aus Licht, Wasser und Kohlenstoffdioxid.', 'Eigener Text', 'Biologie');
  assert.ok(created.length >= 1);
  assert.equal(created[0].name, 'Eigener Text');
  assert.ok(created[0].topic.length > 0);
});
