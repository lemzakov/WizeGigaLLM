/**
 * API Route: /api/max-bot/chats
 * Proxies GET /chats from the MAX platform API to list all chats (subscribers).
 */

import { NextResponse } from 'next/server';

const MAX_API_BASE = 'https://platform-api.max.ru';

export async function GET() {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'MAX_BOT_TOKEN is not configured' },
      { status: 503 },
    );
  }

  try {
    const url = new URL(`${MAX_API_BASE}/chats`);
    url.searchParams.set('count', '100');

    const res = await fetch(url.toString(), {
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? 'MAX API error', details: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, chats: data.chats ?? [], marker: data.marker });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch chats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
