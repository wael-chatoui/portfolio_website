import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTrafficReport, parisDay, parsePageview, visitorKey } from '../src/lib/studio-analytics';

const eventId = '10000000-0000-4000-8000-000000000001';
const secret = 'fictitious-daily-visitor-key-not-a-real-secret';
test('collection accepts public paths and hostname sources while rejecting private or personal URL data', () => {
  assert.deepEqual(parsePageview({ eventId, path:'/produits', source:'Google.COM' }), { eventId, path:'/produits', source:'google.com' });
  assert(parsePageview({ eventId, path:'/', source:'' }));
  for (const source of ['203.0.113.1','[2001:db8::1]']) assert.equal(parsePageview({ eventId, path:'/', source })?.source, '');
  for (const path of ['/studio', '/studio/invoices', '/api/studio/records', '/?email=private@example.test', '/unknown', 'https://example.com/']) assert.equal(parsePageview({ eventId, path, source:'' }), null);
  for (const source of ['https://google.com/private', 'google.com?email=private', '<script>']) assert.equal(parsePageview({ eventId, path:'/', source }), null);
  assert.equal(parsePageview({ eventId:'invalid', path:'/', source:'' }), null);
});
test('visitor estimates rotate at Paris midnight and do not retain raw IPs or user agents', () => {
  const headers = new Headers({ 'x-vercel-forwarded-for':'203.0.113.1', 'user-agent':'Browser fictif' });
  const before = new Date('2026-11-03T22:59:59Z'); const after = new Date('2026-11-03T23:00:00Z');
  const key = visitorKey(headers, before, secret)!;
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(key.includes('203.0.113.1'), false);
  assert.equal(visitorKey(headers, new Date('2026-11-03T22:59:58Z'), secret), key);
  assert.notEqual(visitorKey(headers, after, secret), key);
  assert.equal(parisDay(before), '2026-11-03'); assert.equal(parisDay(after), '2026-11-04');
  assert.equal(parisDay(new Date('2026-07-03T22:00:00Z')), '2026-07-04');
  headers.set('x-vercel-forwarded-for','203.0.113.2');
  assert.notEqual(visitorKey(headers, before, secret), key);
});
test('missing client information, invalid IPs, weak keys and known bots do not become visitors', async () => {
  const now = new Date();
  assert.equal(visitorKey(new Headers(), now, secret), null);
  assert.equal(visitorKey(new Headers({ 'x-vercel-forwarded-for':'invalid', 'user-agent':'Browser' }), now, secret), null);
  assert.equal(visitorKey(new Headers({ 'x-forwarded-for':'203.0.113.1', 'user-agent':'Browser' }), now, 'short'), null);
  for (const agent of ['Googlebot/2.1', 'OAI-SearchBot/1.0', 'HeadlessChrome', 'bingbot', 'facebookexternalhit']) assert.equal(visitorKey(new Headers({ 'x-forwarded-for':'203.0.113.1', 'user-agent':agent }), now, secret), null);
  await assert.rejects(getTrafficReport(6), /Invalid period/);
});
