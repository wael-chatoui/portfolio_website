'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'fr';

export async function getUserLocale(): Promise<string> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(COOKIE_NAME)?.value;
  return locale === 'en' || locale === 'fr' ? locale : DEFAULT_LOCALE;
}

export async function setUserLocale(locale: string): Promise<void> {
  if (locale !== 'fr' && locale !== 'en') return;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
}
