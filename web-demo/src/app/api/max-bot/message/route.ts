/**
 * API Route: /api/max-bot/message
 * Proxies POST /messages to the MAX platform API to send a test message.
 */

import { NextRequest, NextResponse } from 'next/server';

const MAX_API_BASE = 'https://platform-api.max.ru';

export async function POST(request: NextRequest) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'MAX_BOT_TOKEN is not configured' },
      { status: 503 },
    );
  }

  let body: { chat_id: number; text: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.chat_id || !body.text) {
    return NextResponse.json(
      { error: 'chat_id and text are required' },
      { status: 400 },
    );
  }

  try {
    const url = new URL(`${MAX_API_BASE}/messages`);
    url.searchParams.set('chat_id', String(body.chat_id));

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: body.text }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? 'MAX API error', details: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
