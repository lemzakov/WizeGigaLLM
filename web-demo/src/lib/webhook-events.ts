/**
 * Webhook event broadcaster for live-debug Server-Sent Events.
 *
 * When the MAX webhook receiver processes an update (incoming message,
 * GigaChat reply, error) it calls `broadcast()` here.  All SSE clients
 * connected via GET /api/max-bot/events will receive the event in real-time.
 *
 * Note: subscribers are stored in module-level memory, so they are
 * per-process.  In serverless environments (Vercel) every function
 * invocation is isolated — for local dev and single-instance deploys
 * this works perfectly for live debugging.
 */

export type WebhookEventType =
  | 'connected'
  | 'incoming_update'
  | 'gigachat_response'
  | 'bot_error';

export interface WebhookEvent {
  type: WebhookEventType;
  timestamp: number;
  chatId?: number;
  data: unknown;
}

type Subscriber = (event: WebhookEvent) => void;

const subscribers = new Set<Subscriber>();

/** Subscribe to broadcast events.  Returns an unsubscribe function. */
export function subscribe(cb: Subscriber): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/** Broadcast an event to all currently connected SSE clients. */
export function broadcast(event: WebhookEvent): void {
  for (const cb of subscribers) {
    try {
      cb(event);
    } catch {
      // If the subscriber throws, remove it to prevent future errors.
      subscribers.delete(cb);
    }
  }
}
