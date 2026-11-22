import { difficultyReport, terms, type SourcePassage } from './core.ts';

export type GraphicType = 'bar' | 'timeline' | 'comparison' | 'flowchart' | 'infographic';

export type GraphicItem = {
  label: string;
  value?: number;
  text?: string;
  detail?: string;
};

export type GraphicModel = {
  type: GraphicType;
  title: string;
  subtitle: string;
  items: GraphicItem[];
  scaleMax: number;
  footer: string;
};

export type GraphicLabels = {
  bar: string;
  timeline: string;
  comparison: string;
  flowchart: string;
  infographic: string;
  concepts: string;
  passages: string;
  sources: string;
  words: string;
  shared: string;
  onlyTopic: string;
  onlyOther: string;
  step: string;
  noData: string;
  average: string;
};

function excerpt(text: string, max: number): string {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function topTerms(passages: SourcePassage[], limit: number): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const passage of passages) {
    for (const term of terms(passage.text)) counts.set(term, (counts.get(term) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

export function buildGraphic(
  passages: SourcePassage[],
  options: { type: GraphicType; topic?: string; labels: GraphicLabels }
): GraphicModel {
  const { labels, type } = options;
  const topic = options.topic || '';
  const subtitle = topic || labels.concepts;
  if (!passages.length) {
    return { type, title: labels[type], subtitle, items: [{ label: labels.noData }], scaleMax: 1, footer: '' };
  }
  if (type === 'bar') {
    const items = topTerms(passages, 8).map(([label, value]) => ({ label, value }));
    return { type, title: labels.bar, subtitle, items, scaleMax: Math.max(1, ...items.map(item => item.value || 0)), footer: labels.concepts };
  }
  if (type === 'timeline') {
    const items = passages.slice(0, 8).map((passage, index) => ({
      label: `${index + 1}`,
      text: excerpt(passage.text, 100),
      detail: passage.topic
    }));
    return { type, title: labels.timeline, subtitle, items, scaleMax: items.length, footer: labels.passages };
  }
  if (type === 'comparison') {
    const needle = topic.toLocaleLowerCase();
    const a = needle ? passages.filter(passage => passage.topic.toLocaleLowerCase().includes(needle) || passage.text.toLocaleLowerCase().includes(needle)) : passages.slice(0, 1);
    const b = needle ? passages.filter(passage => !a.includes(passage)) : passages.slice(1);
    const aTerms = new Set(topTerms(a, 12).map(([term]) => term));
    const bTerms = new Set(topTerms(b, 12).map(([term]) => term));
    const shared = [...aTerms].filter(term => bTerms.has(term));
    const onlyTopic = [...aTerms].filter(term => !bTerms.has(term));
    const onlyOther = [...bTerms].filter(term => !aTerms.has(term));
    const items = [
      { label: labels.shared, text: shared.join(', ') || '—' },
      { label: `${labels.onlyTopic} ${topic || subtitle}`.trim(), text: onlyTopic.join(', ') || '—' },
      { label: labels.onlyOther, text: onlyOther.join(', ') || '—' }
    ];
    return { type, title: labels.comparison, subtitle, items, scaleMax: 1, footer: labels.concepts };
  }
  if (type === 'flowchart') {
    const items = passages.slice(0, 6).map((passage, index) => ({
      label: `${labels.step} ${index + 1}`,
      text: excerpt(passage.text, 90),
      detail: passage.topic
    }));
    return { type, title: labels.flowchart, subtitle, items, scaleMax: items.length, footer: labels.passages };
  }
  const report = difficultyReport(passages);
  const words = passages.reduce((sum, passage) => sum + terms(passage.text).length, 0);
  const sources = new Set(passages.map(passage => passage.name)).size;
  const items: GraphicItem[] = [
    { label: labels.passages, value: passages.length },
    { label: labels.sources, value: sources },
    { label: labels.words, value: words },
    { label: labels.average, value: report.averageWords },
    { label: labels.concepts, text: topTerms(passages, 6).map(([term]) => term).join(', ') }
  ];
  return { type, title: labels.infographic, subtitle, items, scaleMax: Math.max(1, ...items.map(item => item.value || 0)), footer: labels.concepts };
}
