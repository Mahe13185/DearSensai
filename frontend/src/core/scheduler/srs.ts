import { Rating, ReviewSchedule, ScheduleState } from '../types';

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

export interface SchedulingResult {
  schedule: ReviewSchedule;
  nextIntervalLabel: string;
  isLapse: boolean;
}

export function createInitialSchedule(revisionItemId: string): ReviewSchedule {
  return {
    id: revisionItemId,
    revisionItemId,
    state: 'NEW',
    reps: 0,
    lapses: 0,
    intervalDays: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    nextReviewDate: Date.now(),
    updatedAt: Date.now(),
  };
}

export function calculateNextSchedule(
  current: ReviewSchedule,
  rating: Rating
): SchedulingResult {
  const now = Date.now();
  let reps = current.reps;
  let lapses = current.lapses;
  let easeFactor = current.easeFactor || DEFAULT_EASE_FACTOR;
  let intervalDays = current.intervalDays;
  let state: ScheduleState = current.state;
  let isLapse = false;
  let nextReviewDate = now;
  let nextIntervalLabel = '';

  switch (rating) {
    case 'AGAIN': {
      reps = 0;
      lapses += 1;
      isLapse = true;
      state = current.state === 'NEW' ? 'LEARNING' : 'RELEARNING';
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      intervalDays = 0;
      nextReviewDate = now + TEN_MINUTES_MS;
      nextIntervalLabel = '< 10m';
      break;
    }

    case 'HARD': {
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
      if (reps === 0) {
        intervalDays = 1;
        state = 'LEARNING';
      } else {
        intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
        state = 'REVIEW';
      }
      nextReviewDate = now + intervalDays * ONE_DAY_MS;
      nextIntervalLabel = `${intervalDays}d`;
      break;
    }

    case 'GOOD': {
      reps += 1;
      if (reps === 1) {
        intervalDays = 1;
        state = 'LEARNING';
      } else if (reps === 2) {
        intervalDays = 3;
        state = 'REVIEW';
      } else {
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
        state = 'REVIEW';
      }
      nextReviewDate = now + intervalDays * ONE_DAY_MS;
      nextIntervalLabel = `${intervalDays}d`;
      break;
    }

    case 'EASY': {
      reps += 1;
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      if (reps === 1) {
        intervalDays = 3;
        state = 'REVIEW';
      } else {
        intervalDays = Math.max(3, Math.round(intervalDays * easeFactor * 1.3));
        state = 'REVIEW';
      }
      nextReviewDate = now + intervalDays * ONE_DAY_MS;
      nextIntervalLabel = `${intervalDays}d`;
      break;
    }
  }

  const updatedSchedule: ReviewSchedule = {
    ...current,
    state,
    reps,
    lapses,
    intervalDays,
    easeFactor,
    nextReviewDate,
    lastReviewDate: now,
    updatedAt: now,
  };

  return {
    schedule: updatedSchedule,
    nextIntervalLabel,
    isLapse,
  };
}

export function getIntervalPreviews(schedule: ReviewSchedule): Record<Rating, string> {
  const again = calculateNextSchedule(schedule, 'AGAIN');
  const hard = calculateNextSchedule(schedule, 'HARD');
  const good = calculateNextSchedule(schedule, 'GOOD');
  const easy = calculateNextSchedule(schedule, 'EASY');

  return {
    AGAIN: again.nextIntervalLabel,
    HARD: hard.nextIntervalLabel,
    GOOD: good.nextIntervalLabel,
    EASY: easy.nextIntervalLabel,
  };
}
