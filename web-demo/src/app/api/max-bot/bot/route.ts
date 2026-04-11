/**
 * API Route: POST /api/max-bot/bot
 *
 * Incoming webhook endpoint for the MAX platform.
 * Register this URL (e.g. https://your-deployment.vercel.app/api/max-bot/bot)
 * as the webhook URL in the MAX platform to receive bot update events.
 *
 * MAX will POST a JSON update object to this endpoint whenever a subscribed
 * event occurs (message, bot_started, etc.).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBot } from '@/lib/max-bot-instance';

export async function POST(request: NextRequest) {
  const bot = getBot();

  if (!bot) {
    return NextResponse.json(
      { error: 'Bot is not configured. MAX_BOT_TOKEN and GIGACHAT_CLIENT_SECRET are required.' },
      { status: 503 },
    );
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // Process the update without awaiting so MAX gets a 200 acknowledgement immediately.
    // handleUpdate is typed as private but is a public arrow-function property at runtime.
    const updatePromise = (
      bot as unknown as { handleUpdate: (u: unknown) => Promise<void> }
    ).handleUpdate(update);

    // Attach a rejection handler so unhandled-promise-rejection is never triggered.
    updatePromise.catch((error: unknown) => {
      console.error('[MAX Bot Webhook] Failed to process update:', error);
    });
  } catch (error) {
    console.error('[MAX Bot Webhook] Failed to dispatch update:', error);
  }

  // MAX requires a 200 OK response to confirm the webhook was received.
  return NextResponse.json({ ok: true });
}
