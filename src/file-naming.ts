import type { Artifact, Exam } from './types.ts';

const DATE_PATTERN = /^\d{2}-\d{2}-\d{4}$/;

export function safeFilename(value: string, max = 100): string {
  const cleaned = String(value ?? '')
    .replace(/[^\p{L}\p{N} -]/gu, '_')
    .replace(/_+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^_+|_+$/g, '')
    .slice(0, max)
    .trim();
  return cleaned || 'ExamVision-AI';
}

export function formatFilenameDate(value: string | number | Date = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  }
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

export function documentFilename(options: {
  subject?: string;
  title?: string;
  date?: string | number | Date;
  suffix?: string;
  extension?: string;
}): string {
  const { subject = '', title = '', date = new Date(), suffix = '', extension = 'pdf' } = options;
  const cleanTitle = safeFilename(title, 72).replace(/^\d{2}-\d{2}-\d{4}_?/, '');
  const cleanSubject = safeFilename(subject, 40);
  const cleanSuffix = safeFilename(suffix, 32);
  const parts: string[] = [];
  if (cleanSubject && cleanTitle.toLowerCase() !== cleanSubject.toLowerCase() && !cleanTitle.toLowerCase().includes(cleanSubject.toLowerCase())) {
    parts.push(cleanSubject);
  }
  parts.push(DATE_PATTERN.test(cleanTitle) ? 'ExamVision-AI' : cleanTitle);
  if (cleanSuffix && cleanSuffix !== 'ExamVision-AI') parts.push(cleanSuffix);
  parts.push(formatFilenameDate(date));
  return `${parts.join('_')}.${extension.replace(/^\./, '')}`;
}

export function workPdfFilename(exam: Exam, options: { suffix?: string; date?: string | number | Date } = {}): string {
  return documentFilename({
    subject: exam.subject,
    title: exam.title,
    date: options.date ?? exam.created,
    suffix: options.suffix,
  });
}

export function artifactPdfFilename(artifact: Artifact): string {
  return documentFilename({
    subject: artifact.subject,
    title: artifact.title,
    date: artifact.created,
  });
}

export function correctionPdfFilename(exam: Exam): string {
  return workPdfFilename(exam, { suffix: 'Korrektur' });
}

export function progressPdfFilename(date: string | number | Date = new Date()): string {
  return documentFilename({ title: 'Lernfortschritt', date });
}
