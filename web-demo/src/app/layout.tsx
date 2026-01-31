/**
 * Root Layout Component
 * Provides the main layout structure for all pages
 */

import type { Metadata } from 'next';
import Header from '@/components/Header';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'WizeGigaLLM Demo - GigaChat API Integration',
  description: 'Interactive web-based demo for WizeGigaLLM with GigaChat API',
  keywords: ['GigaChat', 'LLM', 'AI', 'Chat', 'Demo'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
