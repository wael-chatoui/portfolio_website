import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cookieName, validSession } from '@/lib/studio';
import { getTrafficReport } from '@/lib/studio-analytics';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: 'Session expirée. Reconnecte-toi.' }, { status: 401, headers });
  const days = Number(new URL(request.url).searchParams.get('days') || '7');
  if (![7,30,60,90].includes(days)) return NextResponse.json({ error: 'Choisis une période de 7, 30, 60 ou 90 jours.' }, { status: 400, headers });
  try { return NextResponse.json(await getTrafficReport(days), { headers }); }
  catch { return NextResponse.json({ error:'Statistiques temporairement indisponibles. Réessaie dans un instant.' }, { status:503, headers }); }
}
