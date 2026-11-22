export type ExamTimer = { elapsed: number; anchor: number; running: boolean };

export function startTimer(now = Date.now()): ExamTimer {
  return { elapsed: 0, anchor: now, running: true };
}

export function elapsedSeconds(timer: ExamTimer | undefined, now = Date.now()): number {
  if (!timer || timer.elapsed < 0) return 0;
  const live = timer.running ? Math.max(0, Math.floor((now - timer.anchor) / 1000)) : 0;
  return Math.max(0, timer.elapsed + live);
}

export function remainingSeconds(timer: ExamTimer | undefined, durationMinutes: number, now = Date.now()): number {
  return Math.max(0, Math.floor(durationMinutes * 60) - elapsedSeconds(timer, now));
}

export function pauseTimer(timer: ExamTimer | undefined, now = Date.now()): ExamTimer {
  return { elapsed: elapsedSeconds(timer, now), anchor: now, running: false };
}

export function resumeTimer(timer: ExamTimer | undefined, now = Date.now()): ExamTimer {
  return { elapsed: elapsedSeconds(timer, now), anchor: now, running: true };
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
