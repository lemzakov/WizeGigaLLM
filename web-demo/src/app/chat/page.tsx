/**
 * Chat Demo Page
 * Interactive chat interface for testing GigaChat API
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types/gigachat';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'GigaChat',
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response to chat
      if (data.choices && data.choices[0]) {
        const assistantMessage: Message = {
          ...data.choices[0].message,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.error) {
        // Handle error response
        const errorMessage: Message = {
          role: 'system',
          content: `Error: ${data.error}${data.details ? ` - ${data.details}` : ''}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'system',
        content: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>💬 Chat Demo</h2>
          <button 
            className="btn btn-secondary" 
            onClick={clearChat}
            disabled={messages.length === 0}
          >
            🗑️ Clear Chat
          </button>
        </div>

        <div className="chat-container">
          <div className="messages">
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '40px 20px' }}>
                <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>👋 Welcome to GigaChat Demo!</p>
                <p>Start a conversation by typing a message below.</p>
                <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
                  Try asking: "What can you help me with?" or "Tell me a joke in Russian"
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div>{message.content}</div>
                  {message.timestamp && (
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="message assistant">
                <div className="spinner"></div>
                <span style={{ marginLeft: '10px' }}>GigaChat is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              rows={3}
              disabled={loading}
            />
            <button 
              className="btn btn-primary" 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{ minWidth: '100px' }}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Sending...
                </>
              ) : (
                <>📤 Send</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>💡 Tips for Using the Chat Demo</h3>
        <ul style={{ lineHeight: '1.8', marginLeft: '20px' }}>
          <li><strong>Language Support:</strong> GigaChat is optimized for Russian language, but also supports English</li>
          <li><strong>Context Awareness:</strong> The chat maintains conversation history for context</li>
          <li><strong>Keyboard Shortcuts:</strong> Press Enter to send, Shift+Enter for a new line</li>
          <li><strong>Clear Chat:</strong> Use the "Clear Chat" button to start a fresh conversation</li>
          <li><strong>Error Handling:</strong> System messages (in yellow) indicate errors or important information</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>🔧 Configuration</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
          The chat demo uses the default settings configured on the Settings page. 
          Current configuration includes:
        </p>
        <ul style={{ lineHeight: '1.8', marginLeft: '20px' }}>
          <li>Model: <code>GigaChat</code></li>
          <li>Temperature: <code>0.7</code> (configurable via environment variables)</li>
          <li>Max Tokens: <code>1024</code> (configurable via environment variables)</li>
        </ul>
        <p style={{ marginTop: '15px', lineHeight: '1.6' }}>
          Visit the <a href="/settings" style={{ color: '#667eea', textDecoration: 'underline' }}>Settings</a> page 
          to view your full configuration.
        </p>
      </div>
    </>
  );
}
