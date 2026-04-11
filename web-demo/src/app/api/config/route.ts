/**
 * API Route: /api/config
 * Handles configuration management for GigaChat API using LangChain
 */

import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/langchain-gigachat';

// GET: Retrieve current configuration (without sensitive data)
export async function GET() {
  try {
    const model = process.env.GIGACHAT_MODEL || 'GigaChat';
    const baseUrl = process.env.GIGACHAT_BASE_URL || 'https://gigachat.devices.sberbank.ru/api/v1';
    const verifySSL = process.env.GIGACHAT_VERIFY_SSL_CERTS !== 'false';

    const config = {
      model,
      baseUrl,
      verifySSL,
      temperature: 0.7,
      maxTokens: 1024,
    };

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error getting config:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Test connection to GigaChat API
export async function POST(request: NextRequest) {
  try {
    const isConnected = await testConnection();

    return NextResponse.json({
      success: true,
      connected: isConnected,
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    
    return NextResponse.json(
      { 
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Return 200 even on failure so client can handle it
    );
  }
}
