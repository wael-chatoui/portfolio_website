import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { PoolClient } from 'pg';

// Failures are counted per client address and, with a much higher ceiling, for all clients together.
// A single address can no longer lock the owner out; the global ceiling only caps distributed guessing.
export const loginWindowMinutes = 15;
export const perClientLimit = 5;
export const globalLimit = 100;
export const globalKey = 'global';

export function loginClientKey(headers: Headers, secret: string): string {
  const ip = (headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (!isIP(ip)) return 'ip:unknown';
  return 'ip:' + createHmac('sha256', secret).update('studio-login:' + ip).digest('hex');
}

let schemaReady: Promise<void> | undefined;
export function ensureLoginGuardSchema(client: PoolClient) {
  return schemaReady ??= client.query(`CREATE TABLE IF NOT EXISTS studio_login_attempts (
    key text PRIMARY KEY,
    failures integer NOT NULL DEFAULT 0,
    window_started timestamptz NOT NULL DEFAULT now(),
    locked_until timestamptz
  )`).then(() => undefined).catch(error => { schemaReady = undefined; throw error; });
}

export async function loginLocked(client: PoolClient, keys: string[]): Promise<boolean> {
  const { rowCount } = await client.query('SELECT 1 FROM studio_login_attempts WHERE key = ANY($1) AND locked_until > now()', [keys]);
  return !!rowCount;
}

export async function recordLoginFailure(client: PoolClient, clientKey: string) {
  for (const [key, limit] of [[clientKey, perClientLimit], [globalKey, globalLimit]] as const) {
    await client.query(`INSERT INTO studio_login_attempts AS t (key, failures, window_started, locked_until)
      VALUES ($1, 1, now(), CASE WHEN 1 >= $2 THEN now() + make_interval(mins => $3) END)
      ON CONFLICT (key) DO UPDATE SET
        failures = CASE WHEN t.window_started <= now() - make_interval(mins => $3) THEN 1 ELSE t.failures + 1 END,
        window_started = CASE WHEN t.window_started <= now() - make_interval(mins => $3) THEN now() ELSE t.window_started END,
        locked_until = CASE WHEN (CASE WHEN t.window_started <= now() - make_interval(mins => $3) THEN 1 ELSE t.failures + 1 END) >= $2
          THEN now() + make_interval(mins => $3) ELSE NULL END`, [key, limit, loginWindowMinutes]);
  }
  await client.query("DELETE FROM studio_login_attempts WHERE window_started < now() - interval '1 day' AND (locked_until IS NULL OR locked_until < now())");
}

export async function clearLoginFailures(client: PoolClient, clientKey: string) {
  await client.query('DELETE FROM studio_login_attempts WHERE key = ANY($1)', [[clientKey, globalKey]]);
}
