/**
 * GigaAPI Client Library
 * Handles authentication and communication with GigaChat API
 */

import type { GigaChatConfig, ChatRequest, ChatResponse, AuthResponse } from '@/types/gigachat';

class GigaAPIClient {
  private config: GigaChatConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: GigaChatConfig) {
    this.config = {
      model: 'GigaChat',
      temperature: 0.7,
      maxTokens: 1024,
      ...config,
    };
  }

  /**
   * Get access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    // Get new token
    const authUrl = `${this.config.baseUrl.replace('/v1', '')}/api/v2/oauth`;
    
    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${this.config.credentials}`,
          'RqUID': this.generateRqUID(),
        },
        body: 'scope=GIGACHAT_API_PERS',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: AuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = data.expires_at;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to authenticate:', error);
      throw new Error(`Failed to authenticate with GigaChat API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRqUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Send a chat completion request
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const token = await this.getAccessToken();
    const chatUrl = `${this.config.baseUrl}/chat/completions`;

    const requestBody = {
      model: request.model || this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.max_tokens ?? this.config.maxTokens,
      stream: request.stream ?? false,
    };

    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Chat request failed:', error);
      throw new Error(`Failed to send chat request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to GigaChat API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get an access token
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      verifySSL: this.config.verifySSL,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    };
  }
}

// Singleton instance
let clientInstance: GigaAPIClient | null = null;

/**
 * Get or create GigaAPI client instance
 */
export function getGigaAPIClient(): GigaAPIClient {
  if (!clientInstance) {
    const credentials = process.env.GIGACHAT_CREDENTIALS;
    const baseUrl = process.env.GIGACHAT_BASE_URL || 'https://gigachat.devices.sberbank.ru/api/v1';
    const verifySSL = process.env.GIGACHAT_VERIFY_SSL_CERTS !== 'false';

    if (!credentials) {
      throw new Error('GIGACHAT_CREDENTIALS environment variable is not set');
    }

    clientInstance = new GigaAPIClient({
      credentials,
      baseUrl,
      verifySSL,
    });
  }

  return clientInstance;
}

export default GigaAPIClient;
