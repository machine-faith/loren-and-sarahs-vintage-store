import { DispatchState } from './db';

export function calculateBounceRate(state: DispatchState): number {
  if (!state.sent_total || state.sent_total === 0) return 0;
  return (state.bounced_total / state.sent_total) * 100;
}

export function evaluateStageAdvancement(state: DispatchState): DispatchState {
  const today = new Date().toISOString().split('T')[0];

  // Auto reset daily counter if calendar day rolled over
  if (state.sent_today_date !== today) {
    state.sent_today = 0;
    state.sent_today_date = today;
    state.bounced_today = 0;
  }

  const bounceRate = calculateBounceRate(state);

  // Health check: If bounce rate > 2% after at least 10 sends, freeze sending
  if (state.sent_total >= 10 && bounceRate > 2.0) {
    state.status = 'frozen';
    return state;
  }

  // Calculate days elapsed in current stage
  const startDate = new Date(state.stage_start_date);
  const now = new Date(today);
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Check advancement per stage
  if (state.current_stage === 1) {
    state.daily_cap = 25;
    if (elapsedDays >= 3 && bounceRate < 2.0) {
      state.current_stage = 2;
      state.daily_cap = 60;
      state.stage_start_date = today;
    }
  } else if (state.current_stage === 2) {
    state.daily_cap = 60;
    if (elapsedDays >= 4 && bounceRate < 2.0) {
      state.current_stage = 3;
      state.daily_cap = 120;
      state.stage_start_date = today;
    }
  } else if (state.current_stage === 3) {
    state.daily_cap = 120;
    if (elapsedDays >= 7 && bounceRate < 2.0) {
      state.current_stage = 4;
      state.daily_cap = 200;
      state.stage_start_date = today;
    }
  } else if (state.current_stage === 4) {
    state.daily_cap = 200;
  }

  return state;
}

export function getDailyCapRemaining(state: DispatchState): number {
  const evaluated = evaluateStageAdvancement(state);
  if (evaluated.status !== 'healthy') return 0;
  return Math.max(0, evaluated.daily_cap - evaluated.sent_today);
}
