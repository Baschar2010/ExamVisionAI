export type SourcePassage = { text: string; name: string; topic: string };
export type TemplateProfile = {
  questionCount: number;
  subtaskCount: number;
  pointValues: number[];
  averagePromptLength: number;
  taskKinds: string[];
  complexity: 'basic' | 'mixed' | 'advanced';
  cues: string[];
};
export type Evaluation = {
  points: number;
  maxPoints: number;
  ratio: number;
  confidence: number;
  uncertain: boolean;
  missingConcepts: string[];
  method: 'local-evidence';
};

const stopWords = new Set(('und der die das ist im in den des dem ein eine einer eines mit von zu für auf als auch durch bei wird werden sich nicht nach oder um aus an er sie es diese dieser über unter zum zur wie was wer wenn sind kann können war waren haben hat hatte the a an of to and is are was were has have had this that these those it its their they them which what when where as for by from at into through than then will with not more one each both main types type discussed lesson three four five two first second describe explain compare list name state calculate give show identify').split(' '));
for (const word of ('aufgabe aufgaben frage fragen teilaufgabe antworten antwort lösung muster points punkte textstelle textstellen unterlage unterlagen belegstelle belegstellen dokument dokumente kapitel seite seiten bitte nenne bisher folgende folgenden falls jedoch daher deshalb somit sowie innerhalb außerhalb zwischen ohne wegen dir ihr ihnen uns mein meine dein deine sein seine unser ihre deren wessen wobei woran worum wofür wogegen indem schon noch nur auch bereits etwa circa beispiel beispielweise approximately approx example examples section sections chapter chapters page pages answer answers solution solutions task tasks question questions materials material source sources evidence erläutere begründe beschreibe vergleiche').split(/\s+/)) stopWords.add(word);

export type Difficulty = 'easy' | 'medium' | 'hard';
export type BuildOptions = { difficulty?: Difficulty; language?: string; unknownTopic?: string };
const difficultyIndicators = ('analyse analysiere analysieren auswerte auswerten bewerte bewerten begründe begründen hypothesen hypothese modell modelle variabel variablen abhängig abhängigkeit abhängigkeiten verhältnis verhältnisse zusammenhang zusammenhänge struktur prozess vorgang mechanismus wirkung ursache folge konsequenz bilanz bilanzieren ableiten ableitung experimentelle experimentell messwerte messung empirisch theoretisch komplex comparison contrast difference distinction derive mechanism relationship dependence process structure consequence evidence evaluation critical evaluate compare').split(/\s+/);
function difficultyScore(s: string): number {
  const text = s.toLocaleLowerCase();
  const wordCount = terms(s).length;
  const longWords = (s.toLocaleLowerCase().match(/[\p{L}]{9,}/gu) || []).length;
  const numbers = (s.match(/\d/g) || []).length;
  const sentences = Math.max(1, textParts(s).length);
  const indicatorHits = difficultyIndicators.filter(word => word.length > 3 && text.includes(word)).length;
  return longWords * 1.4 + numbers * .8 + indicatorHits * 2.5 + wordCount / sentences / 4 + Math.min(6, s.length / 100);
}
export function difficultyOf(s: string): Difficulty {
  const score = difficultyScore(s);
  return score >= 12 ? 'hard' : score >= 5.5 ? 'medium' : 'easy';
}
export function difficultyReport(passages: SourcePassage[]) {
  const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  let wordSum = 0, lengthSum = 0;
  for (const passage of passages) {
    counts[difficultyOf(passage.text)]++;
    wordSum += terms(passage.text).length;
    lengthSum += passage.text.length;
  }
  const total = Math.max(1, passages.length);
  const dominant = (Object.keys(counts) as Difficulty[]).sort((a, b) => counts[b] - counts[a])[0];
  return { counts, averageWords: Math.round(wordSum / total), averageLength: Math.round(lengthSum / total), dominant };
}
export function effectiveStyle(profile: TemplateProfile | undefined, difficulty: Difficulty = 'medium'): TemplateProfile | undefined {
  if (!profile) return undefined;
  const taskKinds = [...(profile.taskKinds || [])];
  if (difficulty === 'easy') {
    if (!taskKinds.includes('recall')) taskKinds.unshift('recall');
    if (!taskKinds.includes('describe')) taskKinds.push('describe');
  } else if (difficulty === 'hard') {
    if (!taskKinds.includes('compare')) taskKinds.unshift('compare');
    if (!taskKinds.includes('calculate')) taskKinds.push('calculate');
  }
  // The old paper defines points and structure; difficulty only changes emphasis and passage choice.
  return { ...profile, taskKinds: taskKinds.length ? taskKinds : profile.taskKinds };
}
const conceptAliases: string[][] = [
  ['radiation', 'strahlung', 'strahlen', 'ray', 'rays'], ['alpha', 'alphastrahlung'], ['beta', 'betastrahlung'], ['gamma', 'gammastrahlung'],
  ['stopped', 'stoppen', 'gestoppt', 'blocked', 'blockiert', 'absorbed', 'absorbiert', 'halten'],
  ['shielding', 'abschirmung', 'shield', 'abschirmen', 'protection', 'schutz'], ['penetrating', 'penetrate', 'durchdringend', 'penetration', 'durchdringung', 'deeply', 'deep'],
  ['detector', 'detektor', 'detection', 'nachweis', 'detects', 'detektiert', 'geiger'], ['distance', 'abstand', 'entfernung'],
  ['paper', 'papier'], ['aluminium', 'aluminum', 'aluminiumfolie'], ['lead', 'blei'], ['energy', 'energie'], ['power', 'leistung'],
  ['increase', 'increased', 'increases', 'grow', 'growth', 'rise', 'rises', 'steigt', 'steigend', 'zunahme', 'zunehmen'],
  ['decrease', 'decreased', 'decreases', 'fall', 'falls', 'drop', 'sinkt', 'sinkend', 'abnahme', 'abnehmen'],
  ['cause', 'causes', 'caused', 'ursache', 'ursachen', 'verursacht'], ['effect', 'effects', 'impact', 'wirkung', 'wirkungen', 'folge'],
  ['function', 'functions', 'purpose', 'funktion', 'funktionen', 'zweck'], ['property', 'properties', 'eigenschaft', 'eigenschaften'],
  ['example', 'examples', 'beispiel', 'beispiele'], ['material', 'materials', 'stoff', 'werkstoff'],
  ['compare', 'comparison', 'vergleich', 'vergleichen', 'difference', 'unterschied'],
  ['measure', 'measurement', 'measurements', 'messung', 'messungen', 'messwert', 'messwerte'],
  ['pressure', 'druck'], ['temperature', 'temperatur'],
  ['model', 'models', 'modell', 'modelle'], ['system', 'systems', 'systeme']
];

export function textParts(s: string): string[] {
  return s.replace(/\r/g, '').split(/(?<=[.!?؟])\s+|\n+/).map(x => x.trim().replace(/\s+/g, ' '))
    .filter(x => x.length >= 35 && x.length <= 600 && !/^\d{1,2}[.)\s]/.test(x));
}

function normalizeWord(word: string): string {
  let w = word.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  if (w.length > 5) w = w.replace(/(ungen|ung|keiten|keit|isch|lich|ern|en|er|es|e|s)$/u, '');
  return w;
}

export function terms(s: string): string[] {
  return (s.toLocaleLowerCase().match(/[\p{L}]{3,}/gu) || []).map(normalizeWord).filter(x => !stopWords.has(x));
}

function aliasGroup(token: string): string[] {
  const group = conceptAliases.find(xs => xs.some(x => normalizeWord(x) === token));
  return group ? group.map(normalizeWord) : [token];
}

export function topicOf(s: string, fallback = 'Unklar'): string {
  const tokens = terms(s);
  if (!tokens.length) return fallback;
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
}

export function estimateQuality(s: string): number {
  return Math.min(1, s.length / 220) * Math.min(1, textParts(s).length / 5);
}

export function analyzeTemplate(raw: string): TemplateProfile {
  const text = raw.replace(/\r/g, '');
  const lines = text.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const lineNumbered = lines.filter(x => /^(?:aufgabe|frage|question|task)?\s*\d{1,2}(?:\s*\([a-z]\))?\b/i.test(x));
  const marker = /(?:^|\s)(?:(?:aufgabe|frage|question|task)\s*)?(\d{1,2})(?:\s*\([a-z]\))?(?:[).:]\s*|(?=\s+[\p{L}]))/giu;
  const markers = [...text.matchAll(marker)].filter(m => Number(m[1]) > 0 && Number(m[1]) <= 30 && (/aufgabe|frage|question|task/i.test(m[0]) || /[).:]\s*$/.test(m[0])));
  const collapsedNumbered = markers.length >= 2 ? markers.map((m, i) => {
    const start = (m.index || 0) + m[0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index || text.length : text.length;
    return text.slice(start, end).trim().slice(0, 240);
  }).filter(Boolean) : [];
  const numbered = lineNumbered.length >= 2 ? lineNumbered : collapsedNumbered;
  const prompts = numbered.length ? numbered : textParts(text).filter(x => /\?|\b(?:erkl.r|beschreib|vergle|nenn|begr.nd|calculate|explain|describe|compare|state)\b/i.test(x));
  const pointValues = [...text.matchAll(/\b(\d{1,3})\s*(?:punkte?|points?|p\.)\b/gi)].map(m => Number(m[1])).filter(n => n > 0 && n <= 100);
  const cues: string[] = [];
  const candidates: Array<[RegExp, string]> = [
    [/\b(?:nenn|name|list|state|give)/i, 'recall'], [/\b(?:erkl|begr|explain|why)/i, 'explain'],
    [/\b(?:beschreib|describe)/i, 'describe'], [/\b(?:vergle|compare|difference|unterschied)/i, 'compare'],
    [/\b(?:berechn|calculate|work out)/i, 'calculate'], [/\b(?:skizz|zeichn|draw|plot)/i, 'diagram']
  ];
  for (const [re, label] of candidates) if (re.test(text)) cues.push(label);
  const subtaskCount = (text.match(/(?:\([a-z]\)|\b[a-z]\)|\b(?:teilaufgabe|part)\s*[a-z0-9])/gi) || []).length;
  const avg = prompts.length ? prompts.reduce((sum, x) => sum + x.length, 0) / prompts.length : 0;
  const totalPoints = pointValues.reduce((sum, x) => sum + x, 0);
  const complexity = totalPoints / Math.max(1, prompts.length) >= 5 || avg > 180 || subtaskCount >= prompts.length ? 'advanced' : avg < 85 && cues.every(x => x === 'recall') ? 'basic' : 'mixed';
  return { questionCount: Math.max(1, prompts.length), subtaskCount, pointValues, averagePromptLength: Math.round(avg), taskKinds: cues, complexity, cues };
}

export function extractAnswerAssignments(raw: string, maxQuestions: number): Map<number, string> {
  const regex = /(?:^|\s)(?:(?:aufgabe|frage|question|task|q)\s*)?(\d{1,2})(?:\s*\([a-z]\))?[).:]\s*/gim;
  const markers = [...raw.matchAll(regex)].filter(m => Number(m[1]) >= 1 && Number(m[1]) <= maxQuestions);
  const result = new Map<number, string>();
  if (!markers.length) return result;
  for (let i = 0; i < markers.length; i++) {
    const start = (markers[i].index || 0) + markers[i][0].length;
    const end = i + 1 < markers.length ? (markers[i + 1].index || raw.length) : raw.length;
    const index = Number(markers[i][1]) - 1;
    const answer = raw.slice(start, end).trim();
    if (answer && !result.has(index)) result.set(index, answer);
  }
  return result;
}

export function evaluateAnswer(reference: string, response: string, maxPoints: number): Evaluation {
  const refTokens = [...new Set(terms(reference))];
  const responseTokens = new Set(terms(response));
  const concepts = refTokens.map(token => ({ token, aliases: aliasGroup(token) }))
    .filter(c => c.aliases.some(alias => responseTokens.has(alias) || (alias.length >= 4 && [...responseTokens].some(t => t.length >= 4 && (t.startsWith(alias) || alias.startsWith(t))))));
  const matched = new Set(concepts.map(c => c.token));
  const ratio = refTokens.length ? matched.size / refTokens.length : 0;
  const points = !response.trim() ? 0 : ratio >= .72 ? maxPoints : ratio >= .38 ? Math.min(maxPoints, Math.max(1, Math.floor(maxPoints * ratio))) : 0;
  const confidence = Math.min(1, refTokens.length / 4) * (response.trim().length >= 12 ? 1 : .5);
  return {
    points, maxPoints, ratio, confidence, uncertain: confidence < .5 || ratio > .15 && ratio < .82,
    missingConcepts: refTokens.filter(x => !matched.has(x)).slice(0, 6), method: 'local-evidence'
  };
}

export function buildGroundedQuestions(passages: SourcePassage[], count: number, profile?: TemplateProfile, options: BuildOptions = {}) {
  const difficulty = options.difficulty || 'medium';
  const style = effectiveStyle(profile, difficulty);
  const unique = new Map<string, SourcePassage>();
  for (const passage of passages) {
    const key = passage.text.toLocaleLowerCase().replace(/\W/g, '').slice(0, 120);
    if (key && !unique.has(key)) unique.set(key, passage);
  }
  const available = [...unique.values()].filter(x => terms(x.text).length >= 4);
  const limit = Math.min(Math.max(1, count), available.length);
  const selected = [...available];
  if (difficulty === 'easy') selected.sort((a, b) => a.text.length - b.text.length || terms(a.text).length - terms(b.text).length);
  else if (difficulty === 'hard') selected.sort((a, b) => difficultyScore(b.text) - difficultyScore(a.text) || b.text.length - a.text.length);
  else selected.sort((a, b) => a.text.length - b.text.length);
  const chosen = Array.from({ length: limit }, (_, i) => selected[Math.floor((i + .5) * selected.length / limit)]);
  const kinds = style?.taskKinds || [];
  const fallbackKinds: Record<Difficulty, string[]> = { easy: ['recall', 'describe'], medium: ['explain', 'describe'], hard: ['compare', 'calculate', 'explain'] };
  const promptTexts: Record<string, Record<string, (topic: string) => string>> = {
    de: {
      recall: topic => `Nenne die in den Unterlagen beschriebene Kernaussage zu „${topic}“.`,
      compare: topic => `Vergleiche die in dieser Textstelle genannten Aspekte zu „${topic}“. Verwende nur Angaben aus den Unterlagen.`,
      calculate: topic => `Welche Größen und Beziehungen werden in dieser Textstelle zu „${topic}“ ausdrücklich genannt? Erläutere sie.`,
      describe: topic => `Beschreibe den in den Unterlagen dargestellten Sachverhalt zu „${topic}“.`,
      explain: topic => `Erkläre die Kernaussage der Unterlagen zu „${topic}“ mit eigenen Worten.`
    },
    en: {
      recall: topic => `State the key point about “${topic}” that is described in the materials.`,
      compare: topic => `Compare the aspects named in this passage about “${topic}”. Use only information from the materials.`,
      calculate: topic => `Which quantities and relationships about “${topic}” are explicitly named in this passage? Explain them.`,
      describe: topic => `Describe the situation about “${topic}” presented in the materials.`,
      explain: topic => `Explain the key point about “${topic}” in your own words, using only the materials.`
    },
    ar: {
      recall: topic => `اذكر الفكرة الرئيسية حول «${topic}» كما وردت في المواد.`,
      compare: topic => `قارن بين الجوانب المذكورة في هذا المقطع حول «${topic}». استخدم فقط معلومات المواد.`,
      calculate: topic => `ما الكميات والعلاقات المذكورة صراحةً حول «${topic}» في هذا المقطع؟ اشرحها.`,
      describe: topic => `صف الحالة الخاصة بـ «${topic}» كما عرضت في المواد.`,
      explain: topic => `اشرح الفكرة الرئيسية حول «${topic}» بكلماتك الخاصة باستخدام المواد فقط.`
    },
    fr: {
      recall: topic => `Énoncez le point essentiel sur « ${topic} » décrit dans les documents.`,
      compare: topic => `Comparez les aspects mentionnés dans ce passage sur « ${topic} ». Utilisez uniquement les documents.`,
      calculate: topic => `Quelles grandeurs et relations concernant « ${topic} » sont explicitement citées dans ce passage ? Expliquez-les.`,
      describe: topic => `Décrivez la situation concernant « ${topic} » présentée dans les documents.`,
      explain: topic => `Expliquez avec vos mots le point essentiel des documents sur « ${topic} ».`
    },
    es: {
      recall: topic => `Indica la idea clave sobre «${topic}» descrita en los materiales.`,
      compare: topic => `Compara los aspectos mencionados en este pasaje sobre «${topic}». Usa solo información de los materiales.`,
      calculate: topic => `¿Qué magnitudes y relaciones sobre «${topic}» se mencionan explícitamente en este pasaje? Explícalas.`,
      describe: topic => `Describe la situación sobre «${topic}» presentada en los materiales.`,
      explain: topic => `Explica con tus palabras la idea clave de los materiales sobre «${topic}».`
    }
  };
  const templates = promptTexts[options.language || 'de'] || promptTexts.de;
  const fallbackTopic = options.unknownTopic || 'Unklar';
  return chosen.map((p, i) => {
    const kind = kinds.length ? kinds[i % kinds.length] : fallbackKinds[difficulty][i % fallbackKinds[difficulty].length];
    const makePrompt = templates[kind] || templates.explain;
    const prompt = makePrompt(p.topic || fallbackTopic);
    const basePoint = Math.max(1, Math.min(4, Math.ceil(p.text.length / 170)));
    const adjusted = difficulty === 'hard' ? basePoint + 1 : difficulty === 'easy' ? Math.max(1, basePoint - 1) : basePoint;
    const point = style?.pointValues?.length ? style.pointValues[i % style.pointValues.length] : adjusted;
    return { id: crypto.randomUUID(), prompt, answer: p.text, source: p.name, topic: p.topic, points: point, response: '' };
  });
}
