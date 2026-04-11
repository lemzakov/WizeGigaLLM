/**
 * Header Component
 * Displays the application header with navigation
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="container">
        <h1>🦜️🔗 WizeGigaLLM Demo</h1>
        <p>Interactive demo for GigaChat API integration</p>
        <nav className="nav">
          <Link 
            href="/" 
            className={pathname === '/' ? 'active' : ''}
          >
            🏠 Home
          </Link>
          <Link 
            href="/test" 
            className={pathname === '/test' ? 'active' : ''}
          >
            🧪 Test
          </Link>
          <Link 
            href="/chat" 
            className={pathname === '/chat' ? 'active' : ''}
          >
            💬 Chat Demo
          </Link>
          <Link 
            href="/settings" 
            className={pathname === '/settings' ? 'active' : ''}
          >
            ⚙️ Settings
          </Link>
          <Link 
            href="/max-bot" 
            className={pathname === '/max-bot' ? 'active' : ''}
          >
            🤖 MAX Bot
          </Link>
        </nav>
      </div>
    </header>
  );
}
