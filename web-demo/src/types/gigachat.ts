/**
 * Type definitions for GigaChat API integration
 */

export interface GigaChatConfig {
  credentials: string;
  baseUrl: string;
  verifySSL: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  choices: Array<{
    message: Message;
    finish_reason: string;
  }>;
  created: number;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AuthResponse {
  access_token: string;
  expires_at: number;
}
