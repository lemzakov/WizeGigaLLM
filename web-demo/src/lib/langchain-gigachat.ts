/**
 * LangChain GigaChat Client Library
 * Uses langchain-gigachat package for GigaChat API integration
 */

import { GigaChat } from 'langchain-gigachat';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { Agent } from 'https';
import type { ChatRequest, ChatResponse } from '@/types/gigachat';

/**
 * Get configured GigaChat client using langchain-gigachat
 */
export function getLangChainGigaChatClient(): GigaChat {
  const clientId = process.env.GIGACHAT_CLIENT_ID;
  const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;
  const model = process.env.GIGACHAT_MODEL || 'GigaChat';
  const verifySSL = process.env.GIGACHAT_VERIFY_SSL_CERTS !== 'false';

  console.log('[LangChain GigaChat Debug] Initializing client...', {
    clientIdPresent: !!clientId,
    clientSecretPresent: !!clientSecret,
    model,
    verifySSL,
    timestamp: new Date().toISOString()
  });

  if (!clientId || !clientSecret) {
    throw new Error('GIGACHAT_CLIENT_ID and GIGACHAT_CLIENT_SECRET environment variables must be set');
  }

  // Encode credentials to Base64 for authorization
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  console.log('[LangChain GigaChat Debug] Credentials encoded:', {
    credentialsLength: credentials.length,
    timestamp: new Date().toISOString()
  });

  // Create HTTPS agent with SSL verification settings
  const httpsAgent = new Agent({
    rejectUnauthorized: verifySSL
  });

  console.log('[LangChain GigaChat Debug] Creating GigaChat instance:', {
    model,
    sslVerification: verifySSL,
    timestamp: new Date().toISOString()
  });

  // Initialize GigaChat with credentials
  const giga = new GigaChat({
    credentials,
    model,
    httpsAgent,
    temperature: 0.7,
    maxTokens: 1024,
  });

  console.log('[LangChain GigaChat Debug] GigaChat client initialized successfully');

  return giga;
}

/**
 * Send chat request using LangChain GigaChat
 */
export async function sendChatRequest(request: ChatRequest): Promise<ChatResponse> {
  console.log('[LangChain GigaChat Debug] Processing chat request:', {
    messageCount: request.messages.length,
    model: request.model,
    timestamp: new Date().toISOString()
  });

  try {
    const client = getLangChainGigaChatClient();

    // Convert messages to LangChain format
    const messages = request.messages.map(msg => {
      if (msg.role === 'system') {
        return new SystemMessage(msg.content);
      } else if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });

    console.log('[LangChain GigaChat Debug] Converted messages:', {
      count: messages.length,
      types: messages.map(m => m.constructor.name),
      timestamp: new Date().toISOString()
    });

    // Invoke the model
    console.log('[LangChain GigaChat Debug] Invoking GigaChat model...');
    const startTime = Date.now();
    
    const response = await client.invoke(messages);
    
    const duration = Date.now() - startTime;
    console.log('[LangChain GigaChat Debug] Response received:', {
      duration: `${duration}ms`,
      contentLength: typeof response.content === 'string' ? response.content.length : 0,
      responseType: typeof response.content,
      timestamp: new Date().toISOString()
    });

    // Convert response to our format
    const chatResponse: ChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
          },
          finish_reason: 'stop'
        }
      ],
      model: request.model || 'GigaChat',
      created: Math.floor(Date.now() / 1000),
      usage: {
        prompt_tokens: 0, // LangChain doesn't provide this by default
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    console.log('[LangChain GigaChat Debug] Chat request completed successfully');

    return chatResponse;
  } catch (error) {
    console.error('[LangChain GigaChat Error] Chat request failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    throw new Error(`Failed to process chat request: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test connection to GigaChat API
 */
export async function testConnection(): Promise<boolean> {
  console.log('[LangChain GigaChat Debug] Testing connection...');
  
  try {
    const client = getLangChainGigaChatClient();
    
    // Send a simple test message
    const testMessage = [new HumanMessage('Hello')];
    const response = await client.invoke(testMessage);
    
    console.log('[LangChain GigaChat Debug] Connection test successful:', {
      responseReceived: !!response,
      contentLength: typeof response.content === 'string' ? response.content.length : 0,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('[LangChain GigaChat Error] Connection test failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return false;
  }
}
