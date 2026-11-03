import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { db } from './studio';
import { publicAnalyticsPath } from './analytics-policy';

export type TrafficReport = {
  days: number; since: string; until: string; fetchedAt: string;
  pageviews: number; visitors: number;
  pages: { name: string; views: number }[]; countries: { name: string; views: number }[]; sources: { name: string; views: number }[];
};
export type Pageview = { eventId: string; path: string; source: string };
let schemaReady: Promise<void> | undefined;
let cleanedOn = '';
export function ensureAnalyticsSchema() {
  return schemaReady ??= (async () => {
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(736827104)');
      await client.query(`CREATE TABLE IF NOT EXISTS studio_pageviews (
        event_id uuid PRIMARY KEY, visited_at timestamptz NOT NULL DEFAULT now(),
        visitor_key text NOT NULL, path text NOT NULL, source text NOT NULL, country text NOT NULL
      );
      CREATE INDEX IF NOT EXISTS studio_pageviews_date_idx ON studio_pageviews (visited_at);
      CREATE INDEX IF NOT EXISTS studio_pageviews_visitor_idx ON studio_pageviews (visitor_key, visited_at);`);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  })().catch(error => { schemaReady = undefined; throw error; });
}
export function parisDay(now: Date) { return new Intl.DateTimeFormat('fr-CA', { timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit' }).format(now); }
export function parsePageview(value: unknown): Pageview | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string,unknown>;
  if (typeof item.eventId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.eventId)) return null;
  if (typeof item.path !== 'string' || !publicAnalyticsPath(item.path)) return null;
  if (typeof item.source !== 'string' || item.source.length > 253) return null;
  const source = isIP(item.source.replace(/^\[|\]$/g, '')) ? '' : item.source.toLowerCase();
  if (source !== '' && !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(source)) return null;
  return { eventId:item.eventId, path:item.path.replace(/\/$/, '') || '/', source };
}
export function visitorKey(headers: Headers, now: Date, secret: string): string | null {
  const ip = (headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const agent = headers.get('user-agent') || '';
  if (!isIP(ip) || !agent || agent.length > 1000 || secret.length < 32 || /bot\b|crawler|spider|headless|lighthouse|pingdom|uptimerobot|facebookexternalhit/i.test(agent)) return null;
  return createHmac('sha256', secret).update(JSON.stringify(['portfolio-analytics', parisDay(now), ip, agent])).digest('hex');
}
export async function storePageview(view: Pageview, headers: Headers, origin: string, now = new Date()) {
  const key = visitorKey(headers, now, process.env.STUDIO_SESSION_SECRET || '');
  if (!key) return;
  await ensureAnalyticsSchema();
  const countryHeader = headers.get('x-vercel-ip-country') || '';
  const country = /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : '';
  const source = view.source === new URL(origin).hostname.toLowerCase() ? '' : view.source;
  await db().query(`INSERT INTO studio_pageviews (event_id, visitor_key, path, source, country)
    SELECT $1, $2, $3, $4, $5 WHERE
    (SELECT count(*) FROM studio_pageviews WHERE visitor_key = $2 AND visited_at > now() - interval '1 minute') < 60
    ON CONFLICT (event_id) DO NOTHING`, [view.eventId, key, view.path, source, country]);
  const today = parisDay(now);
  if (cleanedOn !== today) {
    await db().query("DELETE FROM studio_pageviews WHERE visited_at < now() - interval '90 days'");
    cleanedOn = today;
  }
}
export async function getTrafficReport(days: number): Promise<TrafficReport> {
  if (![7,30,60,90].includes(days)) throw new Error('Invalid period');
  await ensureAnalyticsSchema();
  const clock = await db().query('SELECT now() AS time');
  const now: Date = clock.rows[0].time;
  const start = new Date(parisDay(now) + 'T12:00:00Z'); start.setUTCDate(start.getUTCDate() - days + 1);
  const since = start.toISOString().slice(0,10); const until = now.toISOString();
  const range = "visited_at >= ($1::date::timestamp AT TIME ZONE 'Europe/Paris') AND visited_at <= $2::timestamptz";
  const params = [since, until];
  const top = async (column: 'path' | 'source' | 'country', fallback: string) => {
    const result = await db().query(`SELECT ${column} AS name, count(*)::int AS views FROM studio_pageviews WHERE ${range} GROUP BY ${column} ORDER BY count(*) DESC, ${column} LIMIT 6`, params);
    return result.rows.map(row => ({ name:row.name || fallback, views:Number(row.views) }));
  };
  const [total, pages, countries, sources] = await Promise.all([
    db().query(`SELECT count(*)::int AS pageviews, count(DISTINCT visitor_key)::int AS visitors FROM studio_pageviews WHERE ${range}`, params),
    top('path','Autres pages'), top('country','Pays inconnu'), top('source','Direct / provenance inconnue'),
  ]);
  return { days, since, until, fetchedAt:now.toISOString(), pageviews:Number(total.rows[0].pageviews), visitors:Number(total.rows[0].visitors), pages, countries, sources };
}
