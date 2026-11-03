import { NextResponse } from 'next/server';
import { configured, cookieName, db, emailMatches, makeSession, passwordMatches, sameOrigin } from '@/lib/studio';
import { analyticsExclusionCookie, analyticsPreferenceMaxAge } from '@/lib/analytics-policy';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  if (!configured()) return NextResponse.json({ error: 'Studio non configuré.' }, { status: 503 });
  let password: unknown; let email: unknown;
  try { const input = await request.json(); password = input.password; email = input.email; } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }); }
  if (typeof password !== 'string' || password.length > 1024 || typeof email !== 'string' || email.length > 254) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  try {
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT failures, locked_until FROM studio_login_guard WHERE id = 1 FOR UPDATE');
      if (!rows.length) throw new Error('Login guard missing');
      if (rows[0].locked_until && new Date(rows[0].locked_until).getTime() > Date.now()) {
        await client.query('COMMIT'); return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans 15 minutes.' }, { status: 429 });
      }
      if (!passwordMatches(password) || !emailMatches(email)) {
        await client.query("UPDATE studio_login_guard SET failures = CASE WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1 ELSE failures + 1 END, locked_until = CASE WHEN (CASE WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1 ELSE failures + 1 END) >= 5 THEN now() + interval '15 minutes' ELSE NULL END WHERE id = 1");
        await client.query('COMMIT'); return NextResponse.json({ error: 'Adresse e-mail ou mot de passe incorrect.' }, { status: 401 });
      }
      await client.query('UPDATE studio_login_guard SET failures = 0, locked_until = NULL WHERE id = 1');
      await client.query('COMMIT');
      const response = NextResponse.json({ ok: true });
      response.cookies.set(cookieName, makeSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 43200 });
      response.cookies.set(analyticsExclusionCookie, '1', { secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: analyticsPreferenceMaxAge });
      return response;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch { return NextResponse.json({ error: 'Connexion indisponible. Vérifie la base Studio.' }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  const response = NextResponse.json({ ok: true }); response.cookies.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 }); return response;
}
