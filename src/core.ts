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
const conceptAliases: string[][] = [
  ['radiation', 'strahlung', 'strahlen', 'ray', 'rays'], ['alpha', 'alphastrahlung'], ['beta', 'betastrahlung'], ['gamma', 'gammastrahlung'],
  ['stopped', 'stoppen', 'gestoppt', 'blocked', 'blockiert', 'absorbed', 'absorbiert', 'halten'],
  ['shielding', 'abschirmung', 'shield', 'abschirmen', 'protection', 'schutz'], ['penetrating', 'penetrate', 'durchdringend', 'penetration', 'durchdringung', 'deeply', 'deep'],
  ['detector', 'detektor', 'detection', 'nachweis', 'detects', 'detektiert', 'geiger'], ['distance', 'abstand', 'entfernung'],
  ['paper', 'papier'], ['aluminium', 'aluminum', 'aluminiumfolie'], ['lead', 'blei'], ['energy', 'energie'], ['power', 'leistung']
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

export function topicOf(s: string): string {
  const tokens = terms(s);
  if (!tokens.length) return 'Unklar';
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
}

export function estimateQuality(s: string): number {
  return Math.min(1, s.length / 220) * Math.min(1, textParts(s).length / 5);
}

export function analyzeTemplate(raw: string): TemplateProfile {
  const lines = raw.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const numbered = lines.filter(x => /^(?:aufgabe|frage|question|task)?\s*\d{1,2}(?:\s*\([a-z]\))?\b/i.test(x));
  const prompts = numbered.length ? numbered : textParts(raw).filter(x => /\?|\b(?:erkl.r|beschreib|vergle|nenn|begr.nd|calculate|explain|describe|compare|state)\b/i.test(x));
  const pointValues = [...raw.matchAll(/\b(\d{1,3})\s*(?:punkte?|points?|p\.)\b/gi)].map(m => Number(m[1])).filter(n => n > 0 && n <= 100);
  const cues: string[] = [];
  const candidates: Array<[RegExp, string]> = [
    [/\b(?:nenn|name|list|state|give)/i, 'recall'], [/\b(?:erkl|begr|explain|why)/i, 'explain'],
    [/\b(?:beschreib|describe)/i, 'describe'], [/\b(?:vergle|compare|difference)/i, 'compare'],
    [/\b(?:berechn|calculate|work out)/i, 'calculate'], [/\b(?:skizz|zeichn|draw|plot)/i, 'diagram']
  ];
  for (const [re, label] of candidates) if (re.test(raw)) cues.push(label);
  const subtaskCount = (raw.match(/(?:\([a-z]\)|\b[a-z]\)|\b(?:teilaufgabe|part)\s*[a-z0-9])/gi) || []).length;
  const avg = prompts.length ? prompts.reduce((sum, x) => sum + x.length, 0) / prompts.length : 0;
  const totalPoints = pointValues.reduce((sum, x) => sum + x, 0);
  const complexity = totalPoints / Math.max(1, prompts.length) >= 5 || avg > 180 || subtaskCount >= prompts.length ? 'advanced' : avg < 85 && cues.every(x => x === 'recall') ? 'basic' : 'mixed';
  return { questionCount: Math.max(1, prompts.length), subtaskCount, pointValues, averagePromptLength: Math.round(avg), taskKinds: cues, complexity, cues };
}

export function extractAnswerAssignments(raw: string, maxQuestions: number): Map<number, string> {
  const regex = /(?:^|\s)(?:(?:aufgabe|frage|question|task|q)\s*)?(\d{1,2})(?:\s*\([a-z]\))?[).:]\s*/gim;
  const markers = [...raw.matchAll(regex)].filter(m => Number(m[1]) >= 1 && Number(m[1]) <= maxQuestions);
  const result = new Map<number, string>();
  if (markers.length < 2) return result;
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
    .filter(c => c.aliases.some(alias => responseTokens.has(alias) || [...responseTokens].some(t => t.startsWith(alias) || alias.startsWith(t))));
  const matched = new Set(concepts.map(c => c.token));
  const ratio = refTokens.length ? matched.size / refTokens.length : 0;
  const points = !response.trim() ? 0 : ratio >= .72 ? maxPoints : ratio >= .38 ? Math.min(maxPoints, Math.max(1, Math.floor(maxPoints * ratio))) : 0;
  const confidence = Math.min(1, refTokens.length / 4) * (response.trim().length >= 12 ? 1 : .5);
  return {
    points, maxPoints, ratio, confidence, uncertain: confidence < .5 || ratio > .15 && ratio < .82,
    missingConcepts: refTokens.filter(x => !matched.has(x)).slice(0, 6), method: 'local-evidence'
  };
}

export function buildGroundedQuestions(passages: SourcePassage[], count: number, profile?: TemplateProfile) {
  const unique = new Map<string, SourcePassage>();
  for (const passage of passages) {
    const key = passage.text.toLocaleLowerCase().replace(/\W/g, '').slice(0, 120);
    if (key && !unique.has(key)) unique.set(key, passage);
  }
  const available = [...unique.values()].filter(x => terms(x.text).length >= 4);
  const limit = Math.min(Math.max(1, count), available.length);
  const selected = available.sort((a, b) => a.text.length - b.text.length);
  const chosen = Array.from({ length: limit }, (_, i) => selected[Math.floor((i + .5) * selected.length / limit)]);
  const kinds = profile?.taskKinds || [];
  return chosen.map((p, i) => {
    const kind = kinds.length ? kinds[i % kinds.length] : 'explain';
    const prompt = kind === 'recall' ? `Nenne die in den Unterlagen beschriebene Kernaussage zu „${p.topic}“.`
      : kind === 'compare' ? `Vergleiche die in dieser Textstelle genannten Aspekte zu „${p.topic}“. Verwende nur Angaben aus den Unterlagen.`
      : kind === 'calculate' ? `Welche Größen und Beziehungen werden in dieser Textstelle zu „${p.topic}“ ausdrücklich genannt? Erläutere sie.`
      : kind === 'describe' ? `Beschreibe den in den Unterlagen dargestellten Sachverhalt zu „${p.topic}“.`
      : `Erkläre die Kernaussage der Unterlagen zu „${p.topic}“ mit eigenen Worten.`;
    const point = profile?.pointValues?.length ? profile.pointValues[i % profile.pointValues.length] : Math.max(1, Math.min(4, Math.ceil(p.text.length / 170)));
    return { id: crypto.randomUUID(), prompt, answer: p.text, source: p.name, topic: p.topic, points: point, response: '' };
  });
}
