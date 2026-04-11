/**
 * API Route: GET /api/max-bot/events
 *
 * Server-Sent Events (SSE) stream that pushes live webhook debug events to
 * connected clients.  Events are emitted whenever the MAX webhook receiver
 * processes an incoming update or receives a GigaChat reply.
 *
 * Clients connect once and receive a continuous stream of JSON-encoded
 * WebhookEvent objects until they close the connection or the server shuts
 * down.  A heartbeat comment is sent every 30 seconds to keep the connection
 * alive through proxies and load-balancers.
 */

import { subscribe, type WebhookEvent } from '@/lib/webhook-events';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  let unsubscribeFn: (() => void) | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Immediately send a "connected" confirmation so the client knows the
      // stream is live before any real events arrive.
      const connected: WebhookEvent = {
        type: 'connected',
        timestamp: Date.now(),
        data: { message: 'Live debug stream connected.' },
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connected)}\n\n`));

      // Push events received from the broadcaster.
      unsubscribeFn = subscribe((event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Enqueue failed — the stream is likely closed; clean up.
          cleanup();
        }
      });

      // Heartbeat: keep the TCP connection and browser EventSource alive.
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cleanup();
        }
      }, 30_000);

      function cleanup() {
        if (unsubscribeFn) { unsubscribeFn(); unsubscribeFn = null; }
        if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      }
    },

    cancel() {
      // Called when the client closes the connection.
      if (unsubscribeFn) { unsubscribeFn(); unsubscribeFn = null; }
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering
    },
  });
}
