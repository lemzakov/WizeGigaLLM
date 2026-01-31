/**
 * Home Page
 * Landing page with information about the demo
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <div className="card">
        <h2>Welcome to WizeGigaLLM Demo</h2>
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          This is an interactive web-based demonstration of the WizeGigaLLM project, 
          showcasing integration with the <strong>GigaChat API</strong>. GigaChat is a 
          powerful language model developed by Sber, designed for Russian language processing 
          and understanding.
        </p>
        
        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>✨ Features</h3>
        <ul style={{ marginBottom: '25px', lineHeight: '1.8', marginLeft: '20px' }}>
          <li><strong>Interactive Chat Interface</strong> - Test and interact with GigaChat API in real-time</li>
          <li><strong>Configurable Settings</strong> - Adjust model parameters like temperature and max tokens</li>
          <li><strong>Connection Testing</strong> - Verify your API credentials and connection status</li>
          <li><strong>Modern UI</strong> - Clean, responsive design built with Next.js 14</li>
          <li><strong>Optimized for Vercel</strong> - Ready for deployment with optimal configurations</li>
        </ul>

        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>🚀 Getting Started</h3>
        <ol style={{ marginBottom: '25px', lineHeight: '1.8', marginLeft: '20px' }}>
          <li>
            <strong>Configure API Credentials:</strong> Visit the{' '}
            <Link href="/settings" style={{ color: '#667eea', textDecoration: 'underline' }}>
              Settings
            </Link>{' '}
            page to check your GigaChat API configuration
          </li>
          <li>
            <strong>Test the API:</strong> Use the connection test feature to verify everything is working
          </li>
          <li>
            <strong>Start Chatting:</strong> Go to the{' '}
            <Link href="/chat" style={{ color: '#667eea', textDecoration: 'underline' }}>
              Chat Demo
            </Link>{' '}
            page to interact with GigaChat
          </li>
        </ol>

        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>📚 Documentation</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
          For more information about GigaChat and how to obtain API credentials:
        </p>
        <ul style={{ lineHeight: '1.8', marginLeft: '20px' }}>
          <li>
            <a 
              href="https://developers.sber.ru/docs/ru/gigachat/quickstart/ind-using-api" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'underline' }}
            >
              GigaChat API Documentation
            </a>
          </li>
          <li>
            <a 
              href="https://developers.sber.ru/docs/ru/gigachat/sdk/overview" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'underline' }}
            >
              GigaChain SDK Overview
            </a>
          </li>
        </ul>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '20px' }}>Ready to explore?</h3>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/chat" className="btn btn-primary">
            💬 Try Chat Demo
          </Link>
          <Link href="/settings" className="btn btn-secondary">
            ⚙️ Check Settings
          </Link>
        </div>
      </div>
    </>
  );
}
