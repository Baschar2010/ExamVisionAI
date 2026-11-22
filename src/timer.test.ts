import test from 'node:test';
import assert from 'node:assert/strict';
import { elapsedSeconds, formatClock, pauseTimer, remainingSeconds, resumeTimer, startTimer } from './timer.ts';

test('exam timer counts down continuously from its anchor', () => {
  const timer = startTimer(1_000);
  assert.equal(elapsedSeconds(timer, 61_000), 60);
  assert.equal(remainingSeconds(timer, 2, 61_000), 60);
  assert.equal(formatClock(60), '1:00');
  assert.equal(formatClock(65), '1:05');
});

test('pause freezes elapsed time and resume continues from the same value', () => {
  const started = startTimer(0);
  const paused = pauseTimer(started, 30_000);
  assert.equal(elapsedSeconds(paused, 3_600_000), 30);
  const resumed = resumeTimer(paused, 3_600_000);
  assert.equal(elapsedSeconds(resumed, 3_631_000), 61);
});

test('missing or reloaded timers never report negative time', () => {
  assert.equal(elapsedSeconds(undefined, 1_000), 0);
  assert.equal(remainingSeconds({ elapsed: 10, anchor: 1_000, running: true }, 1, 500), 50);
  assert.equal(formatClock(-5), '0:00');
});
