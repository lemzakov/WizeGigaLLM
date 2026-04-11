# WizeGigaLLM — MAX Messenger Bot

A simple AI assistant available via [MAX Messenger](https://max.ru) powered by [GigaChat](https://developers.sber.ru/portal/products/gigachat).

## Features

- 🤖 AI assistant based on GigaChat LLM
- 💬 Multi-turn conversation with per-chat history
- 🔄 `/reset` command to clear conversation history
- ❓ `/help` command with usage information
- ⌨️ Typing indicator while processing
- 🛡️ Graceful error handling

## Prerequisites

- Node.js ≥ 18
- A MAX Messenger bot token (get one from [@masterbot](https://max.ru/masterbot))
- GigaChat API credentials ([quickstart guide](https://developers.sber.ru/docs/ru/gigachat/individuals-quickstart))

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

```sh
cp .env.example .env
```

Edit `.env` and fill in your credentials:

| Variable | Description | Required |
|---|---|---|
| `MAX_BOT_TOKEN` | Your MAX bot token from @masterbot | ✅ |
| `GIGACHAT_CLIENT_ID` | GigaChat Client ID (UUID) | ✅ |
| `GIGACHAT_CLIENT_SECRET` | GigaChat Client Secret (Authorization Key) | ✅ |
| `GIGACHAT_MODEL` | Model to use: `GigaChat`, `GigaChat-Pro`, `GigaChat-Max` | optional |
| `GIGACHAT_VERIFY_SSL_CERTS` | Set to `false` to skip SSL verification (required for GigaChat API) | optional |
| `SYSTEM_PROMPT` | Custom system prompt to set the assistant's behaviour | optional |

### 3. Run the bot

**Development (with hot-reload):**
```sh
npm run dev
```

**Production (compiled):**
```sh
npm run build
npm run start:compiled
```

**Production (directly):**
```sh
npm start
```

## Architecture

The bot uses **long-polling** to receive updates from MAX Messenger — no public HTTPS endpoint is required.

```
User (MAX Messenger)
       │
       ▼  long-polling
 @maxhub/max-bot-api
       │
       ▼  text messages
   src/bot.ts
       │
       ▼  LangChain messages
 langchain-gigachat  ──►  GigaChat API
       │
       ▼  AI reply
 @maxhub/max-bot-api
       │
       ▼
User (MAX Messenger)
```

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Start a new conversation |
| `/help` | Show usage instructions |
| `/reset` | Clear current conversation history |

## Deployment

The bot is a simple Node.js process — it can be deployed anywhere Node.js runs:

- **VPS / server**: run with `pm2` for automatic restarts
  ```sh
  pm2 start "npm run start:compiled" --name max-bot
  ```
- **Docker**: wrap in a minimal `node:18-alpine` image
- **Cloud Functions / serverless**: not recommended because long-polling requires a persistent process

## Obtaining a MAX Bot Token

1. Open MAX Messenger and search for **@masterbot**
2. Send `/start` and follow the instructions
3. Create a new bot — @masterbot will send you a token
4. Copy the token into `MAX_BOT_TOKEN` in your `.env` file
