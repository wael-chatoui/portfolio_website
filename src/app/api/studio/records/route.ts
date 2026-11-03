import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import { billingProfileId } from '@/lib/studio-profile';
import { invoiceIssueError, invoiceNumberKey, invoiceNumberParts, followingInvoiceNumber } from '@/lib/studio-invoice-policy';
import { clean, cookieName, db, kinds, sameOrigin, validSession, type Kind } from '@/lib/studio';

export const dynamic = 'force-dynamic';
async function allowed() { return validSession((await cookies()).get(cookieName)?.value); }
const unauthorized = () => NextResponse.json({ error: 'Session expirée. Reconnecte-toi.' }, { status: 401 });
export async function GET() {
  if (!await allowed()) return unauthorized();
  try { const result = await db().query("SELECT id, kind, data - 'sourcePdf' AS data, updated_at FROM studio_records WHERE id <> $1 ORDER BY updated_at DESC", [billingProfileId]); return NextResponse.json({ records: result.rows }, { headers: { 'Cache-Control': 'private, no-store' } }); }
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
      const previous = previousResult?.rows[0]?.data;
      if (previous?.issuedAt) {
        const declared = Object.hasOwn(body.data, 'declared') ? data.declared : previous.declared || '';
        const status = ['Payé', 'Non payé'].includes(data.status) ? data.status : previous.status;
        const language = previous.historical === 'yes' ? previous.language || 'fr' : data.language || previous.language || 'fr';
        const updated = body.update === 'declaration'
          ? { ...previous, declared }
          : { ...previous, declared, language, status, paymentUnconfirmed: data.paymentUnconfirmed === 'yes' ? 'yes' : '' };
        await client.query("UPDATE studio_records SET data = $1, updated_at = now() WHERE id = $2", [updated, id]);
        await client.query('COMMIT'); return NextResponse.json({ id });
      }
      if (body.issue !== true) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Recharge le Studio avant de créer une facture.' }, { status: 400 }); }
      if (!profile) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Renseigne tes coordonnées de facturation.' }, { status: 400 }); }
      const numbers = await client.query("SELECT id, data->>'invoiceNumber' AS number, data->>'sourceSha256' AS hash, data->>'issueDate' AS date, data->>'issuedAt' AS issued FROM studio_records WHERE kind = 'invoice' AND id <> $1", [id]);
      const used = new Set(numbers.rows.filter(r => r.number && (data.historical !== 'yes' || r.issued)).map(r => invoiceNumberKey(r.number)));
      const maxInv = Math.max(Number(profile.invoiceSequence || 0), ...numbers.rows.map(r => { const p = invoiceNumberParts(r.number || ''); return p && p.prefix.replace(/[^A-Za-z0-9]/g,'').toUpperCase() === 'INV' ? p.number : 0; }));
      let last = profile.invoiceLastNumber || `INV${String(maxInv).padStart(3, '0')}`;
      const lastParts = invoiceNumberParts(last);
      if (lastParts?.prefix.replace(/[^A-Za-z0-9]/g,'').toUpperCase() === 'INV' && lastParts.number < maxInv) last = lastParts.prefix + String(maxInv).padStart(lastParts.digits.length, '0');
      let number = data.invoiceNumber;
      if (data.historical === 'yes' && !number) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Renseigne le numéro exact du PDF original.' }, { status: 400 }); }
      if (number && !invoiceNumberParts(number)) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Le numéro doit se terminer par des chiffres et contenir uniquement lettres, chiffres, points, tirets ou barres obliques.' }, { status: 400 }); }
      if (!number) {
        number = followingInvoiceNumber(last) || '';
        while (number && used.has(invoiceNumberKey(number))) number = followingInvoiceNumber(number) || '';
      }
      if (!number) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Numérotation indisponible.' }, { status: 400 }); }
      const numberConflict = used.has(invoiceNumberKey(number));
      if (numberConflict && !(data.historical === 'yes' && data.numberConflict === 'yes')) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Ce numéro de facture est déjà utilisé. Choisis un autre numéro.' }, { status: 409 }); }
      data.invoiceNumber = number;
      data.numberConflict = numberConflict ? 'yes' : '';
      if (data.historical === 'yes') {
        if (!data.sourcePdf || !data.issueDate || !Number.isFinite(Date.parse(data.issueDate + 'T12:00:00Z')) || new Date(data.issueDate + 'T12:00:00Z').toISOString().slice(0,10) !== data.issueDate) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Ajoute le PDF original et sa date de facture.' }, { status: 400 }); }
        const bytes = Buffer.from(data.sourcePdf, 'base64');
        if (bytes.length > 2000000 || !bytes.subarray(0,5).equals(Buffer.from('%PDF-'))) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Le fichier doit être un PDF de moins de 2 Mo.' }, { status: 400 }); }
        data.sourceSha256 = createHash('sha256').update(bytes).digest('hex');
        if (numbers.rows.some(r => r.hash === data.sourceSha256)) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Ce PDF original est déjà enregistré.' }, { status: 409 }); }
      } else {
        const problem = invoiceIssueError(data);
        if (problem) { await client.query('ROLLBACK'); return NextResponse.json({ error: problem }, { status: 400 }); }
        const latestDate = numbers.rows.filter(r => r.date).map(r => r.date).sort().at(-1);
        if (latestDate && data.issueDate < latestDate) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'La date doit respecter la chronologie des factures déjà enregistrées.' }, { status: 400 }); }
        data.sourcePdf = ''; data.sourceName = ''; data.sourceSha256 = '';
      }
      data.issuedAt = new Date().toISOString();
      const chosen = invoiceNumberParts(number)!; const currentLast = invoiceNumberParts(last);
      const sameSeries = currentLast && chosen.prefix.replace(/[^A-Za-z0-9]/g,'').toUpperCase() === currentLast.prefix.replace(/[^A-Za-z0-9]/g,'').toUpperCase();
      if ((sameSeries && chosen.number > currentLast!.number) || (!sameSeries && data.historical !== 'yes')) last = number;
      const sequence = chosen.prefix.replace(/[^A-Za-z0-9]/g,'').toUpperCase() === 'INV' ? Math.max(maxInv, chosen.number) : maxInv;
      await client.query("UPDATE studio_records SET data = jsonb_set(jsonb_set(data, '{invoiceSequence}', to_jsonb($1::text)), '{invoiceLastNumber}', to_jsonb($2::text)), updated_at = now() WHERE id = $3", [String(sequence), last, billingProfileId]);
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
    const deleted = await db().query("DELETE FROM studio_records WHERE id = $1 AND id <> $2 AND COALESCE(data->>'issuedAt', '') = ''", [id, billingProfileId]); if (!deleted.rowCount) return NextResponse.json({ error: 'Une facture créée est conservée. Elle ne peut pas être supprimée.' }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Suppression impossible.' }, { status: 503 }); }
}
