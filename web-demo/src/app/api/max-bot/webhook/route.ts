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

/**
 * DELETE /api/max-bot/webhook — remove all webhook subscriptions.
 *
 * The strategy:
 *   1. Fetch the current subscription list.
 *   2. For every subscription that has a URL, issue a targeted
 *      DELETE /subscriptions?url=<url> so each one is removed individually.
 *   3. If no subscriptions were found (or none had a URL), fall back to a
 *      plain DELETE /subscriptions which removes any remaining entry.
 *
 * This handles the cases where (a) the response body is empty/non-JSON and
 * (b) there are multiple subscriptions that need to be cleaned up.
 */
export async function DELETE(request: NextRequest) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return tokenResponse();

  // ── helper: safe fetch-then-parse ────────────────────────────────────────
  async function doDelete(url: string): Promise<{ ok: boolean; status: number; data: unknown }> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25_000);
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: token! },
        signal: ctrl.signal,
      });
      // DELETE may return 200 with JSON, 204 with no body, etc.
      const text = await res.text();
      let data: unknown = null;
      if (text.trim()) {
        try { data = JSON.parse(text); } catch { data = text; }
      }
      return { ok: res.ok, status: res.status, data };
    } finally {
      clearTimeout(t);
    }
  }

  try {
    // Step 1: get the list of current subscriptions
    const listCtrl = new AbortController();
    const listTimeout = setTimeout(() => listCtrl.abort(), 25_000);
    let subscriptions: Array<{ url?: string }> = [];
    try {
      const listRes = await fetch(`${MAX_API_BASE}/subscriptions`, {
        headers: { Authorization: token },
        signal: listCtrl.signal,
      });
      if (listRes.ok) {
        const listData = await listRes.json() as { subscriptions?: Array<{ url?: string }> };
        if (Array.isArray(listData?.subscriptions)) {
          subscriptions = listData.subscriptions;
        } else if (Array.isArray(listData)) {
          subscriptions = listData as Array<{ url?: string }>;
        }
      }
    } catch {
      // ignore — fall through to the plain bulk-delete below
    } finally {
      clearTimeout(listTimeout);
    }

    const urlsToDelete = subscriptions.map((s) => s.url).filter(Boolean) as string[];

    if (urlsToDelete.length > 0) {
      // Step 2: delete each subscription by its URL
      const results = await Promise.all(
        urlsToDelete.map((subUrl) =>
          doDelete(`${MAX_API_BASE}/subscriptions?url=${encodeURIComponent(subUrl)}`),
        ),
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        return NextResponse.json(
          { error: `Failed to delete ${failed.length} subscription(s)`, details: failed },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true, deleted: urlsToDelete.length });
    }

    // Step 3: fallback — plain bulk delete (handles empty-body 200/204 responses)
    const { ok, status, data } = await doDelete(`${MAX_API_BASE}/subscriptions`);
    if (!ok) {
      const msg = (data as Record<string, string> | null)?.message ?? 'MAX API error';
      return NextResponse.json({ error: msg, details: data }, { status });
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
  }
}
