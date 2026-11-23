import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScaffoldingPlan, buildUnitPlan, reorderUnitLessons, type FlowLabels } from './to-teach-flows.ts';
import { buildArtifactPdfBlocks } from './pdf-documents.ts';
import type { Artifact } from './types.ts';

const labels: FlowLabels = {
  unitLesson: 'Stunde',
  scaffoldPhase1: 'Einstieg',
  scaffoldPhase2: 'Gemeinsames Modellieren',
  scaffoldPhase3: 'Gelenktes Üben',
  scaffoldPhase4: 'Selbstständige Anwendung',
  strongSupport: 'Starke Unterstützung',
  sharedSupport: 'Gemeinsame Unterstützung',
  guidedSupport: 'Wenige Hinweise',
  independentSupport: 'Selbstständig'
};

const passages = [
  { text: 'Die Fotosynthese wandelt Lichtenergie in chemische Energie um. Chlorophyll absorbiert Licht.', name: 'bio.pdf', topic: 'Fotosynthese' },
  { text: 'Glukose und Sauerstoff entstehen aus Wasser und Kohlenstoffdioxid.', name: 'bio.pdf', topic: 'Fotosynthese' },
  { text: 'Ohne Licht steht die Energieversorgung der Pflanze still.', name: 'licht.pdf', topic: 'Licht' }
];

test('buildUnitPlan creates editable, source-grounded lessons', () => {
  const plan = buildUnitPlan({ subject: 'Biologie', topic: 'Fotosynthese', language: 'de', minutes: 90, lessonCount: 3, passages, labels });
  assert.equal(plan.lessons.length, 3);
  assert.ok(plan.lessons.every(lesson => lesson.title && lesson.description && lesson.minutes > 0));
  assert.deepEqual(plan.sources, ['bio.pdf', 'licht.pdf']);
  assert.ok(plan.objectives.length > 0);
  assert.ok(plan.lessons.some(lesson => lesson.source.includes('bio.pdf')));
});

test('reorderUnitLessons keeps all lessons and changes order', () => {
  const plan = buildUnitPlan({ subject: 'Biologie', topic: 'Fotosynthese', language: 'de', minutes: 90, lessonCount: 3, passages, labels });
  const before = plan.lessons.map(lesson => lesson.id);
  const moved = reorderUnitLessons(plan, before[1], -1);
  assert.deepEqual(moved.lessons.map(lesson => lesson.id), [before[1], before[0], before[2]]);
  assert.equal(moved.lessons.length, before.length);
  assert.equal(reorderUnitLessons(plan, before[0], -1), plan);
});

test('buildScaffoldingPlan creates four phases with decreasing support labels', () => {
  const plan = buildScaffoldingPlan({ subject: 'Biologie', topic: 'Fotosynthese', language: 'de', objectives: 'Fachbegriffe erklären, Ablauf beschreiben', passages, labels });
  assert.deepEqual(plan.phases.map(phase => phase.name), [labels.scaffoldPhase1, labels.scaffoldPhase2, labels.scaffoldPhase3, labels.scaffoldPhase4]);
  assert.deepEqual(plan.phases.map(phase => phase.support), [labels.strongSupport, labels.sharedSupport, labels.guidedSupport, labels.independentSupport]);
  assert.ok(plan.phases.every(phase => phase.task && phase.subjectObjective && phase.languageObjective));
  assert.ok(plan.objectives.includes('Fachbegriffe erklären'));
});

test('unit and scaffolding artifacts produce real PDF blocks', () => {
  const unit = buildUnitPlan({ subject: 'Biologie', topic: 'Fotosynthese', language: 'de', minutes: 90, lessonCount: 2, passages, labels });
  const scaffold = buildScaffoldingPlan({ subject: 'Biologie', topic: 'Fotosynthese', language: 'de', passages, labels });
  const toArtifact = (kind: 'unit' | 'scaffolding', data: unknown): Artifact => ({
    id: kind, kind, title: kind, subject: 'Biologie', topic: 'Fotosynthese', created: new Date(0).toISOString(), lang: 'de', data
  });
  const unitBlocks = buildArtifactPdfBlocks(toArtifact('unit', unit), {});
  const scaffoldBlocks = buildArtifactPdfBlocks(toArtifact('scaffolding', scaffold), {});
  const allText = (blocks: typeof unitBlocks) => blocks.flatMap(block => block.lines.flatMap(line => [line.text, ...(line.cells || []).flatMap(cell => cell.lines)])).join('\n');
  assert.match(allText(unitBlocks), /Stunde 1/);
  assert.match(allText(scaffoldBlocks), /Einstieg/);
});
