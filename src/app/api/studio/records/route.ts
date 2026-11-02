import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { clean, cookieName, db, kinds, sameOrigin, validSession, type Kind } from '@/lib/studio';

export const dynamic = 'force-dynamic';
async function allowed() { return validSession((await cookies()).get(cookieName)?.value); }
const unauthorized = () => NextResponse.json({ error: 'Session expirée. Reconnecte-toi.' }, { status: 401 });
export async function GET() {
  if (!await allowed()) return unauthorized();
  try { const result = await db().query('SELECT id, kind, data, updated_at FROM studio_records ORDER BY updated_at DESC'); return NextResponse.json({ records: result.rows }, { headers: { 'Cache-Control': 'private, no-store' } }); }
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
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    const result = body.id
      ? await db().query('UPDATE studio_records SET data = $1, updated_at = now() WHERE id = $2 AND kind = $3 RETURNING id', [data, id, kind])
      : await db().query('INSERT INTO studio_records (id, kind, data) VALUES ($1, $2, $3) RETURNING id', [id, kind, data]);
    if (!result.rowCount) return NextResponse.json({ error: 'Élément introuvable.' }, { status: 404 });
    return NextResponse.json({ id });
  } catch { return NextResponse.json({ error: 'Enregistrement impossible. Réessaie.' }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée.' }, { status: 403 });
  if (!await allowed()) return unauthorized();
  try { const { id } = await request.json(); if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    await db().query('DELETE FROM studio_records WHERE id = $1', [id]); return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Suppression impossible.' }, { status: 503 }); }
}
