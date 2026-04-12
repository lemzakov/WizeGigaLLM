/**
 * MAX Messenger Bot powered by GigaChat AI
 *
 * Uses @maxhub/max-bot-api for MAX Messenger integration
 * and langchain-gigachat for AI responses via GigaChat.
 */

import { Bot } from '@maxhub/max-bot-api';
import { GigaChat } from 'langchain-gigachat';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { Agent } from 'https';

// ── Configuration ────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.MAX_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('[MAX Bot] MAX_BOT_TOKEN environment variable is required');
  process.exit(1);
}

const GIGACHAT_CREDENTIALS = process.env.GIGACHAT_CLIENT_SECRET;
if (!GIGACHAT_CREDENTIALS) {
  console.error('[MAX Bot] GIGACHAT_CLIENT_SECRET environment variable is required');
  process.exit(1);
}

const GIGACHAT_MODEL = process.env.GIGACHAT_MODEL || 'GigaChat';
const VERIFY_SSL = process.env.GIGACHAT_VERIFY_SSL_CERTS !== 'false';
const SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  'Ты полезный AI-ассистент на базе GigaChat. Отвечай кратко и по существу.';

// ── GigaChat client ──────────────────────────────────────────────────────────

// GIGACHAT_CLIENT_SECRET holds the Authorization Key from the Sber developer portal.
// This key is already a Base64-encoded string — pass it directly to GigaChat as
// `credentials`. Do NOT re-encode it; that would produce a double-encoded value the
// Sber OAuth endpoint cannot decode (error code 4: "Can't decode 'Authorization' header").
const httpsAgent = new Agent({ rejectUnauthorized: VERIFY_SSL });

const gigaChat = new GigaChat({
  credentials: GIGACHAT_CREDENTIALS,
  model: GIGACHAT_MODEL,
  httpsAgent,
  temperature: 0.7,
  maxTokens: 1024,
});

// Per-chat conversation history (in-memory, keyed by chat_id or user_id)
const conversationHistory = new Map<number, Array<HumanMessage | AIMessage>>();

// ── Subscriber tracking ──────────────────────────────────────────────────────

type SubscriberInfo = { name: string; username: string | null };

/** In-memory set of all users who have started chatting with the bot. */
const subscribers = new Map<number, SubscriberInfo>();

/** Record a user as a subscriber (idempotent). Logs on first encounter. */
function trackSubscriber(user: { user_id: number; name: string; username?: string | null } | null | undefined): void {
  if (!user) return;
  const isNew = !subscribers.has(user.user_id);
  subscribers.set(user.user_id, { name: user.name, username: user.username ?? null });
  if (isNew) {
    const handle = user.username ? ` (@${user.username})` : '';
    console.log(`[MAX Bot] New subscriber: ${user.name}${handle} — total subscribers: ${subscribers.size}`);
  }
}

/** Log all known subscribers to the console. */
function logAllSubscribers(): void {
  if (subscribers.size === 0) {
    console.log('[MAX Bot] No subscribers yet.');
    return;
  }
  console.log(`[MAX Bot] All subscribers (${subscribers.size}):`);
  for (const [userId, info] of subscribers) {
    const handle = info.username ? ` (@${info.username})` : '';
    console.log(`  • [${userId}] ${info.name}${handle}`);
  }
}

// ── Group-chat mention helpers ────────────────────────────────────────────────

type MentionMarkup = { type: string; user_id?: number | null; user_link?: string | null; from: number; length: number };

/**
 * Returns true if any markup element is a @mention of the bot.
 * Matches by user_id (preferred) or by username link (fallback).
 */
function isBotMentioned(
  markup: MentionMarkup[] | null | undefined,
  botId: number | undefined,
  botUsername?: string | null,
): boolean {
  if (!markup) return false;
  return markup.some((m) => {
    if (m.type !== 'user_mention') return false;
    if (botId !== undefined && m.user_id === botId) return true;
    if (botUsername && m.user_link) {
      return m.user_link.replace(/^@/, '').toLowerCase() === botUsername.toLowerCase();
    }
    return false;
  });
}

/**
 * Removes all @botname mention tokens from the message text using the
 * character positions from the markup, then trims whitespace.
 */
function stripBotMentions(
  text: string,
  markup: MentionMarkup[] | null | undefined,
  botId: number | undefined,
  botUsername?: string | null,
): string {
  if (!markup) return text.trim();
  const ranges = markup
    .filter((m) => {
      if (m.type !== 'user_mention') return false;
      if (botId !== undefined && m.user_id === botId) return true;
      if (botUsername && m.user_link) {
        return m.user_link.replace(/^@/, '').toLowerCase() === botUsername.toLowerCase();
      }
      return false;
    })
    .map((m) => ({ from: m.from, to: m.from + m.length }))
    .sort((a, b) => b.from - a.from); // right-to-left so earlier indices stay valid

  let result = text;
  for (const { from, to } of ranges) {
    result = result.slice(0, from) + result.slice(to);
  }
  return result.trim();
}

/**
 * Send a message to GigaChat and return the AI reply.
 * Maintains per-chat conversation history for multi-turn dialogue.
 * @param convKey - chat_id for group/channel chats; user_id for personal dialogs where chat_id is null.
 */
async function askGigaChat(convKey: number, userText: string): Promise<string> {
  const history = conversationHistory.get(convKey) ?? [];

  // Build the message list: system prompt + history + new user message
  const userMessage = new HumanMessage(userText);
  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...history,
    userMessage,
  ];

  const response = await gigaChat.invoke(messages);
  const replyText =
    typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

  // Update history (keep last 20 exchanges — 20 user + 20 assistant — to avoid token overflow)
  const updatedHistory = [...history, userMessage, new AIMessage(replyText)];
  const MAX_HISTORY_MESSAGES_COUNT = 40;
  conversationHistory.set(
    convKey,
    updatedHistory.length > MAX_HISTORY_MESSAGES_COUNT
      ? updatedHistory.slice(updatedHistory.length - MAX_HISTORY_MESSAGES_COUNT)
      : updatedHistory,
  );

  return replyText;
}

// ── Reply helper ─────────────────────────────────────────────────────────────

/**
 * Send a text reply in the correct context.
 * - For group/channel chats (chat_id is valid): uses ctx.reply().
 * - For personal chats where chat_id is null: falls back to sendMessageToUser().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendReply(ctx: any, text: string): Promise<void> {
  const chatId = ctx.chatId as number | null | undefined;
  if (chatId !== null && chatId !== undefined) {
    await ctx.reply(text);
  } else {
    const senderId = (ctx.user as { user_id?: number } | undefined)?.user_id;
    if (senderId !== undefined) {
      await ctx.api.sendMessageToUser(senderId, text);
    }
  }
}

// ── MAX Bot ──────────────────────────────────────────────────────────────────

const bot = new Bot(BOT_TOKEN);

// Register available bot commands
bot.api.setMyCommands([
  { name: 'start', description: 'Начать диалог с AI-ассистентом' },
  { name: 'help', description: 'Показать справку' },
  { name: 'reset', description: 'Сбросить историю диалога' },
]);

// /start — greeting
bot.command('start', async (ctx) => {
  trackSubscriber(ctx.message?.sender);
  const chatId = ctx.chatId;
  const senderId = ctx.message?.sender?.user_id;
  const convKey = chatId ?? senderId;
  if (convKey !== null && convKey !== undefined) {
    conversationHistory.delete(convKey);
  }
  return sendReply(
    ctx,
    'Привет! 👋 Я AI-ассистент на базе GigaChat.\n\n' +
    'Задайте мне любой вопрос, и я постараюсь помочь.\n\n' +
    'Команды:\n' +
    '/help — справка\n' +
    '/reset — сбросить историю диалога',
  );
});

// /help — usage information
bot.command('help', (ctx) =>
  sendReply(
    ctx,
    'ℹ️ *Как пользоваться ботом:*\n\n' +
    '• Просто напишите любой вопрос или сообщение\n' +
    '• Бот помнит контекст вашего диалога\n\n' +
    'Команды:\n' +
    '/start — начать новый диалог\n' +
    '/reset — очистить историю текущего диалога\n' +
    '/help — показать эту справку',
  ),
);

// /reset — clear conversation history for this chat
bot.command('reset', async (ctx) => {
  const chatId = ctx.chatId;
  const senderId = ctx.message?.sender?.user_id;
  const convKey = chatId ?? senderId;
  if (convKey !== null && convKey !== undefined) {
    conversationHistory.delete(convKey);
  }
  return sendReply(ctx, '🔄 История диалога очищена. Можем начать с чистого листа!');
});

// Handle all other text messages
bot.on('message_created', async (ctx) => {
  const msg = ctx.message;
  const text = msg?.body?.text;
  const chatId = ctx.chatId as number | null | undefined;
  const senderId = msg?.sender?.user_id;
  const chatType = msg?.recipient?.chat_type;

  // Need text and at least one way to identify / reach the sender
  if (!text || (chatId == null && senderId === undefined)) {
    return;
  }

  // Skip command messages already handled above
  if (text.startsWith('/')) {
    return;
  }

  // In group chats the bot should only respond when explicitly @mentioned.
  if (chatType === 'chat') {
    const markup = msg?.body?.markup as MentionMarkup[] | null | undefined;
    if (!isBotMentioned(markup, ctx.myId, ctx.botInfo?.username)) {
      return;
    }
    // Strip the @mention token(s) so GigaChat only sees the actual question.
    const strippedText = stripBotMentions(text, markup, ctx.myId, ctx.botInfo?.username);
    if (!strippedText) return;

    try {
      if (chatId !== null && chatId !== undefined) await ctx.sendAction('typing_on');
      const convKey = chatId ?? senderId!;
      const reply = await askGigaChat(convKey, strippedText);
      await sendReply(ctx, reply);
    } catch (error) {
      console.error('[MAX Bot] Error processing message:', error);
      await sendReply(ctx, '⚠️ Произошла ошибка при обработке вашего запроса. Попробуйте ещё раз.');
    }
    return;
  }

  // Personal (dialog) or channel message — respond to everything and track subscriber
  trackSubscriber(msg?.sender);
  const convKey = chatId ?? senderId!;

  try {
    if (chatId !== null && chatId !== undefined) await ctx.sendAction('typing_on');
    const reply = await askGigaChat(convKey, text);
    await sendReply(ctx, reply);
  } catch (error) {
    console.error('[MAX Bot] Error processing message:', error);
    await sendReply(ctx, '⚠️ Произошла ошибка при обработке вашего запроса. Попробуйте ещё раз.');
  }
});

// Greet the group when the bot is added to it
bot.on('bot_added', (ctx) => {
  const mention = ctx.botInfo?.username ? `@${ctx.botInfo.username}` : 'меня';
  return ctx.reply(
    '👋 Привет! Я AI-ассистент на базе GigaChat.\n\n' +
    `Чтобы задать мне вопрос в этой группе, просто упомяните меня (${mention}) ` +
    'в вашем сообщении.\n\n' +
    'Команды:\n' +
    '/help — справка\n' +
    '/reset — сбросить историю диалога',
  );
});

// Also greet user when they start a dialog via bot button
bot.on('bot_started', (ctx) => {
  trackSubscriber(ctx.user);
  const chatId = ctx.chatId;
  if (chatId !== undefined) {
    conversationHistory.delete(chatId);
  }
  return ctx.reply(
    'Привет! 👋 Я AI-ассистент на базе GigaChat.\n\n' +
    'Задайте мне любой вопрос, и я постараюсь помочь.\n\n' +
    'Команды:\n' +
    '/help — справка\n' +
    '/reset — сбросить историю диалога',
  );
});

// Global error handler — log the error and continue (do not crash the bot)
bot.catch((err, ctx) => {
  console.error('[MAX Bot] Unhandled error:', err);
  sendReply(ctx, '⚠️ Произошла непредвиденная ошибка. Попробуйте позже.').catch(() => {});
});

// ── Start ────────────────────────────────────────────────────────────────────

console.log(`[MAX Bot] Starting bot (model: ${GIGACHAT_MODEL})…`);
bot.start();
console.log('[MAX Bot] Bot is running and polling for updates.');
logAllSubscribers();
