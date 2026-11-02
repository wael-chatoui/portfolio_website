import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { billingProfileId, nextInvoiceNumber } from '@/lib/studio-profile';
import { clean, cookieName, db, kinds, sameOrigin, validSession, type Kind } from '@/lib/studio';

export const dynamic = 'force-dynamic';
async function allowed() { return validSession((await cookies()).get(cookieName)?.value); }
const unauthorized = () => NextResponse.json({ error: 'Session expirée. Reconnecte-toi.' }, { status: 401 });
export async function GET() {
  if (!await allowed()) return unauthorized();
  try { const result = await db().query('SELECT id, kind, data, updated_at FROM studio_records WHERE id <> $1 ORDER BY updated_at DESC', [billingProfileId]); return NextResponse.json({ records: result.rows }, { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch { return NextResponse.json({ error: 'Impossible de charger les données. Vérifie la connexion à la base.' }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée.' }, { status: 403 });
  if (!await allowed()) return unauthorized();
  try {
    const body = await request.json(); const kind = body.kind as Kind;
    if (!kinds.includes(kind)) return NextResponse.json({ error: 'Type inconnu.' }, { status: 400 });
    const data = clean(kind, body.data); if (!data) return NextResponse.json({ error: 'Vérifie le nom et les champs saisis.' }, { status: 400 });
    const id = body.id || randomUUID();
    if (id === billingProfileId || data.role === 'billing-profile') return NextResponse.json({ error: 'Élément réservé.' }, { status: 400 });
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    if (kind !== 'invoice') {
      const result = body.id
        ? await db().query('UPDATE studio_records SET data = $1, updated_at = now() WHERE id = $2 AND kind = $3 RETURNING id', [data, id, kind])
        : await db().query('INSERT INTO studio_records (id, kind, data) VALUES ($1, $2, $3) RETURNING id', [id, kind, data]);
      if (!result.rowCount) return NextResponse.json({ error: 'Élément introuvable.' }, { status: 404 });
      return NextResponse.json({ id });
    }
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const profileResult = await client.query("SELECT data FROM studio_records WHERE id = $1 AND kind = 'contact' FOR UPDATE", [billingProfileId]);
      const profile = profileResult.rows[0]?.data;
      const previousResult = body.id ? await client.query("SELECT data FROM studio_records WHERE id = $1 AND kind = 'invoice' FOR UPDATE", [id]) : null;
      if (body.id && !previousResult?.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Élément introuvable.' }, { status: 404 }); }
      const existingNumber = previousResult?.rows[0]?.data?.invoiceNumber;
      if (existingNumber) data.invoiceNumber = existingNumber;
      else {
        if (!profile || !/^\d{1,8}$/.test(profile.invoiceSequence || '')) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Indique le dernier numéro utilisé dans « Mes coordonnées de facturation » avant d’enregistrer.' }, { status: 400 }); }
        const maxResult = await client.query("SELECT COALESCE(MAX((substring(data->>'invoiceNumber' FROM 4))::integer), 0) AS maximum FROM studio_records WHERE kind = 'invoice' AND data->>'invoiceNumber' ~ '^INV[0-9]{1,8}$'");
        const last = Math.max(Number(profile.invoiceSequence), Number(maxResult.rows[0].maximum));
        const number = nextInvoiceNumber(String(last));
        if (!number) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Numérotation épuisée.' }, { status: 400 }); }
        data.invoiceNumber = number;
        await client.query("UPDATE studio_records SET data = jsonb_set(data, '{invoiceSequence}', to_jsonb($1::text)), updated_at = now() WHERE id = $2", [String(last + 1), billingProfileId]);
      }
      if (body.id) await client.query("UPDATE studio_records SET data = $1, updated_at = now() WHERE id = $2 AND kind = 'invoice'", [data, id]);
      else await client.query("INSERT INTO studio_records (id, kind, data) VALUES ($1, 'invoice', $2)", [id, data]);
      await client.query('COMMIT'); return NextResponse.json({ id });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch { return NextResponse.json({ error: 'Enregistrement impossible. Réessaie.' }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée.' }, { status: 403 });
  if (!await allowed()) return unauthorized();
  try { const { id } = await request.json(); if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    await db().query('DELETE FROM studio_records WHERE id = $1 AND id <> $2', [id, billingProfileId]); return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Suppression impossible.' }, { status: 503 }); }
}
