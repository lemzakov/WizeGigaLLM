/**
 * Shared MAX bot instance used by the webhook receiver.
 * Registers the same command handlers and GigaChat integration
 * as the standalone max-bot, but works inside Next.js API routes.
 *
 * NOTE: Because Next.js serverless functions may be recycled between
 * invocations, conversationHistory is in-process memory only.
 * History will not persist across cold starts or multiple instances.
 */

import { Bot } from '@maxhub/max-bot-api';
import { GigaChat } from 'langchain-gigachat';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { Agent } from 'https';

// Per-chat conversation history (in-memory)
const conversationHistory = new Map<number, Array<HumanMessage | AIMessage>>();

const MAX_HISTORY_MESSAGES_COUNT = 40;

async function askGigaChat(
  gigaChat: GigaChat,
  systemPrompt: string,
  chatId: number,
  userText: string,
): Promise<string> {
  const history = conversationHistory.get(chatId) ?? [];
  const userMessage = new HumanMessage(userText);
  const messages = [new SystemMessage(systemPrompt), ...history, userMessage];

  const response = await gigaChat.invoke(messages);
  const replyText =
    typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

  const updatedHistory = [...history, userMessage, new AIMessage(replyText)];
  conversationHistory.set(
    chatId,
    updatedHistory.length > MAX_HISTORY_MESSAGES_COUNT
      ? updatedHistory.slice(updatedHistory.length - MAX_HISTORY_MESSAGES_COUNT)
      : updatedHistory,
  );

  return replyText;
}

let botInstance: Bot | null = null;

/**
 * Returns a lazily-initialised Bot instance.
 * Returns null if required environment variables are not set.
 */
export function getBot(): Bot | null {
  if (botInstance) return botInstance;

  const token = process.env.MAX_BOT_TOKEN;
  const credentials = process.env.GIGACHAT_CLIENT_SECRET;

  if (!token || !credentials) return null;

  const gigaChatModel = process.env.GIGACHAT_MODEL ?? 'GigaChat';
  const verifySsl = process.env.GIGACHAT_VERIFY_SSL_CERTS !== 'false';
  const systemPrompt =
    process.env.SYSTEM_PROMPT ??
    'Ты полезный AI-ассистент на базе GigaChat. Отвечай кратко и по существу.';

  const httpsAgent = new Agent({ rejectUnauthorized: verifySsl });
  const gigaChat = new GigaChat({
    credentials,
    model: gigaChatModel,
    httpsAgent,
    temperature: 0.7,
    maxTokens: 1024,
  });

  const bot = new Bot(token);

  bot.command('start', (ctx) => {
    const chatId = ctx.chatId;
    if (chatId !== undefined) conversationHistory.delete(chatId);
    return ctx.reply(
      'Привет! 👋 Я AI-ассистент на базе GigaChat.\n\n' +
        'Задайте мне любой вопрос, и я постараюсь помочь.\n\n' +
        'Команды:\n' +
        '/help — справка\n' +
        '/reset — сбросить историю диалога',
    );
  });

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

  bot.command('reset', (ctx) => {
    const chatId = ctx.chatId;
    if (chatId !== undefined) conversationHistory.delete(chatId);
    return ctx.reply('🔄 История диалога очищена. Можем начать с чистого листа!');
  });

  bot.on('bot_started', (ctx) => {
    const chatId = ctx.chatId;
    if (chatId !== undefined) conversationHistory.delete(chatId);
    return ctx.reply(
      'Привет! 👋 Я AI-ассистент на базе GigaChat.\n\n' +
        'Задайте мне любой вопрос, и я постараюсь помочь.\n\n' +
        'Команды:\n' +
        '/help — справка\n' +
        '/reset — сбросить историю диалога',
    );
  });

  bot.on('message_created', async (ctx) => {
    const text = ctx.message?.body?.text;
    const chatId = ctx.chatId;

    if (!text || chatId === undefined) return;
    if (text.startsWith('/')) return;

    try {
      await ctx.sendAction('typing_on');
      const reply = await askGigaChat(gigaChat, systemPrompt, chatId, text);
      await ctx.reply(reply);
    } catch (error) {
      console.error('[MAX Bot Webhook] Error processing message:', error);
      await ctx.reply('⚠️ Произошла ошибка при обработке вашего запроса. Попробуйте ещё раз.');
    }
  });

  bot.catch((err, ctx) => {
    console.error('[MAX Bot Webhook] Unhandled error:', err);
    ctx?.reply('⚠️ Произошла непредвиденная ошибка. Попробуйте позже.').catch(() => {});
  });

  botInstance = bot;
  return bot;
}
