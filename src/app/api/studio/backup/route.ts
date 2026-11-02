import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clean, cookieName, db, kinds, sameOrigin, validSession, type Kind } from '@/lib/studio';

export const dynamic = 'force-dynamic';
const maxBytes = 5_000_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function allowed() { return validSession((await cookies()).get(cookieName)?.value); }

export async function GET() {
  if (!await allowed()) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  try {
    const result = await db().query('SELECT id, kind, data, created_at, updated_at FROM studio_records ORDER BY created_at, id');
    const body = { format: 'portfolio-studio-backup', version: 1, exportedAt: new Date().toISOString(), records: result.rows };
    if (result.rows.length > 5000 || Buffer.byteLength(JSON.stringify(body), 'utf8') > maxBytes) return NextResponse.json({ error: 'Les données dépassent la capacité actuelle de sauvegarde.' }, { status: 413 });
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store', 'Content-Disposition': 'attachment; filename="studio-sauvegarde.json"' } });
  } catch { return NextResponse.json({ error: 'Sauvegarde impossible.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée.' }, { status: 403 });
  if (!await allowed()) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  try {
    if (Number(request.headers.get('content-length') || 0) > maxBytes) return NextResponse.json({ error: 'Fichier trop volumineux.' }, { status: 413 });
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) return NextResponse.json({ error: 'Fichier trop volumineux.' }, { status: 413 });
    let backup: unknown;
    try { backup = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Fichier JSON invalide.' }, { status: 400 }); }
    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) return NextResponse.json({ error: 'Sauvegarde invalide.' }, { status: 400 });
    const input = backup as { format?: unknown; version?: unknown; records?: unknown };
    if (input.format !== 'portfolio-studio-backup' || input.version !== 1 || !Array.isArray(input.records) || input.records.length > 5000) return NextResponse.json({ error: 'Format de sauvegarde non reconnu.' }, { status: 400 });
    const items: { id: string; kind: Kind; data: Record<string, string>; createdAt: string; updatedAt: string }[] = [];
    const ids = new Set<string>();
    for (const record of input.records) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) return NextResponse.json({ error: 'Entrée de sauvegarde invalide.' }, { status: 400 });
      const item = record as { id?: unknown; kind?: unknown; data?: unknown; created_at?: unknown; updated_at?: unknown };
      if (typeof item.id !== 'string' || !uuid.test(item.id) || ids.has(item.id.toLowerCase()) || !kinds.includes(item.kind as Kind)) return NextResponse.json({ error: 'Identifiant ou type invalide dans la sauvegarde.' }, { status: 400 });
      const data = clean(item.kind as Kind, item.data);
      if (!data) return NextResponse.json({ error: 'Données invalides dans la sauvegarde.' }, { status: 400 });
      const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
      if (!validDate(item.created_at) || !validDate(item.updated_at)) return NextResponse.json({ error: 'Date invalide dans la sauvegarde.' }, { status: 400 });
      ids.add(item.id.toLowerCase()); items.push({ id: item.id, kind: item.kind as Kind, data, createdAt: item.created_at, updatedAt: item.updated_at });
    }
    const client = await db().connect();
    try {
      await client.query('BEGIN'); let inserted = 0;
      for (const item of items) {
        const result = await client.query('INSERT INTO studio_records (id, kind, data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING', [item.id, item.kind, item.data, item.createdAt, item.updatedAt]);
        inserted += result.rowCount || 0;
      }
      await client.query('COMMIT');
      return NextResponse.json({ inserted, skipped: items.length - inserted });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch { return NextResponse.json({ error: 'Restauration impossible.' }, { status: 503 }); }
}
