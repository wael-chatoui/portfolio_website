import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cookieName, db, validSession } from '@/lib/studio';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({error:'Session expirée.'},{status:401});
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({error:'Identifiant invalide.'},{status:400});
  try {
    const result = await db().query("SELECT data->>'sourcePdf' AS pdf, data->>'sourceName' AS name FROM studio_records WHERE id = $1 AND kind = 'invoice'", [id]);
    if (!result.rows[0]?.pdf) return NextResponse.json({error:'Original introuvable.'},{status:404});
    const name = (result.rows[0].name || 'facture-originale.pdf').replace(/[^a-zA-Z0-9._-]/g,'_');
    return new Response(Buffer.from(result.rows[0].pdf,'base64'),{headers:{'Content-Type':'application/pdf','Cache-Control':'private, no-store','Content-Disposition':`attachment; filename="${name}"`,'X-Content-Type-Options':'nosniff'}});
  } catch { return NextResponse.json({error:'Téléchargement impossible.'},{status:503}); }
}
