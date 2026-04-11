/**
 * API Route: /api/max-bot/info
 * Proxies GET /me from the MAX platform API to return bot information.
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
    const res = await fetch(`${MAX_API_BASE}/me`, {
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

    return NextResponse.json({ success: true, bot: data });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: isTimeout ? 'Request timed out' : 'Failed to fetch bot info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isTimeout ? 504 : 500 },
    );
  } finally {
    clearTimeout(fetchTimeout);
  }
}
