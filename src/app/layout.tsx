import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import { SiteShell } from './site-shell';

export const metadata: Metadata = {
  title: 'LALA Speed Dating - Find Your Perfect Match',
  description: 'Meet like-minded singles in a fun, relaxed environment at LALA Speed Dating events.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <html lang="en">
        <body>
          <SiteShell>
            {children}
          </SiteShell>
        </body>
      </html>
    </LanguageProvider>
  );
}
