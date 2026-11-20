import { NextResponse } from 'next/server';
import { configured, cookieName, db, emailMatches, makeSession, passwordMatches, sameOrigin } from '@/lib/studio';
import { analyticsExclusionCookie, analyticsPreferenceMaxAge } from '@/lib/analytics-policy';
import { clearLoginFailures, ensureLoginGuardSchema, globalKey, loginClientKey, loginLocked, recordLoginFailure } from '@/lib/studio-login-guard';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  if (!configured()) return NextResponse.json({ error: 'Studio non configuré.' }, { status: 503 });
  let password: unknown; let email: unknown;
  try { const input = await request.json(); password = input.password; email = input.email; } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }); }
  if (typeof password !== 'string' || password.length > 1024 || typeof email !== 'string' || email.length > 254) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  try {
    const clientKey = loginClientKey(request.headers, process.env.STUDIO_SESSION_SECRET || '');
    const client = await db().connect();
    try {
      await ensureLoginGuardSchema(client);
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(736827105)');
      if (await loginLocked(client, [clientKey, globalKey])) {
        await client.query('COMMIT'); return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans 15 minutes.' }, { status: 429 });
      }
      if (!passwordMatches(password) || !emailMatches(email)) {
        await recordLoginFailure(client, clientKey);
        await client.query('COMMIT'); return NextResponse.json({ error: 'Adresse e-mail ou mot de passe incorrect.' }, { status: 401 });
      }
      await clearLoginFailures(client, clientKey);
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
