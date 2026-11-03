import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { analyticsExcluded, analyticsExclusionCookie, analyticsPreferenceMaxAge } from '@/lib/analytics-policy';
import { cookieName, validSession } from '@/lib/studio';

export const dynamic = 'force-dynamic';
export async function GET() {
  const cookieStore = await cookies();
  const excluded = analyticsExcluded(cookieStore.toString(), validSession(cookieStore.get(cookieName)?.value));
  const response = NextResponse.json({ excluded }, { headers:{ 'Cache-Control':'private, no-store', Vary:'Cookie' } });
  if (excluded) response.cookies.set(analyticsExclusionCookie, '1', { secure:process.env.NODE_ENV === 'production', sameSite:'lax', path:'/', maxAge:analyticsPreferenceMaxAge });
  return response;
}
