import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { analyticsExcluded } from '@/lib/analytics-policy';
import { cookieName, sameOrigin, validSession } from '@/lib/studio';
import { parsePageview, storePageview } from '@/lib/studio-analytics';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'private, no-store' };
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new NextResponse(null, { status:403, headers });
  if (process.env.VERCEL_ENV !== 'production') return new NextResponse(null, { status:204, headers });
  const cookieStore = await cookies();
  if (analyticsExcluded(cookieStore.toString(), validSession(cookieStore.get(cookieName)?.value))) return new NextResponse(null, { status:204, headers });
  try {
    if (Number(request.headers.get('content-length') || 0) > 1024) return new NextResponse(null, { status:413, headers });
    const raw = await request.text();
    if (Buffer.byteLength(raw,'utf8') > 1024) return new NextResponse(null, { status:413, headers });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return new NextResponse(null, { status:400, headers }); }
    const view = parsePageview(input);
    if (!view) return new NextResponse(null, { status:400, headers });
    await storePageview(view, request.headers, new URL(request.url).origin);
    return new NextResponse(null, { status:204, headers });
  } catch { return new NextResponse(null, { status:503, headers }); }
}
