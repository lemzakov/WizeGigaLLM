/**
 * Settings Page
 * Displays and manages GigaChat API configuration
 */

'use client';

import { useState, useEffect } from 'react';

interface ConfigData {
  baseUrl: string;
  verifySSL: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/config', { method: 'POST' });
      const data = await response.json();
      
      setTestResult({
        success: data.connected,
        message: data.connected 
          ? 'Successfully connected to GigaChat API! 🎉'
          : `Connection failed: ${data.error || 'Unknown error'}`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>Settings</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '20px' }}>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <h2>⚙️ GigaChat API Settings</h2>
        
        {config ? (
          <>
            <div className="form-group">
              <label>API Base URL</label>
              <input 
                type="text" 
                value={config.baseUrl} 
                disabled
                style={{ background: '#f8f9fa' }}
              />
              <small>The base URL for GigaChat API endpoints</small>
            </div>

            <div className="form-group">
              <label>Default Model</label>
              <input 
                type="text" 
                value={config.model || 'GigaChat'} 
                disabled
                style={{ background: '#f8f9fa' }}
              />
              <small>The default model used for chat completions</small>
            </div>

            <div className="form-group">
              <label>Temperature</label>
              <input 
                type="number" 
                value={config.temperature ?? 0.7} 
                disabled
                step="0.1"
                min="0"
                max="2"
                style={{ background: '#f8f9fa' }}
              />
              <small>Controls randomness in responses (0.0 - 2.0)</small>
            </div>

            <div className="form-group">
              <label>Max Tokens</label>
              <input 
                type="number" 
                value={config.maxTokens ?? 1024} 
                disabled
                style={{ background: '#f8f9fa' }}
              />
              <small>Maximum number of tokens to generate</small>
            </div>

            <div className="form-group">
              <label>SSL Verification</label>
              <input 
                type="text" 
                value={config.verifySSL ? 'Enabled' : 'Disabled'} 
                disabled
                style={{ background: '#f8f9fa' }}
              />
              <small>Whether to verify SSL certificates</small>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
              <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
                <strong>ℹ️ Configuration Note:</strong> These settings are configured through environment 
                variables. To modify them, update the <code>.env.local</code> file in the project root and 
                restart the development server.
              </p>
              <p style={{ lineHeight: '1.6' }}>
                API credentials are stored securely on the server and are never exposed to the client.
              </p>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#721c24', background: '#f8d7da', borderRadius: '5px' }}>
            Failed to load configuration. Please check your environment variables.
          </div>
        )}
      </div>

      <div className="card">
        <h2>🔌 Connection Test</h2>
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          Test the connection to GigaChat API to verify your credentials and configuration.
        </p>
        
        <button 
          className="btn btn-primary" 
          onClick={testConnection}
          disabled={testing || !config}
        >
          {testing ? (
            <>
              <div className="spinner"></div>
              Testing Connection...
            </>
          ) : (
            <>🔍 Test Connection</>
          )}
        </button>

        {testResult && (
          <div 
            className={`status ${testResult.success ? 'success' : 'error'}`}
            style={{ marginTop: '20px' }}
          >
            <span className="status-dot"></span>
            {testResult.message}
          </div>
        )}
      </div>

      <div className="card">
        <h2>📖 Setup Instructions</h2>
        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          To configure the application with your GigaChat API credentials:
        </p>
        <ol style={{ lineHeight: '1.8', marginLeft: '20px', marginBottom: '20px' }}>
          <li>
            Obtain your API credentials from{' '}
            <a 
              href="https://developers.sber.ru/docs/ru/gigachat/quickstart/ind-using-api" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'underline' }}
            >
              GigaChat Developer Portal
            </a>
          </li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> in the web-demo directory</li>
          <li>Add your credentials to the <code>GIGACHAT_CREDENTIALS</code> variable</li>
          <li>Restart the development server</li>
          <li>Use the connection test above to verify everything is working</li>
        </ol>
        <p style={{ lineHeight: '1.6', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
          <strong>⚠️ Security Note:</strong> Never commit your <code>.env.local</code> file to version 
          control. It contains sensitive credentials that should remain private.
        </p>
      </div>
    </>
  );
}
