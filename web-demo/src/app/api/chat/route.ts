/**
 * API Route: /api/chat
 * Handles chat completions with GigaChat API using LangChain
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendChatRequest } from '@/lib/langchain-gigachat';
import type { ChatRequest } from '@/types/gigachat';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Send chat request using LangChain GigaChat
    const response = await sendChatRequest(body);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
