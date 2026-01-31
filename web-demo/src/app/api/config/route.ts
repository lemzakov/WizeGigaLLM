/**
 * API Route: /api/config
 * Handles configuration management for GigaChat API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGigaAPIClient } from '@/lib/gigaapi';

// GET: Retrieve current configuration (without sensitive data)
export async function GET() {
  try {
    const client = getGigaAPIClient();
    const config = client.getConfig();

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
    const client = getGigaAPIClient();
    const isConnected = await client.testConnection();

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
