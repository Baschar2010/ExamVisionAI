import type { Evaluation } from './core.ts';

export type FeedbackLabels = {
  fbEmpty: string;
  fbUncertain: string;
  fbFull: string;
  fbPartial: string;
  fbMissing: string;
  fbNoNumber: string;
  fbPartialReview: string;
  fbNoConcepts: string;
};

function missingText(missing: string[], label: string): string {
  return missing.length ? `${label} ${missing.join(', ')}` : '';
}

export function localFeedback(
  result: Evaluation,
  response: string,
  labels: FeedbackLabels,
  options: { unassigned?: boolean; ocrReview?: boolean } = {}
): string {
  const detail = missingText(result.missingConcepts, labels.fbMissing);
  if (options.unassigned) return labels.fbNoNumber;
  if (!response.trim()) return labels.fbEmpty;
  if (options.ocrReview) return result.ratio >= .38
    ? `${labels.fbPartialReview}${detail ? ` ${detail}` : ''}`
    : `${labels.fbNoConcepts}${detail ? ` ${detail}` : ''}`;
  if (result.ratio >= .72) return labels.fbFull;
  if (result.ratio >= .38) return `${labels.fbPartial}${detail ? ` ${detail}` : ''}`;
  if (result.uncertain) return `${labels.fbUncertain}${detail ? ` ${detail}` : ''}`;
  return `${labels.fbNoConcepts}${detail ? ` ${detail}` : ''}`;
}
