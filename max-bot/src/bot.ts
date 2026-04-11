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

// Per-chat conversation history (in-memory, keyed by chat_id)
const conversationHistory = new Map<number, Array<HumanMessage | AIMessage>>();

/**
 * Send a message to GigaChat and return the AI reply.
 * Maintains per-chat conversation history for multi-turn dialogue.
 */
async function askGigaChat(chatId: number, userText: string): Promise<string> {
  const history = conversationHistory.get(chatId) ?? [];

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
    chatId,
    updatedHistory.length > MAX_HISTORY_MESSAGES_COUNT
      ? updatedHistory.slice(updatedHistory.length - MAX_HISTORY_MESSAGES_COUNT)
      : updatedHistory,
  );

  return replyText;
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
bot.command('start', (ctx) => {
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

// /help — usage information
bot.command('help', (ctx) =>
  ctx.reply(
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
bot.command('reset', (ctx) => {
  const chatId = ctx.chatId;
  if (chatId !== undefined) {
    conversationHistory.delete(chatId);
  }
  return ctx.reply('🔄 История диалога очищена. Можем начать с чистого листа!');
});

// Handle all other text messages
bot.on('message_created', async (ctx) => {
  const text = ctx.message?.body?.text;
  const chatId = ctx.chatId;

  if (!text || chatId === undefined) {
    return;
  }

  // Skip command messages already handled above
  if (text.startsWith('/')) {
    return;
  }

  try {
    // Show "typing…" indicator while processing
    await ctx.sendAction('typing_on');

    const reply = await askGigaChat(chatId, text);
    await ctx.reply(reply);
  } catch (error) {
    console.error('[MAX Bot] Error processing message:', error);
    await ctx.reply(
      '⚠️ Произошла ошибка при обработке вашего запроса. Попробуйте ещё раз.',
    );
  }
});

// Also greet user when they start a dialog via bot button
bot.on('bot_started', (ctx) => {
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
  ctx?.reply('⚠️ Произошла непредвиденная ошибка. Попробуйте позже.').catch(() => {});
});

// ── Start ────────────────────────────────────────────────────────────────────

console.log(`[MAX Bot] Starting bot (model: ${GIGACHAT_MODEL})…`);
bot.start();
console.log('[MAX Bot] Bot is running and polling for updates.');
