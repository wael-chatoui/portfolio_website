import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { syne, dmSans } from "@/app/font";
import MotionProvider from '@/components/motion-provider';
import { siteUrl, isProduction } from '@/lib/site';
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  const locale = await getLocale();
  return {
    metadataBase: new URL(siteUrl),
    title: t('title'), description: t('description'),
    authors: [{ name: 'Wael Chatoui', url: siteUrl }],
    openGraph: { type: 'website', siteName: 'Wael Chatoui', title: t('title'), description: t('description'), locale: locale === 'fr' ? 'fr_FR' : 'en_US', images: [{ url: '/opengraph-image', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description'), images: ['/opengraph-image'] },
    robots: { index: isProduction, follow: isProduction },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations('nav');

  return (
    <html lang={locale} className="dark">
      <body
        className={`${syne.variable} ${dmSans.variable} font-body grain`}
      >
        <noscript><style>{'[style*="opacity:0"] { opacity: 1 !important; transform: none !important; }'}</style></noscript>
        <NextIntlClientProvider messages={messages}>
          <MotionProvider>
            <a href="#main-content" className="skip-link">{t('skip')}</a>
            {children}
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
