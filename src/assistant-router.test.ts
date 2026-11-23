import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSISTANT_INTENTS, classifyIntent, intentLabel, routeAssistant, type AssistantRouterLabels } from './assistant-router.ts';
import type { SourcePassage } from './core.ts';

const labels: AssistantRouterLabels = {
  noDocs: 'Lade zuerst Unterrichtsmaterial hoch.',
  noMatch: 'Dazu steht nichts in deinen Materialien.',
  answerPrefix: 'Aus deinen Materialien:',
  sourcePrefix: 'Quelle:',
  suggestedPrefix: 'Erkläre mir',
  modeConversation: 'Normales Gespräch',
  modeGeneral: 'Allgemeinwissen',
  modeMaterial: 'Materialfrage',
  modeExam: 'Klassenarbeit',
  modePractice: 'Übungsaufgaben',
  modeCorrection: 'Korrektur',
  chatHello: 'Hallo! Wie kann ich dir heute helfen?',
  chatMorning: 'Guten Morgen! Wie kann ich dir heute helfen?',
  chatHowAreYou: 'Danke, gut! Was möchtest du heute machen?',
  chatThanks: 'Gern geschehen! Was möchtest du als Nächstes tun?',
  chatBye: 'Auf Wiedersehen! Bis zum nächsten Mal.',
  chatWho: 'Ich bin ExamVision AI, dein lokaler Lernassistent.',
  chatHelp: 'Ja, gerne! Ich kann dich beim Lernen und bei deinen Materialien unterstützen.',
  chatCapabilities: 'Ich kann dir beim Lernen helfen, Aufgaben erstellen, Unterrichtsinhalte erklären und vieles mehr.',
  generalPrefix: 'Allgemeinwissen:',
  generalFallback: 'Dazu habe ich offline keine gespeicherte Antwort. Ich kann dir bei Materialfragen helfen oder eine allgemeine Frage anders formulieren.',
  guideMaterial: 'Ich antworte aus deinen Unterlagen.',
  guideExam: 'Für eine Klassenarbeit nutze ich ausschließlich deine Materialien.',
  guidePractice: 'Für Übungsaufgaben nutze ich ausschließlich deine Materialien.',
  guideCorrection: 'Für die Korrektur nutze ich ausschließlich deine Materialien.'
};

const passages: SourcePassage[] = [
  { text: 'Alpha radiation is stopped by a sheet of paper. Strahlungsarten werden im Unterricht behandelt.', name: 'physik.pdf', topic: 'strahlungsarten' },
  { text: 'Gamma radiation penetrates thick lead only partly.', name: 'physik.pdf', topic: 'gamma' }
];

const cases: Array<{ message: string; intent: string }> = [
  { message: 'Hallo', intent: 'conversation' },
  { message: 'Hallo!', intent: 'conversation' },
  { message: 'Guten Morgen', intent: 'conversation' },
  { message: 'Danke', intent: 'conversation' },
  { message: 'Auf Wiedersehen', intent: 'conversation' },
  { message: 'Wer bist du?', intent: 'conversation' },
  { message: 'Was kannst du?', intent: 'conversation' },
  { message: 'Was kannst du alles?', intent: 'conversation' },
  { message: 'Wie geht es dir?', intent: 'conversation' },
  { message: 'Kannst du mir helfen?', intent: 'conversation' },
  { message: 'Was ist die Hauptstadt von Frankreich?', intent: 'generalKnowledge' },
  { message: 'Wie viele Minuten hat eine Stunde?', intent: 'generalKnowledge' },
  { message: 'Was ist die Lichtgeschwindigkeit?', intent: 'generalKnowledge' },
  { message: 'Wie viele Farben hat der Regenbogen?', intent: 'generalKnowledge' },
  { message: 'Erkläre mir ein Thema aus meinen Materialien.', intent: 'materialQuestion' },
  { message: 'Erkläre mir die Strahlungsarten.', intent: 'materialQuestion' },
  { message: 'Was steht in meinen Unterlagen?', intent: 'materialQuestion' },
  { message: 'Erstelle eine Klassenarbeit aus meinen Materialien.', intent: 'examCreation' },
  { message: 'Erstelle eine Prüfung zu den Unterlagen.', intent: 'examCreation' },
  { message: 'Erstelle eine Aufgabe zu einem Thema, das nicht in meinen Materialien vorkommt.', intent: 'practiceTasks' },
  { message: 'Generiere Übungsaufgaben aus meinen Materialien.', intent: 'practiceTasks' },
  { message: 'Korrigiere meine Antwort anhand der Materialien.', intent: 'correction' },
  { message: 'Bewerte meine Lösung aus den Unterlagen.', intent: 'correction' }
];

test('classifies at least 20 different messages into all six modes', () => {
  assert.ok(cases.length >= 20);
  assert.deepEqual([...new Set(cases.map(item => item.intent))].sort(), [...ASSISTANT_INTENTS].sort());
  for (const item of cases) {
    assert.equal(classifyIntent(item.message), item.intent, `unexpected intent for "${item.message}"`);
  }
});

test('normal conversation never applies the material restriction', () => {
  for (const item of cases.filter(c => c.intent === 'conversation')) {
    const result = routeAssistant(item.message, [], labels);
    assert.equal(result.intent, 'conversation');
    assert.ok(result.answer.length > 0);
    assert.doesNotMatch(result.answer, /nicht in deinen Materialien/);
    assert.deepEqual(result.sources, []);
  }
});

test('the exact examples get the expected friendly answers', () => {
  assert.equal(routeAssistant('Hallo', [], labels).answer, 'Hallo! Wie kann ich dir heute helfen?');
  assert.equal(routeAssistant('Wie geht es dir?', [], labels).answer, 'Danke, gut! Was möchtest du heute machen?');
  assert.equal(routeAssistant('Was kannst du?', [], labels).answer, 'Ich kann dir beim Lernen helfen, Aufgaben erstellen, Unterrichtsinhalte erklären und vieles mehr.');
  assert.match(routeAssistant('Guten Morgen', [], labels).answer, /Guten Morgen/);
  assert.match(routeAssistant('Danke', [], labels).answer, /Gern geschehen/);
  assert.match(routeAssistant('Wer bist du?', [], labels).answer, /ExamVision AI/);
});

test('general knowledge questions are answered without material binding', () => {
  const capital = routeAssistant('Was ist die Hauptstadt von Frankreich?', [], labels);
  assert.equal(capital.intent, 'generalKnowledge');
  assert.match(capital.answer, /Paris/);
  assert.doesNotMatch(capital.answer, /nicht in deinen Materialien/);
  const unknown = routeAssistant('Wie hoch ist der Mount Everest?', [], labels);
  assert.equal(unknown.intent, 'generalKnowledge');
  assert.doesNotMatch(unknown.answer, /nicht in deinen Materialien/);
  assert.match(unknown.answer, /offline/);
});

test('material questions stay strictly grounded and name sources', () => {
  const result = routeAssistant('Erkläre mir die Strahlungsarten.', passages, labels);
  assert.equal(result.intent, 'materialQuestion');
  assert.match(result.answer, /Alpha radiation/);
  assert.deepEqual(result.sources, ['physik.pdf']);
  const missing = routeAssistant('Erkläre mir die Quantenphysik.', passages, labels);
  assert.equal(missing.intent, 'materialQuestion');
  assert.match(missing.answer, /Dazu steht nichts in deinen Materialien/);
});

test('exam, practice and correction requests stay strictly grounded', () => {
  for (const message of [
    'Erstelle eine Klassenarbeit aus meinen Materialien.',
    'Erstelle eine Aufgabe zu einem Thema, das nicht in meinen Materialien vorkommt.',
    'Korrigiere meine Antwort anhand der Materialien.'
  ]) {
    const result = routeAssistant(message, passages, labels);
    assert.ok(['examCreation', 'practiceTasks', 'correction'].includes(result.intent));
    assert.match(result.answer, /Aus deinen Materialien:|Dazu steht nichts in deinen Materialien/);
  }
});

test('missing documents are reported honestly for grounded modes', () => {
  const result = routeAssistant('Erstelle eine Klassenarbeit aus meinen Materialien.', [], labels);
  assert.equal(result.intent, 'examCreation');
  assert.match(result.answer, /Lade zuerst Unterrichtsmaterial hoch/);
});

test('intent labels are available for the chat chips', () => {
  for (const intent of ASSISTANT_INTENTS) {
    assert.ok(intentLabel(intent, labels).length > 0);
  }
});
