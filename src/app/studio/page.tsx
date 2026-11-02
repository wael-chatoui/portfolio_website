import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { cookieName, totpRequired, validSession } from '@/lib/studio';
import Studio from './studio';
import './studio.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Studio | Wael Chatoui', robots: { index: false, follow: false } };
export default async function StudioPage() {
  const authenticated = validSession((await cookies()).get(cookieName)?.value);
  return <Studio initiallyAuthenticated={authenticated} otpRequired={totpRequired()} />;
}
