import type { Artifact, Exam, Q } from './types.ts';
import type { LessonPlan } from './lesson.ts';
import type { Worksheet } from './worksheet.ts';
import type { Presentation } from './presentation.ts';
import type { GraphicModel } from './graphics.ts';
import { imageBlock, tableBlocks, textBlocks, type PdfBlock, type PdfImage } from './pdf-layout.ts';

export type PdfDocumentLabels = Record<string, string>;

function value(labels: PdfDocumentLabels, key: string, fallback: string): string {
  return labels[key] || fallback;
}

function dateOf(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

export function svgToPngDataUrl(svg: string, scale = 1): Promise<string | null> {
  return new Promise(resolve => {
    if (typeof document === 'undefined') { resolve(null); return; }
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round((image.naturalWidth || 920) * scale));
        canvas.height = Math.max(1, Math.round((image.naturalHeight || 400) * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.scale(scale, scale);
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch { resolve(null); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    image.src = url;
  });
}

export function buildLessonBlocks(plan: LessonPlan, labels: PdfDocumentLabels): PdfBlock[] {
  const blocks = textBlocks([
    { text: plan.title, size: 18, gapAfter: 6 },
    { text: `${value(labels, 'date', 'Datum')}: ${dateOf(new Date().toISOString())}`, size: 9, gapAfter: 6 }
  ]);
  if (plan.meta.length) {
    blocks.push(...tableBlocks(
      [value(labels, 'subject', 'Fach'), value(labels, 'value', 'Wert')],
      plan.meta.map(item => [item.label, item.value]),
      { id: 'lesson-meta' }
    ));
  }
  blocks.push(...textBlocks([
    { text: value(labels, 'objectives', 'Lernziele'), size: 13, gapAfter: 3 },
    ...plan.objectives.map(item => ({ text: `• ${item}`, size: 10 })),
    { text: value(labels, 'phases', 'Phasen'), size: 13, gapAfter: 3 }
  ]));
  blocks.push(...tableBlocks(
    [value(labels, 'phase', 'Phase'), value(labels, 'minutesShort', 'Min'), value(labels, 'activity', 'Aktivität')],
    plan.phases.map(phase => [phase.name, String(phase.minutes), `${phase.activity} | ${phase.teacher} | ${phase.students} | ${phase.material}`]),
    { widths: [38, 16, 118], id: 'lesson-phases' }
  ));
  blocks.push(...textBlocks([
    { text: `${value(labels, 'differentiation', 'Differenzierung')}: ${plan.differentiation}`, size: 10 },
    { text: `${value(labels, 'assessment', 'Leistungsfeststellung')}: ${plan.assessment}`, size: 10 },
    { text: `${value(labels, 'sources', 'Quellen')}: ${plan.sources.join(', ')}`, size: 10 }
  ]));
  return blocks;
}

export function buildWorksheetBlocks(sheet: Worksheet, labels: PdfDocumentLabels): PdfBlock[] {
  const blocks = textBlocks([
    { text: sheet.title, size: 18, gapAfter: 5 },
    { text: sheet.instructions, size: 10, gapAfter: 8 }
  ]);
  blocks.push(...tableBlocks(
    [value(labels, 'taskLabel', 'Nr.'), value(labels, 'prompt', 'Aufgabe'), value(labels, 'points', 'Punkte')],
    sheet.questions.map((question, index) => [String(index + 1), question.prompt, String(question.points)]),
    { widths: [14, 148, 20], id: 'worksheet-questions' }
  ));
  if (sheet.showSolutions) {
    blocks.push(...textBlocks([{ text: value(labels, 'solution', 'Lösung'), size: 13, gapAfter: 3 }]));
    blocks.push(...tableBlocks(
      [value(labels, 'taskLabel', 'Nr.'), value(labels, 'solution', 'Lösung'), value(labels, 'source', 'Quelle')],
      sheet.questions.map((question, index) => [String(index + 1), question.answer, question.source]),
      { widths: [14, 108, 60], id: 'worksheet-solutions' }
    ));
  } else {
    blocks.push(...textBlocks([{ text: `${value(labels, 'source', 'Quelle')}: ${sheet.questions.map(q => q.source).filter((x, i, a) => a.indexOf(x) === i).join(', ')}`, size: 9 }]));
  }
  return blocks;
}

export function buildPresentationBlocks(deck: Presentation, labels: PdfDocumentLabels): PdfBlock[] {
  const blocks = textBlocks([{ text: deck.title, size: 18, gapAfter: 8 }]);
  blocks.push(...tableBlocks(
    [value(labels, 'taskLabel', 'Nr.'), value(labels, 'slide', 'Folie'), value(labels, 'topic', 'Thema')],
    deck.slides.map((item, index) => [String(index + 1), item.title, item.kind]),
    { widths: [14, 100, 68], id: 'slide-overview' }
  ));
  deck.slides.forEach((item, index) => {
    blocks.push(...textBlocks([
      { text: `${value(labels, 'slide', 'Folie')} ${index + 1}: ${item.title}`, size: 13, gapAfter: 2 },
      ...item.bullets.map(bullet => ({ text: `• ${bullet}`, size: 10 }))
    ]));
    if (item.note) blocks.push(...textBlocks([{ text: `${value(labels, 'slideNotes', 'Hinweise')}: ${item.note}`, size: 9, gapAfter: 3 }]));
    if (item.source) blocks.push(...textBlocks([{ text: `${value(labels, 'source', 'Quelle')}: ${item.source}`, size: 9, gapAfter: 5 }]));
  });
  return blocks;
}

export function buildGraphicBlocks(model: GraphicModel, labels: PdfDocumentLabels, image?: PdfImage): PdfBlock[] {
  const blocks = textBlocks([
    { text: model.title, size: 18, gapAfter: 4 },
    { text: model.subtitle, size: 11, gapAfter: 8 }
  ]);
  if (image) blocks.push(imageBlock(image));
  blocks.push(...tableBlocks(
    [value(labels, 'concepts', 'Begriffe'), value(labels, 'value', 'Wert'), value(labels, 'details', 'Details')],
    model.items.map(item => [item.label, item.value !== undefined ? String(item.value) : item.text || '', item.detail || '']),
    { widths: [58, 36, 88], id: 'graphic-data' }
  ));
  if (model.footer) blocks.push(...textBlocks([{ text: model.footer, size: 9 }]));
  return blocks;
}

export function buildArtifactPdfBlocks(artifact: Artifact, labels: PdfDocumentLabels, graphicImage?: PdfImage): PdfBlock[] {
  const header = textBlocks([{ text: artifact.title, size: 15, gapAfter: 4 }]);
  if (artifact.kind === 'lesson') return [...header, ...buildLessonBlocks(artifact.data as LessonPlan, labels)];
  if (artifact.kind === 'worksheet' || artifact.kind === 'practice') return buildWorksheetBlocks(artifact.data as Worksheet, labels);
  if (artifact.kind === 'presentation') return buildPresentationBlocks(artifact.data as Presentation, labels);
  if (artifact.kind === 'graphic') return buildGraphicBlocks(artifact.data as GraphicModel, labels, graphicImage);
  return header;
}

export function buildCorrectionBlocks(exam: Exam, labels: PdfDocumentLabels): PdfBlock[] {
  const blocks = textBlocks([
    { text: `${value(labels, 'correction', 'Korrektur')}: ${exam.title}`, size: 18, gapAfter: 4 },
    { text: `${value(labels, 'date', 'Datum')}: ${dateOf(exam.created)}`, size: 10, gapAfter: 8 }
  ]);
  blocks.push(...tableBlocks(
    [
      value(labels, 'taskLabel', 'Nr.'),
      value(labels, 'prompt', 'Aufgabe'),
      value(labels, 'points', 'Punkte'),
      value(labels, 'achieved', 'erreicht'),
      value(labels, 'feedback', 'Rückmeldung')
    ],
    exam.questions.map((q: Q, index) => [
      String(index + 1), q.prompt, String(q.points), String(q.earned ?? 0), q.feedback || ''
    ]),
    { widths: [12, 78, 18, 20, 54], id: 'correction' }
  ));
  for (const question of exam.questions) {
    blocks.push(...textBlocks([
      { text: `${value(labels, 'solution', 'Lösung')}: ${question.answer}`, size: 9, gapAfter: 1 },
      { text: `${value(labels, 'answer', 'Antwort')}: ${question.response || '—'}`, size: 9, gapAfter: 4 }
    ]));
  }
  return blocks;
}

export type OverviewData = {
  title: string;
  submitted: number;
  minutes: number;
  percent: number;
  weakest: string[];
  topics: Array<{ topic: string; percent: number; earned: number; possible: number }>;
  trend: Array<{ label: string; percent: number }>;
};

export function buildOverviewBlocks(data: OverviewData, labels: PdfDocumentLabels): PdfBlock[] {
  const blocks = textBlocks([
    { text: data.title, size: 18, gapAfter: 4 },
    { text: `${value(labels, 'reportExams', 'Arbeiten')}: ${data.submitted} · ${value(labels, 'reportMinutes', 'Minuten')}: ${data.minutes} · ${value(labels, 'avgScore', 'Durchschnitt')}: ${data.percent}%`, size: 10, gapAfter: 4 },
    { text: `${value(labels, 'reportWeak', 'Wiederholen')}: ${data.weakest.join(', ') || value(labels, 'noWeak', 'keine')}`, size: 10, gapAfter: 8 }
  ]);
  if (data.topics.length) {
    blocks.push(...textBlocks([{ text: value(labels, 'topicResults', 'Themenergebnisse'), size: 13, gapAfter: 3 }]));
    blocks.push(...tableBlocks(
      [value(labels, 'topic', 'Thema'), value(labels, 'percent', 'Prozent'), value(labels, 'result', 'Ergebnis')],
      data.topics.map(topic => [topic.topic, `${topic.percent}%`, `${topic.earned}/${topic.possible}`]),
      { widths: [100, 36, 46], id: 'overview-topics' }
    ));
  }
  if (data.trend.length) {
    blocks.push(...textBlocks([{ text: value(labels, 'reportTrend', 'Trend'), size: 13, gapAfter: 3 }]));
    blocks.push(...tableBlocks(
      [value(labels, 'date', 'Datum'), value(labels, 'percent', 'Prozent')],
      data.trend.map(point => [point.label, `${point.percent}%`]),
      { widths: [120, 62], id: 'overview-trend' }
    ));
  }
  return blocks;
}
