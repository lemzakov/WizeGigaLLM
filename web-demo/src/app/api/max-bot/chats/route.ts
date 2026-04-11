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

  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const url = new URL(`${MAX_API_BASE}/chats`);
    url.searchParams.set('count', '100');

    const res = await fetch(url.toString(), {
      headers: { Authorization: token },
      signal: controller.signal,
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
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: isTimeout ? 'Request timed out' : 'Failed to fetch chats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isTimeout ? 504 : 500 },
    );
  } finally {
    clearTimeout(fetchTimeout);
  }
}
