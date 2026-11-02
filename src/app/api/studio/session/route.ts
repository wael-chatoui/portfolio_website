import { NextResponse } from 'next/server';
import { configured, cookieName, db, makeSession, passwordMatches, sameOrigin, totpRequired, verifyTotp } from '@/lib/studio';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  if (!configured()) return NextResponse.json({ error: 'Studio non configuré.' }, { status: 503 });
  let password: unknown; let otp: unknown;
  try { const input = await request.json(); password = input.password; otp = input.otp; } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }); }
  if (typeof password !== 'string' || password.length > 1024 || (otp !== undefined && (typeof otp !== 'string' || otp.length > 16))) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  try {
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT failures, locked_until, last_totp_step FROM studio_login_guard WHERE id = 1 FOR UPDATE');
      if (!rows.length) throw new Error('Login guard missing');
      if (rows[0].locked_until && new Date(rows[0].locked_until).getTime() > Date.now()) {
        await client.query('COMMIT'); return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans 15 minutes.' }, { status: 429 });
      }
      const totp = await verifyTotp(typeof otp === 'string' ? otp : '');
      const replay = totpRequired() && totp.valid && rows[0].last_totp_step !== null && totp.timeStep <= Number(rows[0].last_totp_step);
      if (!passwordMatches(password) || !totp.valid || replay) {
        await client.query("UPDATE studio_login_guard SET failures = CASE WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1 ELSE failures + 1 END, locked_until = CASE WHEN (CASE WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1 ELSE failures + 1 END) >= 5 THEN now() + interval '15 minutes' ELSE NULL END WHERE id = 1");
        await client.query('COMMIT'); return NextResponse.json({ error: 'Identifiants incorrects ou code déjà utilisé.' }, { status: 401 });
      }
      await client.query('UPDATE studio_login_guard SET failures = 0, locked_until = NULL, last_totp_step = CASE WHEN $1 THEN $2 ELSE last_totp_step END WHERE id = 1', [totpRequired(), totp.valid ? totp.timeStep : null]);
      await client.query('COMMIT');
      const response = NextResponse.json({ ok: true });
      response.cookies.set(cookieName, makeSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 43200 });
      return response;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch { return NextResponse.json({ error: 'Connexion indisponible. Vérifie la base Studio.' }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  const response = NextResponse.json({ ok: true }); response.cookies.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 }); return response;
}
