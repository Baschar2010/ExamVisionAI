export type PdfExamQuestion = { prompt: string; answer: string; points: number; response?: string; earned?: number; topic?: string };
export type PdfExam = { title: string; created: string; questions: PdfExamQuestion[] };
export type PdfLine = { text: string; x: number; size: number; rtl: boolean; height: number; y?: number };
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

function line(text: string, x: number, size: number, gapAfter = 0): PdfBlock {
  const wrapped = wrapText(text, Math.max(20, Math.floor((190 - x) / (size * .52))));
  return {
    lines: wrapped.map(part => ({ text: part, x, size, rtl: isRtlText(part), height: size * .48 + 1.6 })),
    gapAfter
  };
}

export function buildExamPdfBlocks(exam: PdfExam, answers: boolean, labels: { date: string; points: string; solution: string; answer: string; achieved: string }): PdfBlock[] {
  const blocks: PdfBlock[] = [
    line('ExamVision AI', 18, 20, 10),
    line(exam.title.slice(0, 120), 18, 13, 6),
    line(`${labels.date}: ${new Date(exam.created).toLocaleDateString()}   |   ${labels.points}: ${exam.questions.reduce((sum, q) => sum + q.points, 0)}`, 18, 10, 12)
  ];
  exam.questions.forEach((question, index) => {
    const prefix = answers && question.earned !== undefined ? `${index + 1}. ${question.prompt} (${question.earned}/${question.points} ${labels.achieved})` : `${index + 1}. ${question.prompt} (${question.points} P.)`;
    blocks.push(line(prefix, 18, 11, 2));
    if (answers) {
      blocks.push(line(`${labels.solution}: ${question.answer}`, 22, 9, 3));
      if (question.response) blocks.push(line(`${labels.answer}: ${question.response}`, 22, 9, 3));
    } else {
      for (let i = 0; i < 3; i++) blocks.push({ lines: [{ text: '', x: 22, size: 9, rtl: false, height: 5 }], gapAfter: 0 });
      blocks[blocks.length - 1].gapAfter = 5;
    }
  });
  return blocks;
}

export function paginateBlocks(blocks: PdfBlock[], options: { top?: number; bottom?: number } = {}): PdfLine[][] {
  const top = options.top ?? 22;
  const bottom = options.bottom ?? 280;
  const pages: PdfLine[][] = [[]];
  let y = top;
  for (const block of blocks) {
    for (const item of block.lines) {
      if (y + item.height > bottom) { pages.push([]); y = top; }
      pages[pages.length - 1].push({ ...item, y });
      y += item.height;
    }
    y += block.gapAfter;
  }
  return pages;
}
