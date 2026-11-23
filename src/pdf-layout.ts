export type PdfExamQuestion = {
  prompt: string;
  answer: string;
  points: number;
  response?: string;
  earned?: number;
  topic?: string;
  format?: string;
  options?: string[];
  correctIndex?: number;
  operator?: string;
  requirementLevel?: string;
  source?: string;
};
export type PdfExam = {
  title: string;
  created: string;
  questions: PdfExamQuestion[];
  subject?: string;
  gradeLevel?: string;
  goal?: string;
  objectives?: string[];
  headerName?: string;
  headerClass?: string;
  headerDate?: string;
  gradingScale?: string;
};
export type PdfImage = { src: string; width: number; height: number; format?: 'PNG' | 'JPEG'; alt?: string };
export type PdfTableCell = { lines: string[]; width: number; rtl: boolean };
export type PdfLine = {
  text: string;
  x: number;
  size: number;
  rtl: boolean;
  height: number;
  y?: number;
  image?: PdfImage;
  cells?: PdfTableCell[];
  header?: boolean;
  tableId?: string;
};
export type PdfBlock = { lines: PdfLine[]; gapAfter: number };

export function isRtlText(s: string): boolean {
  return /[\u0590-\u08ff\ufb1d-\uffff]/.test(s);
}

export function wrapText(text: string, maxChars: number): string[] {
  const width = Math.max(8, Math.floor(maxChars));
  const result: string[] = [];
  for (const paragraph of String(text).replace(/\r/g, '').split(/\n+/)) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      if (!line) {
        let rest = word;
        while (rest.length > width) { result.push(rest.slice(0, width)); rest = rest.slice(width); }
        line = rest;
      } else if (line.length + 1 + word.length <= width) {
        line += ` ${word}`;
      } else {
        result.push(line);
        let rest = word;
        while (rest.length > width) { result.push(rest.slice(0, width)); rest = rest.slice(width); }
        line = rest;
      }
    }
    if (line) result.push(line);
  }
  return result.length ? result : [''];
}

export function textBlocks(lines: Array<{ text: string; x?: number; size?: number; gapAfter?: number }>): PdfBlock[] {
  return lines.map(item => {
    const x = item.x ?? 18;
    const size = item.size ?? 11;
    const wrapped = wrapText(item.text, Math.max(20, Math.floor((190 - x) / (size * .52))));
    return {
      lines: wrapped.map(text => ({ text, x, size, rtl: isRtlText(text), height: size * .48 + 1.6 })),
      gapAfter: item.gapAfter ?? 2
    };
  });
}

export function imageBlock(image: PdfImage, x = 18): PdfBlock {
  return {
    lines: [{ text: '', x, size: 10, rtl: false, height: image.height, image }],
    gapAfter: 4
  };
}

export function tableBlocks(
  headers: string[],
  rows: string[][],
  options: { x?: number; widths?: number[]; size?: number; gapAfter?: number; id?: string } = {}
): PdfBlock[] {
  const tableId = options.id || `table-${headers.join('-').slice(0, 40)}`;
  const x = options.x ?? 18;
  const size = options.size ?? 9;
  const totalWidth = 190 - x;
  const widths = options.widths && options.widths.length === headers.length
    ? options.widths
    : headers.map(() => totalWidth / headers.length);
  const lineHeight = size * .48 + 1.4;
  const buildRow = (values: string[], header: boolean): PdfBlock => {
    const cells = values.map((value, index) => {
      const cellWidth = widths[index];
      const maxChars = Math.max(6, Math.floor(cellWidth / (size * .52)) - 2);
      return { lines: wrapText(value, maxChars).slice(0, 6), width: cellWidth, rtl: isRtlText(value) };
    });
    const count = Math.max(1, ...cells.map(cell => cell.lines.length));
    return {
      lines: [{
        text: '',
        x,
        size,
        rtl: false,
        height: count * lineHeight + 2.6,
        cells,
        header,
        tableId
      }],
      gapAfter: header ? 1 : 0
    };
  };
  const blocks = [buildRow(headers, true)];
  for (const row of rows) blocks.push(buildRow(row, false));
  blocks[blocks.length - 1].gapAfter = options.gapAfter ?? 6;
  return blocks;
}

function line(text: string, x: number, size: number, gapAfter = 0): PdfBlock {
  const wrapped = wrapText(text, Math.max(20, Math.floor((190 - x) / (size * .52))));
  return {
    lines: wrapped.map(part => ({ text: part, x, size, rtl: isRtlText(part), height: size * .48 + 1.6 })),
    gapAfter
  };
}

export type ExamPdfLabels = {
  date: string;
  points: string;
  solution: string;
  answer: string;
  achieved: string;
  pointsShort?: string;
  format?: string;
  objectives?: string;
  name?: string;
  classLabel?: string;
  subject?: string;
  grade?: string;
  correct?: string;
  operator?: string;
  requirement?: string;
  gradingScale?: string;
};

export function buildExamPdfBlocks(exam: PdfExam, answers: boolean, labels: ExamPdfLabels): PdfBlock[] {
  const total = exam.questions.reduce((sum, q) => sum + q.points, 0);
  const blocks: PdfBlock[] = [
    line('ExamVision AI', 18, 20, 10),
    line(exam.title.slice(0, 120), 18, 13, 6)
  ];
  const meta: string[] = [];
  if (exam.subject) meta.push(`${labels.subject || 'Fach'}: ${exam.subject}`);
  if (exam.gradeLevel) meta.push(`${labels.grade || 'Klasse'}: ${exam.gradeLevel}`);
  meta.push(`${labels.date}: ${new Date(exam.created).toLocaleDateString()}`);
  meta.push(`${labels.points}: ${total}`);
  blocks.push(line(meta.join('   |   '), 18, 10, 6));
  const header = [
    `${exam.headerName || labels.name || 'Name'}: ________________`,
    `${exam.headerClass || labels.classLabel || 'Klasse'}: ____________`,
    `${exam.headerDate || labels.date || 'Datum'}: ____________`
  ].join('     ');
  blocks.push(line(header, 18, 10, exam.goal || exam.objectives?.length ? 4 : 10));
  if (exam.goal) blocks.push(line(exam.goal, 18, 10, 6));
  if (exam.objectives?.length) {
    blocks.push(line(`${labels.objectives || 'Lernziele'}:`, 18, 11, 2));
    for (const objective of exam.objectives.slice(0, 10)) blocks.push(line(`• ${objective}`, 22, 9, 1));
    blocks[blocks.length - 1].gapAfter = 8;
  }
  if (exam.gradingScale) {
    blocks.push(line(`${labels.gradingScale || 'Notenschlüssel'}: ${exam.gradingScale}`, 18, 9, 8));
  }
  exam.questions.forEach((question, index) => {
    const short = labels.pointsShort || 'P.';
    const format = question.format ? ` · ${question.format}` : '';
    const prefix = answers && question.earned !== undefined
      ? `${index + 1}.${format} ${question.prompt} (${question.earned}/${question.points} ${labels.achieved})`
      : `${index + 1}.${format} ${question.prompt} (${question.points} ${short})`;
    blocks.push(line(prefix, 18, 11, 2));
    const details = [question.operator, question.requirementLevel].filter(Boolean).join(' · ');
    if (details) blocks.push(line(details, 22, 9, 2));
    if (question.options?.length) {
      question.options.slice(0, 4).forEach((option, optionIndex) => {
        const marked = answers && optionIndex === question.correctIndex ? ` ${labels.correct || '✓'}` : '';
        blocks.push(line(`${'ABCD'[optionIndex]}) ${option}${marked}`, 24, 10, 2));
      });
      blocks[blocks.length - 1].gapAfter = 4;
    } else if (!answers) {
      for (let i = 0; i < 3; i++) blocks.push({ lines: [{ text: '', x: 22, size: 9, rtl: false, height: 5 }], gapAfter: 0 });
      blocks[blocks.length - 1].gapAfter = 5;
    }
    if (answers) {
      blocks.push(line(`${labels.solution}: ${question.answer}`, 22, 9, 3));
      if (question.response) blocks.push(line(`${labels.answer}: ${question.response}`, 22, 9, 3));
    }
  });
  return blocks;
}

export type ReportData = {
  title: string;
  submitted: number;
  minutes: number;
  percent: number;
  weakest: string[];
  topics: Array<{ topic: string; percent: number; earned: number; possible: number }>;
  trend: Array<{ label: string; percent: number }>;
};
export type ReportLabels = {
  exams: string;
  minutes: string;
  average: string;
  weak: string;
  none: string;
  topics: string;
  trend: string;
};

export function buildReportPdfBlocks(data: ReportData, labels: ReportLabels): PdfBlock[] {
  const blocks: PdfBlock[] = [
    line(data.title, 18, 18, 8),
    line(`${labels.exams}: ${data.submitted}`, 18, 11, 2),
    line(`${labels.minutes}: ${data.minutes} min`, 18, 11, 2),
    line(`${labels.average}: ${data.percent}%`, 18, 11, 6),
    line(`${labels.weak}: ${data.weakest.join(', ') || labels.none}`, 18, 10, 8),
    line(labels.topics, 18, 13, 3)
  ];
  for (const topic of data.topics.slice(0, 14)) {
    blocks.push(line(`${topic.topic}: ${topic.percent}% (${topic.earned}/${topic.possible})`, 22, 9, 1));
  }
  if (data.trend.length) {
    blocks.push(line(labels.trend, 18, 13, 3));
    for (const point of data.trend) blocks.push(line(`${point.label}: ${point.percent}%`, 22, 9, 1));
  }
  return blocks;
}

export function paginateBlocks(blocks: PdfBlock[], options: { top?: number; bottom?: number } = {}): PdfLine[][] {
  const top = options.top ?? 22;
  const bottom = options.bottom ?? 280;
  const pages: PdfLine[][] = [[]];
  const tableHeaders = new Map<string, PdfLine>();
  let y = top;
  for (const block of blocks) {
    for (const item of block.lines) {
      if (item.header && item.tableId) tableHeaders.set(item.tableId, item);
      if (y + item.height > bottom && y > top) {
        pages.push([]);
        y = top;
        const header = !item.header && item.tableId && item.cells ? tableHeaders.get(item.tableId) : undefined;
        if (header && y + header.height <= bottom) {
          pages[pages.length - 1].push({ ...header, y });
          y += header.height;
        }
      }
      pages[pages.length - 1].push({ ...item, y });
      y += item.height;
    }
    y += block.gapAfter;
  }
  return pages;
}
