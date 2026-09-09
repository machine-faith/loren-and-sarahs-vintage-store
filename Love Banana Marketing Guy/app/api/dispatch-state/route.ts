import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { evaluateStageAdvancement, calculateBounceRate } from '@/lib/dispatch-state';

export async function GET() {
  try {
    const store = getStore();
    const rawState = store.getDispatchState();
    const state = evaluateStageAdvancement(rawState);
    store.updateDispatchState(state);

    const bounceRate = calculateBounceRate(state);

    return NextResponse.json({
      success: true,
      state,
      bounceRate: Number(bounceRate.toFixed(2)),
      dailyRemaining: Math.max(0, state.daily_cap - state.sent_today)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();
    const current = store.getDispatchState();

    // Allow manual unlock/resume or stage adjustments
    const updates: any = {};
    if (body.status && ['healthy', 'paused', 'frozen'].includes(body.status)) {
      updates.status = body.status;
    }
    if (typeof body.daily_cap === 'number' && body.daily_cap > 0) {
      updates.daily_cap = body.daily_cap;
    }
    if (typeof body.current_stage === 'number' && [1, 2, 3, 4].includes(body.current_stage)) {
      updates.current_stage = body.current_stage;
    }

    const updated = store.updateDispatchState(updates);

    return NextResponse.json({
      success: true,
      state: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
