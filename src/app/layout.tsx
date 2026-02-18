import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import { SiteShell } from './site-shell';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://laladating.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LALA Speed Dating | Huntington Beach Singles Events',
    template: '%s | LALA Speed Dating',
  },
  description:
    'LALA Speed Dating in Huntington Beach, CA. Join bilingual (English/Chinese) speed dating events, register online, and meet verified singles.',
  keywords: [
    'speed dating',
    'Huntington Beach speed dating',
    'singles event',
    'LALA speed dating',
    '相亲活动',
    '极速相亲',
  ],
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      zh: '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'LALA Speed Dating | Huntington Beach Singles Events',
    description:
      'Bilingual speed dating events in Huntington Beach. Register, attend onsite rounds, and match with verified singles.',
    siteName: 'LALA Speed Dating',
    images: [
      {
        url: '/artwork/speed-date-hero.svg',
        width: 1200,
        height: 800,
        alt: 'LALA Speed Dating hero artwork',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LALA Speed Dating | Huntington Beach Singles Events',
    description:
      'Join LALA Speed Dating events in Huntington Beach. English/Chinese, onsite rounds, voting, and matching.',
    images: ['/artwork/speed-date-hero.svg'],
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'LALA Speed Dating',
              url: siteUrl,
              logo: `${siteUrl}/logo-lala-speed.svg`,
              sameAs: [],
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Huntington Beach',
                addressRegion: 'CA',
                addressCountry: 'US',
              },
            }),
          }}
        />
        <LanguageProvider>
          <SiteShell>
            {children}
          </SiteShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
