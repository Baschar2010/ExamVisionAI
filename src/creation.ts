import { evaluateAnswer, terms, topicOf, textParts, type SourcePassage } from './core.ts';
import type {
  CreationBlock, CreationConfig, CreationLanguage, Exam, ExamMeta, Q
} from './types.ts';

export type FormatFamily = 'recall' | 'explain' | 'describe' | 'compare' | 'evaluate' | 'calculate' | 'select' | 'classify' | 'create' | 'transfer';

export type TaskFormat = {
  id: string;
  labelKey: string;
  defaultLabel: string;
  family: FormatFamily;
  kind: 'open' | 'choice' | 'assign';
  operator: string;
  requirementLevel: 'I' | 'II' | 'III';
};

/** Own catalogue of task formats, derived from publicly documented classroom task types. */
export const TASK_FORMATS: TaskFormat[] = [
  { id: 'open', labelKey: 'fmt_open', defaultLabel: 'Offene Frage', family: 'recall', kind: 'open', operator: 'name', requirementLevel: 'I' },
  { id: 'explain', labelKey: 'fmt_explain', defaultLabel: 'Erklärung', family: 'explain', kind: 'open', operator: 'explain', requirementLevel: 'II' },
  { id: 'describe', labelKey: 'fmt_describe', defaultLabel: 'Beschreibung', family: 'describe', kind: 'open', operator: 'describe', requirementLevel: 'I' },
  { id: 'compare', labelKey: 'fmt_compare', defaultLabel: 'Vergleich', family: 'compare', kind: 'open', operator: 'compare', requirementLevel: 'III' },
  { id: 'justify', labelKey: 'fmt_justify', defaultLabel: 'Begründung', family: 'evaluate', kind: 'open', operator: 'justify', requirementLevel: 'III' },
  { id: 'analyze', labelKey: 'fmt_analyze', defaultLabel: 'Analyse', family: 'evaluate', kind: 'open', operator: 'analyze', requirementLevel: 'III' },
  { id: 'evaluate', labelKey: 'fmt_evaluate', defaultLabel: 'Bewertung', family: 'evaluate', kind: 'open', operator: 'evaluate', requirementLevel: 'III' },
  { id: 'transfer', labelKey: 'fmt_transfer', defaultLabel: 'Transfer', family: 'transfer', kind: 'open', operator: 'transfer', requirementLevel: 'III' },
  { id: 'cloze', labelKey: 'fmt_cloze', defaultLabel: 'Lückentext', family: 'recall', kind: 'assign', operator: 'complete', requirementLevel: 'I' },
  { id: 'multiple-choice', labelKey: 'fmt_multipleChoice', defaultLabel: 'Multiple Choice', family: 'select', kind: 'choice', operator: 'choose', requirementLevel: 'I' },
  { id: 'true-false', labelKey: 'fmt_trueFalse', defaultLabel: 'Wahr/Falsch', family: 'select', kind: 'choice', operator: 'decide', requirementLevel: 'I' },
  { id: 'matching', labelKey: 'fmt_matching', defaultLabel: 'Zuordnung', family: 'classify', kind: 'assign', operator: 'assign', requirementLevel: 'II' },
  { id: 'flashcard', labelKey: 'fmt_flashcard', defaultLabel: 'Karteikarte', family: 'recall', kind: 'open', operator: 'answer', requirementLevel: 'I' },
  { id: 'step-by-step', labelKey: 'fmt_stepByStep', defaultLabel: 'Schritt für Schritt', family: 'describe', kind: 'open', operator: 'describe', requirementLevel: 'II' },
  { id: 'term-definition', labelKey: 'fmt_termDefinition', defaultLabel: 'Begriffserklärung', family: 'recall', kind: 'open', operator: 'explain', requirementLevel: 'I' },
  { id: 'source-text', labelKey: 'fmt_sourceText', defaultLabel: 'Sachtext', family: 'describe', kind: 'open', operator: 'describe', requirementLevel: 'II' },
  { id: 'summary', labelKey: 'fmt_summary', defaultLabel: 'Zusammenfassung', family: 'create', kind: 'open', operator: 'summarize', requirementLevel: 'II' },
  { id: 'operator', labelKey: 'fmt_operator', defaultLabel: 'Operatoren-Aufgabe', family: 'explain', kind: 'open', operator: 'workOn', requirementLevel: 'II' },
  { id: 'requirement-1', labelKey: 'fmt_requirement1', defaultLabel: 'Anforderungsbereich I', family: 'recall', kind: 'open', operator: 'name', requirementLevel: 'I' },
  { id: 'requirement-2', labelKey: 'fmt_requirement2', defaultLabel: 'Anforderungsbereich II', family: 'explain', kind: 'open', operator: 'explain', requirementLevel: 'II' },
  { id: 'requirement-3', labelKey: 'fmt_requirement3', defaultLabel: 'Anforderungsbereich III', family: 'evaluate', kind: 'open', operator: 'evaluate', requirementLevel: 'III' },
  { id: 'text-analysis', labelKey: 'fmt_textAnalysis', defaultLabel: 'Textanalyse', family: 'evaluate', kind: 'open', operator: 'analyze', requirementLevel: 'III' },
  { id: 'source-work', labelKey: 'fmt_sourceWork', defaultLabel: 'Quellenarbeit', family: 'evaluate', kind: 'open', operator: 'investigate', requirementLevel: 'III' },
  { id: 'calculation', labelKey: 'fmt_calculation', defaultLabel: 'Rechenaufgabe', family: 'calculate', kind: 'open', operator: 'calculate', requirementLevel: 'II' },
  { id: 'graph', labelKey: 'fmt_graph', defaultLabel: 'Grafikinterpretation', family: 'describe', kind: 'open', operator: 'interpret', requirementLevel: 'II' },
  { id: 'table', labelKey: 'fmt_table', defaultLabel: 'Tabellenaufgabe', family: 'describe', kind: 'open', operator: 'read', requirementLevel: 'II' },
  { id: 'case', labelKey: 'fmt_case', defaultLabel: 'Fallbeispiel', family: 'transfer', kind: 'open', operator: 'judge', requirementLevel: 'III' },
  { id: 'dilemma', labelKey: 'fmt_dilemma', defaultLabel: 'Dilemma-Diskussion', family: 'evaluate', kind: 'open', operator: 'discuss', requirementLevel: 'III' },
  { id: 'essay', labelKey: 'fmt_essay', defaultLabel: 'Essay', family: 'create', kind: 'open', operator: 'write', requirementLevel: 'III' },
  { id: 'dictation', labelKey: 'fmt_dictation', defaultLabel: 'Diktat', family: 'recall', kind: 'open', operator: 'write', requirementLevel: 'I' },
  { id: 'vocabulary', labelKey: 'fmt_vocabulary', defaultLabel: 'Vokabeln', family: 'recall', kind: 'open', operator: 'translate', requirementLevel: 'I' },
  { id: 'statements', labelKey: 'fmt_statements', defaultLabel: 'Aussagen', family: 'select', kind: 'choice', operator: 'decide', requirementLevel: 'I' },
  { id: 'word-search', labelKey: 'fmt_wordSearch', defaultLabel: 'Wortsuchrätsel', family: 'recall', kind: 'open', operator: 'find', requirementLevel: 'I' },
  { id: 'crossword', labelKey: 'fmt_crossword', defaultLabel: 'Kreuzworträtsel', family: 'recall', kind: 'open', operator: 'complete', requirementLevel: 'I' },
  { id: 'mindmap', labelKey: 'fmt_mindmap', defaultLabel: 'Mindmap', family: 'create', kind: 'open', operator: 'create', requirementLevel: 'II' },
  { id: 'infographic', labelKey: 'fmt_infographic', defaultLabel: 'Infografik', family: 'create', kind: 'open', operator: 'design', requirementLevel: 'II' },
  { id: 'bingo', labelKey: 'fmt_bingo', defaultLabel: 'Bingo', family: 'recall', kind: 'open', operator: 'mark', requirementLevel: 'I' },
  { id: 'discussion', labelKey: 'fmt_discussion', defaultLabel: 'Diskussion', family: 'evaluate', kind: 'open', operator: 'discuss', requirementLevel: 'III' },
  { id: 'observation', labelKey: 'fmt_observation', defaultLabel: 'Beobachtung', family: 'describe', kind: 'open', operator: 'observe', requirementLevel: 'II' },
  { id: 'experiment', labelKey: 'fmt_experiment', defaultLabel: 'Experiment', family: 'calculate', kind: 'open', operator: 'describe', requirementLevel: 'III' },
  { id: 'roleplay', labelKey: 'fmt_roleplay', defaultLabel: 'Rollenspiel', family: 'transfer', kind: 'open', operator: 'act', requirementLevel: 'III' },
  { id: 'chat', labelKey: 'fmt_chat', defaultLabel: 'Chat', family: 'create', kind: 'open', operator: 'write', requirementLevel: 'II' },
  { id: 'timeline', labelKey: 'fmt_timeline', defaultLabel: 'Zeitstrahl', family: 'describe', kind: 'open', operator: 'chronology', requirementLevel: 'II' }
];

export const FORMAT_BY_ID = new Map(TASK_FORMATS.map(format => [format.id, format]));

export const OPERATORS: Array<{ id: string; labelKey: string; defaultLabel: string }> = [
  { id: 'name', labelKey: 'op_name', defaultLabel: 'Nenne' },
  { id: 'explain', labelKey: 'op_explain', defaultLabel: 'Erkläre' },
  { id: 'describe', labelKey: 'op_describe', defaultLabel: 'Beschreibe' },
  { id: 'compare', labelKey: 'op_compare', defaultLabel: 'Vergleiche' },
  { id: 'justify', labelKey: 'op_justify', defaultLabel: 'Begründe' },
  { id: 'analyze', labelKey: 'op_analyze', defaultLabel: 'Analysiere' },
  { id: 'evaluate', labelKey: 'op_evaluate', defaultLabel: 'Bewerte' },
  { id: 'transfer', labelKey: 'op_transfer', defaultLabel: 'Übertrage' },
  { id: 'complete', labelKey: 'op_complete', defaultLabel: 'Ergänze' },
  { id: 'choose', labelKey: 'op_choose', defaultLabel: 'Wähle' },
  { id: 'decide', labelKey: 'op_decide', defaultLabel: 'Entscheide' },
  { id: 'assign', labelKey: 'op_assign', defaultLabel: 'Ordne zu' },
  { id: 'answer', labelKey: 'op_answer', defaultLabel: 'Beantworte' },
  { id: 'summarize', labelKey: 'op_summarize', defaultLabel: 'Fasse zusammen' },
  { id: 'workOn', labelKey: 'op_workOn', defaultLabel: 'Bearbeite' },
  { id: 'calculate', labelKey: 'op_calculate', defaultLabel: 'Berechne' },
  { id: 'interpret', labelKey: 'op_interpret', defaultLabel: 'Interpretiere' },
  { id: 'read', labelKey: 'op_read', defaultLabel: 'Lies ab' },
  { id: 'judge', labelKey: 'op_judge', defaultLabel: 'Beurteile' },
  { id: 'discuss', labelKey: 'op_discuss', defaultLabel: 'Diskutiere' },
  { id: 'write', labelKey: 'op_write', defaultLabel: 'Verfasse' },
  { id: 'translate', labelKey: 'op_translate', defaultLabel: 'Übersetze' },
  { id: 'find', labelKey: 'op_find', defaultLabel: 'Finde' },
  { id: 'create', labelKey: 'op_create', defaultLabel: 'Erstelle' },
  { id: 'design', labelKey: 'op_design', defaultLabel: 'Gestalte' },
  { id: 'mark', labelKey: 'op_mark', defaultLabel: 'Markiere' },
  { id: 'observe', labelKey: 'op_observe', defaultLabel: 'Beobachte' },
  { id: 'act', labelKey: 'op_act', defaultLabel: 'Spiele' },
  { id: 'chronology', labelKey: 'op_chronology', defaultLabel: 'Ordne zeitlich' },
  { id: 'investigate', labelKey: 'op_investigate', defaultLabel: 'Untersuche' }
];

export const REQUIREMENT_LEVELS: Array<{ id: 'I' | 'II' | 'III'; labelKey: string; defaultLabel: string }> = [
  { id: 'I', labelKey: 'req1', defaultLabel: 'Anforderungsbereich I' },
  { id: 'II', labelKey: 'req2', defaultLabel: 'Anforderungsbereich II' },
  { id: 'III', labelKey: 'req3', defaultLabel: 'Anforderungsbereich III' }
];

/** Own, filterable didactic templates — structure only, never copied content. */
export const DIDACTIC_TEMPLATES = [
  { id: 'classic', subject: 'all', level: 'all', kind: 'exam', labelKey: 'tplClassic', defaultLabel: 'Klassische Klassenarbeit', formats: ['open', 'explain', 'compare'] },
  { id: 'quiz', subject: 'all', level: 'all', kind: 'practice', labelKey: 'tplQuiz', defaultLabel: 'Quiz mit Auswahlantworten', formats: ['multiple-choice', 'true-false', 'statements'] },
  { id: 'skills', subject: 'all', level: 'middle', kind: 'exam', labelKey: 'tplSkills', defaultLabel: 'Kompetenzorientierte Arbeit', formats: ['source-work', 'analyze', 'transfer'] },
  { id: 'language', subject: 'Deutsch', level: 'all', kind: 'exam', labelKey: 'tplLanguage', defaultLabel: 'Sprach- und Textarbeit', formats: ['source-text', 'text-analysis', 'essay'] },
  { id: 'science', subject: 'Biologie', level: 'middle', kind: 'exam', labelKey: 'tplScience', defaultLabel: 'Naturwissenschaftlicher Test', formats: ['term-definition', 'experiment', 'graph'] },
  { id: 'languages', subject: 'Englisch', level: 'all', kind: 'practice', labelKey: 'tplLanguages', defaultLabel: 'Vokabel- und Sprechübung', formats: ['vocabulary', 'cloze', 'roleplay'] },
  { id: 'math', subject: 'Mathematik', level: 'all', kind: 'exam', labelKey: 'tplMath', defaultLabel: 'Rechen- und Transferaufgaben', formats: ['calculation', 'step-by-step', 'transfer'] },
  { id: 'scaffold', subject: 'all', level: 'lower', kind: 'worksheet', labelKey: 'tplScaffold', defaultLabel: 'Scaffolding-Arbeitsblatt', formats: ['term-definition', 'cloze', 'describe'] }
] as const;

export function defaultConfig(profileLang = 'de', subject = ''): CreationConfig {
  return {
    lang: (['de', 'en', 'ar', 'fr', 'es'].includes(profileLang) ? profileLang : 'de') as CreationLanguage,
    gradeLevel: '8',
    subject,
    topic: '',
    title: '',
    goal: '',
    sourceMode: 'materials',
    selectedDocIds: [],
    templateDocId: '',
    templateId: 'classic',
    sourceText: '',
    autoFormat: true,
    preferredFormats: [],
    difficulty: 'medium',
    objectives: [],
    blocks: [],
    examKind: 'classwork',
    duration: 45,
    differentiation: 'regular',
    scaffolding: false,
    partialPoints: true,
    showSolutions: true,
    headerName: 'Name',
    headerClass: 'Klasse',
    headerDate: 'Datum'
  };
}

export function newBlock(formatId = 'open', index = 0): CreationBlock {
  const format = FORMAT_BY_ID.get(formatId) || TASK_FORMATS[0];
  return {
    id: `block-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    formatId: format.id,
    count: 2,
    points: format.requirementLevel === 'III' ? 6 : format.requirementLevel === 'II' ? 4 : 3,
    instruction: '',
    operator: format.operator,
    requirementLevel: format.requirementLevel
  };
}

const formatHints: Array<[RegExp, string]> = [
  [/(multiple[\s-]?choice|auswahl|quiz|mc\b)/i, 'multiple-choice'],
  [/(wahr|falsch|true|false|ja\s*\/\s*nein)/i, 'true-false'],
  [/(lücke|cloze|ergänz)/i, 'cloze'],
  [/(zuordn|match|ordne)/i, 'matching'],
  [/(vergleich|compare|unterschied)/i, 'compare'],
  [/(erklär|explain|begründ)/i, 'explain'],
  [/(analys|analyse)/i, 'analyze'],
  [/(bewert|evaluat)/i, 'evaluate'],
  [/(transfer|übertrag)/i, 'transfer'],
  [/(berechn|rechn|calculate|formel)/i, 'calculation'],
  [/(zusammenfass|summary)/i, 'summary'],
  [/(essay|aufsatz|erörter)/i, 'essay'],
  [/(vokabel|vocabular|wortschatz)/i, 'vocabulary'],
  [/(mindmap|konzept)/i, 'mindmap'],
  [/(zeitstrahl|chronolog|timeline)/i, 'timeline'],
  [/(skizz|grafik|diagramm|chart)/i, 'graph'],
  [/(quelle|quellenarbeit|source)/i, 'source-work'],
  [/(fallbeispiel|case)/i, 'case'],
  [/(dilemma)/i, 'dilemma'],
  [/(experiment|versuch)/i, 'experiment'],
  [/(beschreib|describe)/i, 'describe']
];

/** Detect formats from the teacher's one-sentence description (the "AI picks the format" path). */
export function inferFormats(description: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): string[] {
  const text = String(description || '');
  const found: string[] = [];
  for (const [pattern, id] of formatHints) {
    if (pattern.test(text) && !found.includes(id)) found.push(id);
    if (found.length >= 4) break;
  }
  if (found.length) return found;
  return difficulty === 'easy' ? ['open', 'multiple-choice'] : difficulty === 'hard' ? ['analyze', 'compare', 'evaluate'] : ['explain', 'describe'];
}

const objectiveVerbs: Record<CreationLanguage, string[]> = {
  de: ['benennen', 'erklären', 'vergleichen', 'anwenden', 'beurteilen'],
  en: ['identify', 'explain', 'compare', 'apply', 'evaluate'],
  ar: ['تحديد', 'شرح', 'مقارنة', 'تطبيق', 'تقييم'],
  fr: ['identifier', 'expliquer', 'comparer', 'appliquer', 'évaluer'],
  es: ['identificar', 'explicar', 'comparar', 'aplicar', 'evaluar']
};

/** Locally derive candidate learning objectives from the selected passages. */
export function suggestObjectives(passages: SourcePassage[], lang: CreationLanguage, max = 4): string[] {
  const counts = new Map<string, number>();
  for (const passage of passages) {
    for (const token of terms(passage.text).slice(0, 30)) counts.set(token, (counts.get(token) || 0) + 1);
  }
  const ranked = [...counts].filter(([term]) => term.length >= 4).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, max);
  const verbs = objectiveVerbs[lang] || objectiveVerbs.de;
  return ranked.map(([term], index) => `${verbs[index % verbs.length]} „${term}“`);
}

const familyPrompts: Record<CreationLanguage, Record<FormatFamily, (topic: string) => string>> = {
  de: {
    recall: topic => `Nenne die wichtigsten Angaben zu „${topic}“, die in den Unterlagen stehen.`,
    explain: topic => `Erkläre die Kernaussage zu „${topic}“ mit eigenen Worten ausschließlich anhand der Unterlagen.`,
    describe: topic => `Beschreibe den Sachverhalt zu „${topic}“ auf Grundlage der Unterlagen.`,
    compare: topic => `Vergleiche die in den Unterlagen genannten Aspekte zu „${topic}“.`,
    evaluate: topic => `Bewerte die Aussagen der Unterlagen zu „${topic}“ und begründe deine Einschätzung.`,
    calculate: topic => `Ermittle die zu „${topic}“ genannten Größen und Zusammenhänge aus den Unterlagen und erläutere sie.`,
    select: topic => `Wähle die Antwort zu „${topic}“, die durch die Unterlagen belegt ist.`,
    classify: topic => `Ordne die passende Aussage zu „${topic}“ dem richtigen Begriff zu.`,
    create: topic => `Erstelle eine strukturierte Darstellung zu „${topic}“, die nur auf den Unterlagen beruht.`,
    transfer: topic => `Übertrage die Aussagen der Unterlagen zu „${topic}“ auf ein neues Beispiel.`
  },
  en: {
    recall: topic => `State the key facts about “${topic}” that appear in the materials.`,
    explain: topic => `Explain the key point about “${topic}” in your own words, using only the materials.`,
    describe: topic => `Describe the situation concerning “${topic}” as presented in the materials.`,
    compare: topic => `Compare the aspects of “${topic}” named in the materials.`,
    evaluate: topic => `Evaluate the statements about “${topic}” in the materials and justify your judgement.`,
    calculate: topic => `Determine the quantities and relationships about “${topic}” named in the materials and explain them.`,
    select: topic => `Choose the answer about “${topic}” that is supported by the materials.`,
    classify: topic => `Match the correct statement about “${topic}” to its term.`,
    create: topic => `Create a structured representation of “${topic}” based only on the materials.`,
    transfer: topic => `Apply the statements about “${topic}” from the materials to a new example.`
  },
  ar: {
    recall: topic => `اذكر أهم المعلومات حول «${topic}» كما وردت في المواد.`,
    explain: topic => `اشرح الفكرة الرئيسية حول «${topic}» بكلماتك الخاصّة باستخدام المواد فقط.`,
    describe: topic => `صف الحالة الخاصة بـ «${topic}» استناداً إلى المواد.`,
    compare: topic => `قارن بين الجوانب المذكورة في المواد حول «${topic}».`,
    evaluate: topic => `قيّم عبارات المواد حول «${topic}» وبرّر حكمك.`,
    calculate: topic => `حدد الكميات والعلاقات المذكورة حول «${topic}» في المواد واشرحها.`,
    select: topic => `اختر الإجابة حول «${topic}» المدعومة بالمواد.`,
    classify: topic => `طابق العبارة الصحيحة حول «${topic}» بالمصطلح المناسب.`,
    create: topic => `أنشئ تمثيلاً منظّماً حول «${topic}» بالاعتماد على المواد فقط.`,
    transfer: topic => `طبّق ما ورد في المواد حول «${topic}» على مثال جديد.`
  },
  fr: {
    recall: topic => `Énoncez les informations essentielles sur « ${topic} » figurant dans les documents.`,
    explain: topic => `Expliquez avec vos mots le point essentiel sur « ${topic} » en n’utilisant que les documents.`,
    describe: topic => `Décrivez la situation concernant « ${topic} » à partir des documents.`,
    compare: topic => `Comparez les aspects de « ${topic} » mentionnés dans les documents.`,
    evaluate: topic => `Évaluez les affirmations des documents sur « ${topic} » et justifiez votre jugement.`,
    calculate: topic => `Déterminez les grandeurs et relations concernant « ${topic} » citées dans les documents et expliquez-les.`,
    select: topic => `Choisissez la réponse sur « ${topic} » confirmée par les documents.`,
    classify: topic => `Associez l’affirmation correcte sur « ${topic} » au terme qui convient.`,
    create: topic => `Créez une représentation structurée de « ${topic} » fondée uniquement sur les documents.`,
    transfer: topic => `Transférez les affirmations des documents sur « ${topic} » à un nouvel exemple.`
  },
  es: {
    recall: topic => `Indica los datos esenciales sobre «${topic}» que aparecen en los materiales.`,
    explain: topic => `Explica con tus palabras la idea clave sobre «${topic}» usando solo los materiales.`,
    describe: topic => `Describe la situación sobre «${topic}» a partir de los materiales.`,
    compare: topic => `Compara los aspectos sobre «${topic}» mencionados en los materiales.`,
    evaluate: topic => `Evalúa las afirmaciones de los materiales sobre «${topic}» y justifica tu juicio.`,
    calculate: topic => `Determina las magnitudes y relaciones sobre «${topic}» citadas en los materiales y explícalas.`,
    select: topic => `Elige la respuesta sobre «${topic}» respaldada por los materiales.`,
    classify: topic => `Relaciona la afirmación correcta sobre «${topic}» con el término adecuado.`,
    create: topic => `Crea una representación estructurada de «${topic}» basada solo en los materiales.`,
    transfer: topic => `Aplica lo afirmado en los materiales sobre «${topic}» a un nuevo ejemplo.`
  }
};

const trueFalseLabels: Record<CreationLanguage, [string, string]> = {
  de: ['Richtig', 'Falsch'], en: ['True', 'False'], ar: ['صحيح', 'خطأ'],
  fr: ['Vrai', 'Faux'], es: ['Verdadero', 'Falso']
};
const statementLabels: Record<CreationLanguage, [string, string]> = {
  de: ['Trifft zu', 'Trifft nicht zu'], en: ['Correct', 'Incorrect'], ar: ['صحيح', 'غير صحيح'],
  fr: ['Exact', 'Inexact'], es: ['Correcto', 'Incorrecto']
};
const distractorFallback: Record<CreationLanguage, string[]> = {
  de: ['eine andere Bedingung', 'ein anderer Stoff', 'ein anderer Zeitraum', 'eine andere Ursache'],
  en: ['a different condition', 'a different substance', 'a different period', 'a different cause'],
  ar: ['شرط مختلف', 'مادة مختلفة', 'فترة مختلفة', 'سبب مختلف'],
  fr: ['une autre condition', 'une autre substance', 'une autre période', 'une autre cause'],
  es: ['otra condición', 'otra sustancia', 'otro período', 'otra causa']
};

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function answerCandidate(passage: SourcePassage): string {
  const clean = String(passage.text).replace(/\s+/g, ' ').trim();
  const clipped = clean.length > 112 ? clean.slice(0, 112).replace(/\s+\S*$/, '') : clean;
  return clipped.replace(/[.,;:!?]+$/, '').trim();
}

function seededOrder(seed: number, size: number): number[] {
  const order = Array.from({ length: size }, (_, index) => index);
  let state = Math.abs(Math.floor(seed) * 9301 + 49297) || 1;
  for (let i = size - 1; i > 0; i--) {
    state = (state * 9301 + 49297) % 233280;
    const j = state % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function makeMutatedDistractor(correct: string, topics: string[], used: string[], attempt: number, lang: CreationLanguage): string {
  const words = correct.split(/\s+/);
  const replacements = [...topics.filter(Boolean), ...(distractorFallback[lang] || distractorFallback.de)];
  for (let offset = 0; offset < Math.max(1, words.length - 1); offset++) {
    const position = 1 + ((attempt + offset) % Math.max(1, words.length - 1));
    for (let step = 0; step < replacements.length; step++) {
      const candidate = words.slice();
      candidate[position] = replacements[(attempt + step) % replacements.length];
      const result = candidate.join(' ');
      if (result !== correct && !used.includes(result)) return result;
    }
  }
  const fallback = `${replacements[attempt % replacements.length]} — ${correct}`.slice(0, 140);
  return fallback !== correct && !used.includes(fallback) ? fallback : `${attempt + 1}. ${correct}`.slice(0, 140);
}

/** Creates four distinct options with exactly one source-grounded correct answer. */
export function makeChoiceOptions(passages: SourcePassage[], index: number, lang: CreationLanguage): { options: string[]; correctIndex: number } {
  const candidates = uniqueStrings(passages.map(answerCandidate));
  const safeCandidates = candidates.length ? candidates : ['—'];
  const correct = safeCandidates[index % safeCandidates.length];
  const source = passages[index % passages.length];
  const otherPassages = passages.filter((_, position) => position !== index % passages.length);
  const otherTopics = uniqueStrings(otherPassages.map(passage => passage.topic));
  const others = safeCandidates.filter(candidate => candidate !== correct).slice();
  const score = (candidate: string) => {
    const passage = passages.find(item => answerCandidate(item) === candidate);
    const sameTopic = passage && source && passage.topic === source.topic ? 20 : 0;
    return sameTopic - Math.abs(candidate.length - correct.length);
  };
  others.sort((a, b) => score(b) - score(a));
  const distractors = others.slice(0, 3);
  const topics = uniqueStrings([...otherTopics, ...passages.map(passage => passage.topic)]);
  let attempt = 0;
  while (distractors.length < 3 && attempt < 30) {
    const candidate = makeMutatedDistractor(correct, topics, [correct, ...distractors], attempt, lang);
    if (!distractors.includes(candidate)) distractors.push(candidate);
    attempt++;
  }
  const pool = [correct, ...distractors.slice(0, 3)];
  while (pool.length < 4) pool.push(makeMutatedDistractor(correct, topics, pool, pool.length + attempt, lang));
  const order = seededOrder(index + 1, 4);
  return { options: order.map(position => pool[position]), correctIndex: order.indexOf(0) };
}

function makeCloze(passage: SourcePassage, lang: CreationLanguage): { promptText: string; answer: string } {
  const reference = String(passage.text).replace(/\s+/g, ' ').trim().slice(0, 420);
  const candidates = terms(reference).filter(term => term.length >= 5);
  const term = candidates[0] || passage.topic;
  const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu');
  const clue = pattern.test(reference) ? reference.replace(pattern, '______') : `${reference} ______`;
  const lead = lang === 'de' ? 'Ergänze die Lücke:' : lang === 'en' ? 'Complete the gap:' : lang === 'ar' ? 'أكمل الفراغ:' : lang === 'fr' ? 'Complétez le vide :' : 'Completa el espacio:';
  return { promptText: `${lead} ${clue}`, answer: `${term} — ${reference}` };
}

function passageFor(passages: SourcePassage[], index: number): SourcePassage {
  return passages[index % passages.length];
}

function questionFromPassage(
  passage: SourcePassage,
  allPassages: SourcePassage[],
  index: number,
  passageIndex: number,
  formatId: string,
  config: CreationConfig,
  block: CreationBlock,
  unknownTopic: string
): Q {
  const format = FORMAT_BY_ID.get(formatId) || TASK_FORMATS[0];
  const lang = config.lang;
  const topic = passage.topic || unknownTopic;
  const templates = familyPrompts[lang] || familyPrompts.de;
  let prompt = templates[format.family](topic);
  let answer = String(passage.text).replace(/\s+/g, ' ').trim().slice(0, 1400);
  let options: string[] | undefined;
  let correctIndex: number | undefined;

  if (format.kind === 'choice') {
    if (format.id === 'true-false' || format.id === 'statements') {
      const labels = format.id === 'true-false' ? trueFalseLabels[lang] : statementLabels[lang];
      options = [...labels];
      correctIndex = passageIndex % 2;
      answer = options[correctIndex];
    } else {
      const choice = makeChoiceOptions(allPassages, passageIndex, lang);
      options = choice.options;
      correctIndex = choice.correctIndex;
      answer = options[correctIndex];
    }
  } else if (format.id === 'cloze') {
    const cloze = makeCloze(passage, lang);
    prompt = block.instruction ? `${block.instruction} ${cloze.promptText}` : cloze.promptText;
    answer = cloze.answer;
  } else if (format.id === 'matching') {
    const choice = makeChoiceOptions(allPassages, passageIndex, lang);
    options = choice.options;
    correctIndex = choice.correctIndex;
    answer = options[correctIndex];
  }

  const instruction = block.instruction.trim();
  if (instruction && format.id !== 'cloze') prompt = `${instruction} ${prompt}`;
  return {
    id: crypto.randomUUID(),
    prompt,
    answer,
    source: passage.name,
    topic,
    points: 1,
    response: '',
    formatId: format.id,
    blockId: block.id,
    operator: block.operator || format.operator,
    requirementLevel: block.requirementLevel || format.requirementLevel,
    ...(options ? { options } : {}),
    ...(correctIndex !== undefined ? { correctIndex } : {})
  };
}

export function buildCreation(config: CreationConfig, passages: SourcePassage[], unknownTopic = 'Unklar'): Q[] {
  const unique = new Map<string, SourcePassage>();
  for (const passage of passages) {
    const key = passage.text.toLocaleLowerCase().replace(/\W/g, '').slice(0, 120);
    if (key && !unique.has(key) && terms(passage.text).length >= 3) unique.set(key, passage);
  }
  const source = [...unique.values()];
  if (!source.length) return [];

  const blocks = config.blocks.length ? config.blocks : defaultBlocks(config);
  const questions: Q[] = [];
  let questionIndex = 0;
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    const format = FORMAT_BY_ID.get(block.formatId) || TASK_FORMATS[0];
    const count = Math.max(1, Math.min(20, Math.floor(block.count) || 1));
    for (let offset = 0; offset < count; offset++) {
      const passageIndex = (questionIndex + blockIndex * 2) % source.length;
      const question = questionFromPassage(
        passageFor(source, passageIndex), source, questionIndex, passageIndex,
        format.id, config, block, unknownTopic
      );
      question.points = Math.max(1, Math.floor(block.points) || 1);
      questions.push(question);
      questionIndex++;
    }
  }
  return questions;
}

export function defaultBlocks(config: CreationConfig): CreationBlock[] {
  const formats = config.preferredFormats.length
    ? config.preferredFormats
    : config.autoFormat
      ? inferFormats(`${config.goal} ${config.topic}`, config.difficulty)
      : ['open'];
  const seen = new Set<string>();
  return formats.filter(id => FORMAT_BY_ID.has(id) && !seen.has(id) && seen.add(id)).slice(0, 4).map((id, index) => {
    const block = newBlock(id, index);
    block.count = index === 0 ? 3 : 2;
    return block;
  });
}

export function reorderBlocks(blocks: CreationBlock[], id: string, direction: -1 | 1): CreationBlock[] {
  const index = blocks.findIndex(block => block.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= blocks.length) return blocks;
  const next = blocks.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function reorderQuestions(questions: Q[], id: string, direction: -1 | 1): Q[] {
  const index = questions.findIndex(question => question.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= questions.length) return questions;
  const next = questions.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function validateCreation(config: CreationConfig, questions: Q[]): string[] {
  const errors: string[] = [];
  if (config.title.trim().length < 3) errors.push('wizardErrTitle');
  if (!config.subject.trim()) errors.push('wizardErrSubject');
  if (!config.topic.trim()) errors.push('wizardErrTopic');
  if (config.sourceMode === 'materials' && !config.selectedDocIds.length) errors.push('wizardErrSource');
  if ((config.sourceMode === 'text' || config.sourceMode === 'mixed') && config.sourceText.trim().length < 40 && !config.selectedDocIds.length) errors.push('wizardErrSource');
  if (config.sourceMode === 'mixed' && !config.selectedDocIds.length && config.sourceText.trim().length < 40) errors.push('wizardErrSource');
  if (!config.objectives.length) errors.push('wizardErrObjectives');
  if (!config.blocks.length) errors.push('wizardErrBlocks');
  if (!questions.length) errors.push('wizardErrQuestions');
  if (questions.some(question => !Number.isFinite(question.points) || question.points <= 0)) errors.push('wizardErrPoints');
  if (questions.some(question => !question.prompt.trim() || !question.answer.trim())) errors.push('wizardErrAnswers');
  if (questions.some(question => {
    const format = FORMAT_BY_ID.get(question.formatId || '');
    if (!format || format.kind !== 'choice') return false;
    const expected = question.formatId === 'true-false' || question.formatId === 'statements' ? 2 : 4;
    return !question.options || question.options.length !== expected
      || question.correctIndex === undefined || question.correctIndex < 0 || question.correctIndex >= expected
      || new Set(question.options).size !== expected;
  })) errors.push('wizardErrMc');
  return [...new Set(errors)];
}

/** Grade a prepared question; selection formats use the marked correct option. */
export function gradeCreationQuestion(question: Q, response: string, maxPoints = question.points, partialPoints = true) {
  const format = FORMAT_BY_ID.get(question.formatId || '');
  if (format?.kind === 'choice' && question.options && question.correctIndex !== undefined) {
    const correct = question.options[question.correctIndex];
    const hit = response.trim() === correct;
    return {
      points: hit ? maxPoints : 0,
      maxPoints,
      ratio: hit ? 1 : 0,
      confidence: 1,
      uncertain: false,
      missingConcepts: hit ? [] : [correct],
      method: 'local-evidence' as const
    };
  }
  const result = evaluateAnswer(question.answer, response, maxPoints);
  if (partialPoints || result.points === maxPoints || result.points === 0) return result;
  return { ...result, points: result.ratio >= .72 ? maxPoints : 0 };
}

export function metaFromConfig(config: CreationConfig): ExamMeta {
  return {
    lang: config.lang,
    gradeLevel: config.gradeLevel,
    topic: config.topic,
    goal: config.goal,
    sourceMode: config.sourceMode,
    selectedDocIds: [...config.selectedDocIds],
    templateDocId: config.templateDocId,
    templateId: config.templateId,
    sourceText: config.sourceText,
    autoFormat: config.autoFormat,
    preferredFormats: [...config.preferredFormats],
    difficulty: config.difficulty,
    objectives: [...config.objectives],
    blocks: config.blocks.map(block => ({ ...block })),
    examKind: config.examKind,
    differentiation: config.differentiation,
    scaffolding: config.scaffolding,
    partialPoints: config.partialPoints,
    showSolutions: config.showSolutions,
    headerName: config.headerName,
    headerClass: config.headerClass,
    headerDate: config.headerDate
  };
}

export function configFromExam(exam: Exam, fallbackLang = 'de'): CreationConfig {
  const defaults = defaultConfig(fallbackLang, exam.subject);
  const meta = exam.meta;
  return {
    ...defaults,
    lang: meta?.lang || defaults.lang,
    gradeLevel: meta?.gradeLevel || defaults.gradeLevel,
    topic: meta?.topic || exam.subject,
    goal: meta?.goal || '',
    sourceMode: meta?.sourceMode || defaults.sourceMode,
    selectedDocIds: meta?.selectedDocIds ? [...meta.selectedDocIds] : [],
    templateDocId: meta?.templateDocId || '',
    templateId: meta?.templateId || defaults.templateId,
    sourceText: meta?.sourceText || '',
    autoFormat: meta?.autoFormat ?? defaults.autoFormat,
    preferredFormats: meta?.preferredFormats ? [...meta.preferredFormats] : [],
    difficulty: meta?.difficulty || defaults.difficulty,
    objectives: meta?.objectives ? [...meta.objectives] : [],
    blocks: meta?.blocks ? meta.blocks.map(block => ({ ...block })) : [],
    examKind: meta?.examKind || (exam.mode === 'exam' ? 'classwork' : exam.mode === 'practice' ? 'practice' : 'test'),
    duration: exam.duration || defaults.duration,
    differentiation: meta?.differentiation || defaults.differentiation,
    scaffolding: meta?.scaffolding ?? false,
    partialPoints: meta?.partialPoints ?? true,
    showSolutions: meta?.showSolutions ?? true,
    headerName: meta?.headerName || defaults.headerName,
    headerClass: meta?.headerClass || defaults.headerClass,
    headerDate: meta?.headerDate || defaults.headerDate,
    title: exam.title
  };
}

export function passagesFromText(text: string, name: string, topic: string): SourcePassage[] {
  return textParts(text).map(part => ({ text: part, name, topic: topicOf(part, topic) }));
}

const topicSeed: Record<CreationLanguage, string[]> = {
  de: ['Sammle gesicherte Aussagen zum Thema und nenne Belege aus deinem Unterricht.', 'Beschreibe Zusammenhänge und erkläre sie mit eigenen Worten.', 'Bewerte die Bedeutung des Themas für eine konkrete Situation.'],
  en: ['Collect verified statements about the topic and name evidence from your lessons.', 'Describe connections and explain them in your own words.', 'Evaluate the importance of the topic for a concrete situation.'],
  ar: ['اجمع عبارات مؤكدة حول الموضوع واذكر أدلة من دروسك.', 'صف الروابط واشرحها بكلماتك.', 'قيّم أهمية الموضوع في موقف محدد.'],
  fr: ['Rassemblez des affirmations vérifiées sur le thème et citez des preuves de vos cours.', 'Décrivez les liens et expliquez-les avec vos mots.', 'Évaluez l’importance du thème dans une situation concrète.'],
  es: ['Recopila afirmaciones verificadas sobre el tema y nombra pruebas de tus clases.', 'Describe las relaciones y explícalas con tus palabras.', 'Evalúa la importancia del tema en una situación concreta.']
};

/** Honest scaffolding for the "topic only" mode: the teacher completes the answers in step 3. */
export function topicOnlyPassages(topic: string, lang: CreationLanguage): SourcePassage[] {
  const seeds = topicSeed[lang] || topicSeed.de;
  return seeds.map((seed, index) => ({
    text: `„${topic}“ — ${seed}`,
    name: `Thema: ${topic}`,
    topic: topic || 'Thema'
  })).slice(0, 3);
}
