/**
 * API Route: /api/max-bot/webhook
 * Proxies GET /subscriptions, POST /subscriptions, and DELETE /subscriptions
 * from the MAX platform API to manage webhook registrations.
 */

import { NextRequest, NextResponse } from 'next/server';

const MAX_API_BASE = 'https://platform-api.max.ru';

function tokenResponse() {
  return NextResponse.json(
    { error: 'MAX_BOT_TOKEN is not configured' },
    { status: 503 },
  );
}

/** GET /api/max-bot/webhook — retrieve current webhook subscription */
export async function GET() {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return tokenResponse();

  try {
    const res = await fetch(`${MAX_API_BASE}/subscriptions`, {
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? 'MAX API error', details: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, subscriptions: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get webhook subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/** POST /api/max-bot/webhook — register a new webhook */
export async function POST(request: NextRequest) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return tokenResponse();

  let body: { url: string; version?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  try {
    const payload: Record<string, unknown> = { url: body.url };
    if (body.version !== undefined) {
      payload.version = body.version;
    }

    const res = await fetch(`${MAX_API_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? 'MAX API error', details: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to register webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/** DELETE /api/max-bot/webhook — remove the current webhook subscription */
export async function DELETE() {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return tokenResponse();

  try {
    const res = await fetch(`${MAX_API_BASE}/subscriptions`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? 'MAX API error', details: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to delete webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
