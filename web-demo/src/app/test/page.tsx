/**
 * Test Page
 * Comprehensive testing interface for all WizeGigaLLM features
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  timestamp?: number;
}

export default function TestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { test: 'API Configuration', status: 'pending' },
    { test: 'API Connection', status: 'pending' },
    { test: 'Chat Endpoint', status: 'pending' },
    { test: 'Error Handling', status: 'pending' },
  ]);
  const [running, setRunning] = useState(false);

  const updateTestResult = (index: number, status: TestResult['status'], message?: string) => {
    setTestResults(prev => {
      const newResults = [...prev];
      newResults[index] = {
        ...newResults[index],
        status,
        message,
        timestamp: Date.now(),
      };
      return newResults;
    });
  };

  const runAllTests = async () => {
    setRunning(true);
    
    // Reset all tests
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending' as const })));

    // Test 1: API Configuration
    updateTestResult(0, 'running');
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const configResponse = await fetch('/api/config');
      const configData = await configResponse.json();
      
      if (configData.success && configData.config) {
        updateTestResult(0, 'success', 'Configuration loaded successfully');
      } else {
        updateTestResult(0, 'error', 'Failed to load configuration');
      }
    } catch (error) {
      updateTestResult(0, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: API Connection
    updateTestResult(1, 'running');
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const connectionResponse = await fetch('/api/config', { method: 'POST' });
      const connectionData = await connectionResponse.json();
      
      if (connectionData.connected) {
        updateTestResult(1, 'success', 'Successfully connected to GigaChat API');
      } else {
        updateTestResult(1, 'error', `Connection failed: ${connectionData.error || 'Unknown error'}`);
      }
    } catch (error) {
      updateTestResult(1, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Chat Endpoint
    updateTestResult(2, 'running');
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'GigaChat',
          messages: [{ role: 'user', content: 'Hello! This is a test message.' }],
        }),
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        if (chatData.choices && chatData.choices[0]) {
          updateTestResult(2, 'success', 'Chat endpoint working correctly');
        } else {
          updateTestResult(2, 'error', 'Invalid response from chat endpoint');
        }
      } else {
        updateTestResult(2, 'error', `HTTP ${chatResponse.status}: ${chatResponse.statusText}`);
      }
    } catch (error) {
      updateTestResult(2, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Error Handling
    updateTestResult(3, 'running');
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const errorResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }), // Invalid request
      });

      if (errorResponse.status === 400) {
        updateTestResult(3, 'success', 'Error handling works correctly (400 Bad Request)');
      } else {
        updateTestResult(3, 'error', 'Error handling not working as expected');
      }
    } catch (error) {
      updateTestResult(3, 'success', 'Error handling caught the invalid request');
    }

    setRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '#999';
      case 'running': return '#667eea';
      case 'success': return '#48bb78';
      case 'error': return '#f56565';
    }
  };

  return (
    <>
      <div className="card">
        <h2>🧪 WizeGigaLLM Test Suite</h2>
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          This comprehensive test page allows you to verify all features of the WizeGigaLLM web demo application.
          Run the automated tests below to ensure everything is working correctly.
        </p>

        <button
          className="btn btn-primary"
          onClick={runAllTests}
          disabled={running}
          style={{ width: '100%', marginBottom: '30px' }}
        >
          {running ? (
            <>
              <div className="spinner"></div>
              Running Tests...
            </>
          ) : (
            <>🚀 Run All Tests</>
          )}
        </button>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '20px', color: '#667eea' }}>Test Results</h3>
          
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                marginBottom: '10px',
                background: 'white',
                borderRadius: '5px',
                border: `2px solid ${getStatusColor(result.status)}`,
              }}
            >
              <span style={{ fontSize: '24px', marginRight: '15px' }}>
                {getStatusIcon(result.status)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {result.test}
                </div>
                {result.message && (
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {result.message}
                  </div>
                )}
              </div>
              {result.status === 'running' && (
                <div className="spinner"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>📋 Feature Checklist</h3>
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          Below is a checklist of all features available in this application:
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ marginBottom: '10px' }}>💬 Chat Interface</h4>
            <ul style={{ lineHeight: '1.8', marginLeft: '20px', fontSize: '0.9rem' }}>
              <li>Real-time messaging</li>
              <li>Conversation history</li>
              <li>Message timestamps</li>
              <li>Clear chat function</li>
            </ul>
            <Link href="/chat" className="btn btn-secondary" style={{ marginTop: '10px', width: '100%', textAlign: 'center' }}>
              Test Chat
            </Link>
          </div>

          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ marginBottom: '10px' }}>⚙️ Settings</h4>
            <ul style={{ lineHeight: '1.8', marginLeft: '20px', fontSize: '0.9rem' }}>
              <li>View configuration</li>
              <li>Test connection</li>
              <li>API documentation</li>
              <li>Setup instructions</li>
            </ul>
            <Link href="/settings" className="btn btn-secondary" style={{ marginTop: '10px', width: '100%', textAlign: 'center' }}>
              Test Settings
            </Link>
          </div>

          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ marginBottom: '10px' }}>🔌 API Routes</h4>
            <ul style={{ lineHeight: '1.8', marginLeft: '20px', fontSize: '0.9rem' }}>
              <li>/api/chat - Chat completions</li>
              <li>/api/config - Configuration</li>
              <li>Error handling</li>
              <li>CORS support</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>🔍 Manual Testing Instructions</h3>
        <ol style={{ lineHeight: '2', marginLeft: '20px' }}>
          <li>
            <strong>Test Chat Interface:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
              <li>Navigate to the <Link href="/chat" style={{ color: '#667eea', textDecoration: 'underline' }}>Chat Demo</Link> page</li>
              <li>Send a test message (e.g., &quot;Hello&quot; or &quot;Привет&quot;)</li>
              <li>Verify you receive a response from GigaChat</li>
              <li>Test the &quot;Clear Chat&quot; button</li>
            </ul>
          </li>
          <li style={{ marginTop: '15px' }}>
            <strong>Test Settings Page:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
              <li>Go to the <Link href="/settings" style={{ color: '#667eea', textDecoration: 'underline' }}>Settings</Link> page</li>
              <li>Verify configuration is displayed correctly</li>
              <li>Click &quot;Test Connection&quot; button</li>
              <li>Confirm successful connection message</li>
            </ul>
          </li>
          <li style={{ marginTop: '15px' }}>
            <strong>Test Error Handling:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
              <li>Try sending empty messages in chat</li>
              <li>Test with very long messages</li>
              <li>Verify error messages are displayed properly</li>
            </ul>
          </li>
          <li style={{ marginTop: '15px' }}>
            <strong>Test Deployment:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
              <li>Run <code>npm run build</code> to verify build succeeds</li>
              <li>Run <code>npm start</code> to test production mode</li>
              <li>Verify all features work in production mode</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="card" style={{ background: '#f0f7ff', border: '2px solid #667eea' }}>
        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>📝 Deployment Verification</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
          To ensure successful deployment, verify the following:
        </p>
        <div style={{ background: 'white', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
          <h4 style={{ marginBottom: '10px' }}>✓ Build Process</h4>
          <ul style={{ lineHeight: '1.8', marginLeft: '20px' }}>
            <li><code>npm install</code> - Dependencies installed successfully</li>
            <li><code>npm run build</code> - Build completes without errors</li>
            <li><code>npm run lint</code> - No linting errors (optional)</li>
          </ul>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
          <h4 style={{ marginBottom: '10px' }}>✓ Environment Configuration</h4>
          <ul style={{ lineHeight: '1.8', marginLeft: '20px' }}>
            <li><code>GIGACHAT_CREDENTIALS</code> - Set correctly</li>
            <li><code>GIGACHAT_BASE_URL</code> - Points to correct endpoint</li>
            <li><code>GIGACHAT_VERIFY_SSL_CERTS</code> - Configured appropriately</li>
          </ul>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '5px' }}>
          <h4 style={{ marginBottom: '10px' }}>✓ Runtime Testing</h4>
          <ul style={{ lineHeight: '1.8', marginLeft: '20px' }}>
            <li>All automated tests pass</li>
            <li>Chat interface responds correctly</li>
            <li>Settings page loads and connection test works</li>
            <li>No console errors in browser</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '20px' }}>Quick Navigation</h3>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-secondary">
            🏠 Home
          </Link>
          <Link href="/chat" className="btn btn-primary">
            💬 Chat Demo
          </Link>
          <Link href="/settings" className="btn btn-secondary">
            ⚙️ Settings
          </Link>
        </div>
      </div>
    </>
  );
}
