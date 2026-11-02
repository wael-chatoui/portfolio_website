import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clean, cookieName, db, sameOrigin, validSession } from '@/lib/studio';
import { billingProfileId } from '@/lib/studio-profile';

export const dynamic = 'force-dynamic';
async function allowed() { return validSession((await cookies()).get(cookieName)?.value); }
export async function GET() {
  if (!await allowed()) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  try {
    const result = await db().query('SELECT data FROM studio_records WHERE id = $1 AND kind = $2', [billingProfileId, 'contact']);
    return NextResponse.json({ profile: result.rows[0]?.data || null }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Impossible de charger tes coordonnées.' }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée.' }, { status: 403 });
  if (!await allowed()) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  try {
    const body = await request.json();
    const data = clean('contact', { ...body, role: 'billing-profile' });
    if (!data || (data.invoiceSequence && !/^\d{1,8}$/.test(data.invoiceSequence))) return NextResponse.json({ error: 'Vérifie les coordonnées et le dernier numéro saisi.' }, { status: 400 });
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query('SELECT kind, data FROM studio_records WHERE id = $1 FOR UPDATE', [billingProfileId]);
      if (existing.rowCount && existing.rows[0].kind !== 'contact') { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Profil indisponible.' }, { status: 409 }); }
      const previous = existing.rows[0]?.data?.invoiceSequence || '';
      data.invoiceLastNumber = existing.rows[0]?.data?.invoiceLastNumber || '';
      if (data.invoiceSequence && Number(data.invoiceSequence) > Number(previous || 0)) data.invoiceLastNumber = '';
      if (previous && (!data.invoiceSequence || Number(data.invoiceSequence) < Number(previous))) data.invoiceSequence = previous;
      await client.query("INSERT INTO studio_records (id, kind, data) VALUES ($1, 'contact', $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()", [billingProfileId, data]);
      await client.query('COMMIT');
      return NextResponse.json({ ok: true });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch { return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 503 }); }
}
