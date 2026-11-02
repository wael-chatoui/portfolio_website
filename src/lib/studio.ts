import { Pool } from 'pg';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

declare global { var studioPool: Pool | undefined }
export function databaseUrl() { return process.env.STUDIO_DATABASE_DATABASE_URL || process.env.STUDIO_DATABASE_URL || ''; }
export function db() {
  if (!databaseUrl()) throw new Error('Base de données non configurée');
  return globalThis.studioPool ??= new Pool({ connectionString: databaseUrl(), max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 });
}

export const cookieName = 'studio_session';
const key = () => process.env.STUDIO_SESSION_SECRET || '';
export function configured() { return (process.env.STUDIO_PASSWORD || '').length >= 16 && key().length >= 32 && !!databaseUrl(); }
const ownerEmail = () => (process.env.STUDIO_EMAIL || 'chatoui.wael40@gmail.com').trim().toLowerCase();
function sign(value: string) { return createHmac('sha256', key()).update(ownerEmail()).update(':').update(process.env.STUDIO_PASSWORD || '').update(':').update(value).digest('hex'); }
function same(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
export function passwordMatches(password: string) { return same(createHmac('sha256', key()).update(password).digest('hex'), createHmac('sha256', key()).update(process.env.STUDIO_PASSWORD || '').digest('hex')); }
export function emailMatches(email: string) { return same(createHmac('sha256', key()).update(email.trim().toLowerCase()).digest('hex'), createHmac('sha256', key()).update(ownerEmail()).digest('hex')); }
export function makeSession() { const value = `${Date.now() + 12 * 60 * 60 * 1000}.${randomBytes(24).toString('hex')}`; return `${value}.${sign(value)}`; }
export function validSession(token?: string) {
  if (!configured() || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^[a-f0-9]{48}$/.test(parts[1])) return false;
  return Number(parts[0]) > Date.now() && same(sign(`${parts[0]}.${parts[1]}`), parts[2]);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}

export const kinds = ['project', 'contact', 'invoice', 'expense'] as const;
export type Kind = typeof kinds[number];
export const fields: Record<Kind, string[]> = {
  project: ['name', 'category', 'status', 'priority', 'next', 'url', 'notes'],
  contact: ['name', 'company', 'email', 'phone', 'status', 'next', 'notes'],
  invoice: ['name', 'client', 'clientAddress', 'seller', 'sellerAddress', 'siren', 'serviceDate', 'dueDate', 'amountBeforeTax', 'vat', 'amount', 'date', 'status', 'paymentTerms', 'notes'],
  expense: ['name', 'category', 'amount', 'date', 'status', 'notes'],
};
export function clean(kind: Kind, value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>; const result: Record<string, string> = {};
  for (const field of fields[kind]) {
    const v = input[field] ?? '';
    if (typeof v !== 'string' || v.length > (field === 'notes' ? 4000 : 300)) return null;
    result[field] = v.trim();
  }
  if (!result.name) return null;
  for (const field of ['amount', 'amountBeforeTax', 'vat']) if (result[field] && !/^\d{1,9}(?:[.,]\d{1,2})?$/.test(result[field])) return null;
  for (const field of ['date', 'serviceDate', 'dueDate']) if (result[field] && !/^\d{4}-\d{2}-\d{2}$/.test(result[field])) return null;
  if (kind === 'invoice' && result.amount && result.amountBeforeTax && result.vat) {
    const cents = (value: string) => { const [whole, fraction = ''] = value.replace(',', '.').split('.'); return Number(whole) * 100 + Number((fraction + '00').slice(0, 2)); };
    if (cents(result.amountBeforeTax) + cents(result.vat) !== cents(result.amount)) return null;
  }
  return result;
}
