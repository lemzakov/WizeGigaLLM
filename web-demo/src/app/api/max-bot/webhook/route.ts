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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(`${MAX_API_BASE}/subscriptions`, {
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

    // The MAX API returns { subscriptions: [...] }; extract the array so the
    // client always receives a flat list rather than a nested response object.
    const subscriptions: unknown[] = Array.isArray(data?.subscriptions)
      ? data.subscriptions
      : Array.isArray(data)
        ? data
        : [];

    return NextResponse.json({ success: true, subscriptions });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: isTimeout ? 'Request timed out' : 'Failed to get webhook subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isTimeout ? 504 : 500 },
    );
  } finally {
    clearTimeout(timeout);
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    let res: Response;
    try {
      res = await fetch(`${MAX_API_BASE}/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? 'MAX API error', details: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: isTimeout ? 'Request timed out' : 'Failed to register webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}

/** DELETE /api/max-bot/webhook — remove the current webhook subscription */
export async function DELETE() {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return tokenResponse();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(`${MAX_API_BASE}/subscriptions`, {
      method: 'DELETE',
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

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: isTimeout ? 'Request timed out' : 'Failed to delete webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isTimeout ? 504 : 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
