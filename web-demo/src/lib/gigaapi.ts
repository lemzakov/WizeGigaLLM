/**
 * GigaAPI Client Library
 * Handles authentication and communication with GigaChat API
 */

import type { GigaChatConfig, ChatRequest, ChatResponse, AuthResponse } from '@/types/gigachat';

class GigaAPIClient {
  private static readonly TOKEN_EXPIRY_BUFFER_MS = 60000; // 60 seconds buffer before token expiry
  
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
   * Encode credentials to Base64 for Basic Authentication
   */
  private encodeCredentials(clientId: string, clientSecret: string): string {
    const credentials = `${clientId}:${clientSecret}`;
    console.log('[GigaAPI Auth Debug] Encoding credentials:', {
      clientIdLength: clientId.length,
      clientIdPrefix: clientId.substring(0, 8) + '...',
      clientSecretLength: clientSecret.length,
      timestamp: new Date().toISOString()
    });
    
    // Use Buffer in Node.js environment or btoa in browser
    if (typeof Buffer !== 'undefined') {
      const encoded = Buffer.from(credentials).toString('base64');
      console.log('[GigaAPI Auth Debug] Encoded credentials length:', encoded.length);
      return encoded;
    }
    return btoa(credentials);
  }

  /**
   * Get access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    console.log('[GigaAPI Auth Debug] Starting authentication process...');
    
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry - GigaAPIClient.TOKEN_EXPIRY_BUFFER_MS) {
      console.log('[GigaAPI Auth Debug] Using cached token (expires in:', 
        Math.round((this.tokenExpiry - Date.now()) / 1000), 'seconds)');
      return this.accessToken;
    }

    // Get new token - use ngw.devices.sberbank.ru endpoint for authentication
    const authUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    console.log('[GigaAPI Auth Debug] Auth URL:', authUrl);
    
    const encodedCredentials = this.encodeCredentials(this.config.clientId, this.config.clientSecret);
    const rqUID = this.generateRqUID();
    
    console.log('[GigaAPI Auth Debug] Request details:', {
      url: authUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': 'Basic [REDACTED]',
        'RqUID': rqUID
      },
      body: 'scope=GIGACHAT_API_PERS',
      verifySSL: this.config.verifySSL
    });
    
    try {
      const requestStartTime = Date.now();
      
      // Configure fetch options with SSL handling
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${encodedCredentials}`,
          'RqUID': rqUID,
        },
        body: 'scope=GIGACHAT_API_PERS',
      };
      
      // In Node.js environment, handle SSL verification
      if (typeof process !== 'undefined' && !this.config.verifySSL) {
        console.log('[GigaAPI Auth Debug] SSL verification disabled - configuring Agent');
        // For Node.js fetch API, we need to use a custom agent to ignore SSL
        try {
          const https = await import('https');
          const agent = new https.Agent({
            rejectUnauthorized: false
          });
          (fetchOptions as any).agent = agent;
          console.log('[GigaAPI Auth Debug] HTTPS Agent configured with rejectUnauthorized: false');
        } catch (error) {
          console.warn('[GigaAPI Auth Debug] Could not import https module:', error);
        }
      }
      
      console.log('[GigaAPI Auth Debug] Attempting fetch request...');
      const response = await fetch(authUrl, fetchOptions);

      const requestDuration = Date.now() - requestStartTime;
      console.log('[GigaAPI Auth Debug] Response received:', {
        status: response.status,
        statusText: response.statusText,
        duration: requestDuration + 'ms',
        headers: {
          'content-type': response.headers.get('content-type'),
          'date': response.headers.get('date')
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GigaAPI Auth Debug] Authentication failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: AuthResponse = await response.json();
      console.log('[GigaAPI Auth Debug] Token received successfully:', {
        tokenLength: data.access_token?.length || 0,
        expiresAt: new Date(data.expires_at).toISOString(),
        expiresIn: Math.round((data.expires_at - Date.now()) / 1000) + ' seconds'
      });
      
      this.accessToken = data.access_token;
      this.tokenExpiry = data.expires_at;

      return this.accessToken;
    } catch (error) {
      // Enhanced error logging for fetch failures
      const errorDetails: any = {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        authUrl: authUrl,
        verifySSL: this.config.verifySSL
      };
      
      // Check if it's a network/fetch error
      if (error instanceof Error && error.message.includes('fetch failed')) {
        errorDetails.likelyCause = 'Network connectivity issue or SSL certificate problem';
        errorDetails.suggestions = [
          'Check if GigaChat API is accessible from your deployment environment',
          'Verify SSL certificates if using custom SSL configuration',
          'Check firewall/network restrictions',
          'Try setting GIGACHAT_VERIFY_SSL_CERTS=false if SSL verification is the issue'
        ];
        
        // Additional diagnostics for Node.js environments
        if (typeof process !== 'undefined') {
          errorDetails.nodeVersion = process.version;
          errorDetails.platform = process.platform;
        }
      }
      
      console.error('[GigaAPI Auth Debug] Exception during authentication:', errorDetails);
      
      // Provide more helpful error message
      let errorMessage = `Failed to authenticate with GigaChat API: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof Error && error.message.includes('fetch failed')) {
        errorMessage += '. This is likely a network connectivity or SSL certificate issue. Check the debug logs for details.';
      }
      
      throw new Error(errorMessage);
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
    console.log('[GigaAPI Chat Debug] Starting chat request...');
    const token = await this.getAccessToken();
    const chatUrl = `${this.config.baseUrl}/chat/completions`;

    const requestBody = {
      model: request.model || this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.max_tokens ?? this.config.maxTokens,
      stream: request.stream ?? false,
    };

    console.log('[GigaAPI Chat Debug] Request details:', {
      url: chatUrl,
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      temperature: requestBody.temperature,
      maxTokens: requestBody.max_tokens
    });

    try {
      const requestStartTime = Date.now();
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const requestDuration = Date.now() - requestStartTime;
      console.log('[GigaAPI Chat Debug] Response received:', {
        status: response.status,
        statusText: response.statusText,
        duration: requestDuration + 'ms'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GigaAPI Chat Debug] Chat request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Chat request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      console.log('[GigaAPI Chat Debug] Chat response received:', {
        choicesCount: data.choices?.length || 0,
        finishReason: data.choices?.[0]?.finish_reason,
        usage: data.usage
      });
      return data;
    } catch (error) {
      console.error('[GigaAPI Chat Debug] Exception during chat request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to send chat request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to GigaChat API
   */
  async testConnection(): Promise<boolean> {
    console.log('[GigaAPI Test Debug] Testing connection to GigaChat API...');
    try {
      // Try to get an access token
      await this.getAccessToken();
      console.log('[GigaAPI Test Debug] Connection test successful');
      return true;
    } catch (error) {
      console.error('[GigaAPI Test Debug] Connection test failed:', error);
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
    console.log('[GigaAPI Init Debug] Initializing GigaAPI client...');
    
    const clientId = process.env.GIGACHAT_CLIENT_ID;
    const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;
    const baseUrl = process.env.GIGACHAT_BASE_URL || 'https://gigachat.devices.sberbank.ru/api/v1';
    const verifySSL = process.env.GIGACHAT_VERIFY_SSL_CERTS !== 'false';

    console.log('[GigaAPI Init Debug] Environment variables:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      baseUrl: baseUrl,
      verifySSL: verifySSL
    });

    if (!clientId || !clientSecret) {
      console.error('[GigaAPI Init Debug] Missing credentials:', {
        GIGACHAT_CLIENT_ID: clientId ? 'SET' : 'MISSING',
        GIGACHAT_CLIENT_SECRET: clientSecret ? 'SET' : 'MISSING'
      });
      throw new Error('GIGACHAT_CLIENT_ID and GIGACHAT_CLIENT_SECRET environment variables must be set');
    }

    console.log('[GigaAPI Init Debug] Creating client instance...');
    clientInstance = new GigaAPIClient({
      clientId,
      clientSecret,
      baseUrl,
      verifySSL,
    });
    console.log('[GigaAPI Init Debug] Client instance created successfully');
  } else {
    console.log('[GigaAPI Init Debug] Using existing client instance');
  }

  return clientInstance;
}

export default GigaAPIClient;
