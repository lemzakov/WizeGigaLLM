/**
 * MAX Bot Test UI
 * Allows testing MAX Messenger bot features: view bot info, list subscribers,
 * manage webhook registrations, and send test messages.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BotInfo {
  user_id: number;
  name: string;
  username?: string;
  description?: string;
  avatar_url?: string;
  full_avatar_url?: string;
  commands?: { name: string; description: string }[];
  is_bot?: boolean;
}

interface Chat {
  chat_id: number;
  type: string;
  title?: string;
  description?: string;
  participants_count?: number;
  last_event_time?: number;
  owner_id?: number;
}

interface WebhookSubscription {
  url?: string;
  time?: number;
  update_types?: string[];
  version?: string;
}

interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`status ${ok ? 'success' : 'error'}`} style={{ marginTop: '12px' }}>
      <span className="status-dot" />
      {text}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// ─── Section: Bot Info ────────────────────────────────────────────────────────

function BotInfoSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<BotInfo> | null>(null);

  const load = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/max-bot/info');
      const data = await res.json();
      setResult(data.success ? { success: true, data: data.bot } : { success: false, error: data.error });
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const bot = result?.data;

  return (
    <Card title="🤖 Bot Info">
      <p style={{ marginBottom: '16px', color: '#555' }}>
        Retrieve current bot profile information from the MAX platform.
      </p>
      <button className="btn btn-primary" onClick={load} disabled={loading}>
        {loading ? <><div className="spinner" />Loading…</> : '🔍 Get Bot Info'}
      </button>

      {result && !result.success && <StatusBadge ok={false} text={result.error ?? 'Error'} />}

      {bot && (
        <div style={{ marginTop: '20px' }}>
          <table style={tableStyle}>
            <tbody>
              {bot.avatar_url && (
                <tr>
                  <td style={tdLabel}>Avatar</td>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bot.full_avatar_url ?? bot.avatar_url} alt="avatar" style={{ width: 64, height: 64, borderRadius: 8 }} />
                  </td>
                </tr>
              )}
              <tr><td style={tdLabel}>ID</td><td>{bot.user_id}</td></tr>
              <tr><td style={tdLabel}>Name</td><td>{bot.name}</td></tr>
              {bot.username && <tr><td style={tdLabel}>Username</td><td>@{bot.username}</td></tr>}
              {bot.description && <tr><td style={tdLabel}>Description</td><td style={{ whiteSpace: 'pre-wrap' }}>{bot.description}</td></tr>}
              {bot.commands && bot.commands.length > 0 && (
                <tr>
                  <td style={tdLabel}>Commands</td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {bot.commands.map((c) => (
                        <li key={c.name}><code>/{c.name}</code> — {c.description}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Section: Subscribers / Chats ────────────────────────────────────────────

function ChatsSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<Chat[]> | null>(null);

  const load = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/max-bot/chats');
      const data = await res.json();
      setResult(data.success ? { success: true, data: data.chats } : { success: false, error: data.error });
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const chats: Chat[] = result?.data ?? [];

  return (
    <Card title="👥 Subscribers / Chats">
      <p style={{ marginBottom: '16px', color: '#555' }}>
        List all chats the bot participates in (direct messages and group chats).
      </p>
      <button className="btn btn-primary" onClick={load} disabled={loading}>
        {loading ? <><div className="spinner" />Loading…</> : '📋 Load Chats'}
      </button>

      {result && !result.success && <StatusBadge ok={false} text={result.error ?? 'Error'} />}

      {result?.success && (
        <div style={{ marginTop: '20px' }}>
          {chats.length === 0 ? (
            <p style={{ color: '#666' }}>No chats found. The bot has no active conversations yet.</p>
          ) : (
            <>
              <p style={{ marginBottom: '12px', color: '#555' }}>
                Found <strong>{chats.length}</strong> chat{chats.length !== 1 ? 's' : ''}:
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...tableStyle, width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={thStyle}>Chat ID</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Members</th>
                      <th style={thStyle}>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chats.map((chat) => (
                      <tr key={chat.chat_id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={tdStyle}><code>{chat.chat_id}</code></td>
                        <td style={tdStyle}>
                          <span style={typeBadge(chat.type)}>{chat.type}</span>
                        </td>
                        <td style={tdStyle}>{chat.title ?? <em style={{ color: '#999' }}>Direct chat</em>}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{chat.participants_count ?? '—'}</td>
                        <td style={tdStyle}>
                          {chat.last_event_time
                            ? new Date(chat.last_event_time * 1000).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Section: Webhook Management ─────────────────────────────────────────────

function WebhookSection() {
  const [loadingGet, setLoadingGet] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [subscription, setSubscription] = useState<WebhookSubscription | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const clearMessage = () => setMessage(null);

  const getWebhook = useCallback(async () => {
    setLoadingGet(true);
    clearMessage();
    try {
      const res = await fetch('/api/max-bot/webhook');
      const data = await res.json();
      if (data.success) {
        const sub = data.subscriptions;
        setSubscription(Array.isArray(sub) ? sub[0] ?? null : sub ?? null);
        setMessage({ ok: true, text: 'Subscription info loaded.' });
      } else {
        setMessage({ ok: false, text: data.error ?? 'Failed to get webhook' });
      }
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setLoadingGet(false);
    }
  }, []);

  const registerWebhook = async () => {
    if (!webhookUrl.trim()) {
      setMessage({ ok: false, text: 'Please enter a webhook URL.' });
      return;
    }
    setLoadingPost(true);
    clearMessage();
    try {
      const res = await fetch('/api/max-bot/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ ok: true, text: `Webhook registered successfully!` });
        await getWebhook();
      } else {
        setMessage({ ok: false, text: data.error ?? 'Failed to register webhook' });
      }
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setLoadingPost(false);
    }
  };

  const deleteWebhook = async () => {
    setLoadingDelete(true);
    clearMessage();
    try {
      const res = await fetch('/api/max-bot/webhook', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSubscription(null);
        setMessage({ ok: true, text: 'Webhook removed successfully.' });
      } else {
        setMessage({ ok: false, text: data.error ?? 'Failed to delete webhook' });
      }
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <Card title="🔗 Webhook Management">
      <p style={{ marginBottom: '16px', color: '#555' }}>
        Register, view, or remove the bot&apos;s webhook subscription on the MAX platform.
        A webhook allows MAX to push updates to your HTTPS endpoint instead of long-polling.
      </p>

      {/* Current subscription */}
      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={getWebhook} disabled={loadingGet} style={{ marginRight: '10px' }}>
          {loadingGet ? <><div className="spinner" />Checking…</> : '🔎 Check Current Webhook'}
        </button>

        {subscription && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>Current webhook:</p>
            <table style={tableStyle}>
              <tbody>
                {subscription.url && <tr><td style={tdLabel}>URL</td><td style={{ wordBreak: 'break-all' }}>{subscription.url}</td></tr>}
                {subscription.version && <tr><td style={tdLabel}>Version</td><td>{subscription.version}</td></tr>}
                {subscription.time && <tr><td style={tdLabel}>Registered at</td><td>{new Date(subscription.time * 1000).toLocaleString()}</td></tr>}
                {subscription.update_types && (
                  <tr>
                    <td style={tdLabel}>Update types</td>
                    <td>{subscription.update_types.join(', ')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {subscription === null && !loadingGet && message?.ok && (
          <p style={{ marginTop: '12px', color: '#666' }}>No webhook registered. The bot is using long-polling.</p>
        )}
      </div>

      {/* Register webhook */}
      <div className="form-group">
        <label>Webhook URL</label>
        <input
          type="url"
          placeholder="https://your-server.example.com/bot/webhook"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
        <small>Must be a publicly accessible HTTPS URL that accepts POST requests from MAX.</small>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
        <button className="btn btn-primary" onClick={registerWebhook} disabled={loadingPost || !webhookUrl.trim()}>
          {loadingPost ? <><div className="spinner" />Registering…</> : '➕ Register Webhook'}
        </button>
        <button
          className="btn"
          style={{ background: '#dc3545', color: 'white' }}
          onClick={deleteWebhook}
          disabled={loadingDelete}
        >
          {loadingDelete ? <><div className="spinner" />Deleting…</> : '🗑️ Delete Webhook'}
        </button>
      </div>

      {message && <StatusBadge ok={message.ok} text={message.text} />}
    </Card>
  );
}

// ─── Section: Send Test Message ───────────────────────────────────────────────

function SendMessageSection() {
  const [chatId, setChatId] = useState('');
  const [text, setText] = useState('Hello from MAX Bot test UI! 👋');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    const id = Number(chatId.trim());
    if (!id || !text.trim()) {
      setResult({ ok: false, text: 'Chat ID and message text are required.' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/max-bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, text: `Message sent! Message ID: ${data.message?.mid ?? '—'}` });
      } else {
        setResult({ ok: false, text: data.error ?? 'Failed to send message' });
      }
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="📨 Send Test Message">
      <p style={{ marginBottom: '16px', color: '#555' }}>
        Send a test message to any chat where the bot is a participant.
        Use the <em>Subscribers / Chats</em> section above to find valid Chat IDs.
      </p>

      <div className="form-group">
        <label>Chat ID</label>
        <input
          type="number"
          placeholder="e.g. 123456789"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
        />
        <small>Numeric ID of the target chat or direct message.</small>
      </div>

      <div className="form-group">
        <label>Message Text</label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your test message…"
          style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '5px', fontSize: '1rem', resize: 'vertical' }}
        />
      </div>

      <button className="btn btn-primary" onClick={send} disabled={loading || !chatId || !text}>
        {loading ? <><div className="spinner" />Sending…</> : '🚀 Send Message'}
      </button>

      {result && <StatusBadge ok={result.ok} text={result.text} />}
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
};

const tdLabel: React.CSSProperties = {
  fontWeight: 600,
  paddingRight: '16px',
  paddingBottom: '8px',
  color: '#555',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#555',
  borderBottom: '2px solid #ddd',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  verticalAlign: 'middle',
};

function typeBadge(type: string): React.CSSProperties {
  const color = type === 'dialog' ? '#667eea' : '#764ba2';
  return {
    background: color,
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 500,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaxBotPage() {
  return (
    <>
      <div className="card">
        <h2>🤖 MAX Bot Test UI</h2>
        <p style={{ lineHeight: 1.7, color: '#555', marginBottom: '12px' }}>
          Test and manage your <strong>MAX Messenger bot</strong> powered by the{' '}
          <a href="https://dev.max.ru/" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
            MAX platform API
          </a>
          . Configure <code>MAX_BOT_TOKEN</code> in <code>.env.local</code> to get started.
        </p>
        <div style={{ padding: '12px 16px', background: '#fff3cd', borderRadius: '6px', color: '#856404' }}>
          <strong>⚠️ Prerequisites:</strong> Add <code>MAX_BOT_TOKEN=&lt;your token&gt;</code> to{' '}
          <code>web-demo/.env.local</code> and restart the dev server. Obtain a token from{' '}
          <a href="https://max.ru/masterbot" target="_blank" rel="noopener noreferrer" style={{ color: '#856404', textDecoration: 'underline' }}>
            @masterbot
          </a>{' '}
          in MAX Messenger.
        </div>
      </div>

      <BotInfoSection />
      <ChatsSection />
      <WebhookSection />
      <SendMessageSection />
    </>
  );
}
