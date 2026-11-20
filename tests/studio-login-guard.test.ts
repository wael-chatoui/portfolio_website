import { test } from 'node:test';
import assert from 'node:assert/strict';
import { globalKey, globalLimit, loginClientKey, perClientLimit } from '../src/lib/studio-login-guard';

const secret = 'only-a-fictitious-test-session-signing-secret';
const headers = (values: Record<string, string>) => new Headers(values);

test('sign-in failures are keyed per client address without storing the address', () => {
  const a = loginClientKey(headers({ 'x-vercel-forwarded-for': '203.0.113.7' }), secret);
  assert.match(a, /^ip:[a-f0-9]{64}$/);
  assert.ok(!a.includes('203.0.113.7'));
  assert.equal(loginClientKey(headers({ 'x-vercel-forwarded-for': '203.0.113.7' }), secret), a);
  assert.notEqual(loginClientKey(headers({ 'x-vercel-forwarded-for': '203.0.113.8' }), secret), a);
  assert.notEqual(loginClientKey(headers({ 'x-vercel-forwarded-for': '203.0.113.7' }), secret + '-rotated'), a);
});

test('the Vercel client address wins over the generic forwarded header', () => {
  const vercel = loginClientKey(headers({ 'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' }), secret);
  assert.equal(vercel, loginClientKey(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }), secret));
});

test('requests without a valid address share one bucket and never the global one', () => {
  assert.equal(loginClientKey(headers({}), secret), 'ip:unknown');
  assert.equal(loginClientKey(headers({ 'x-forwarded-for': 'not-an-ip' }), secret), 'ip:unknown');
  assert.notEqual(loginClientKey(headers({}), secret), globalKey);
});

test('one address is locked long before the global ceiling', () => {
  assert.equal(perClientLimit, 5);
  assert.ok(globalLimit >= perClientLimit * 10);
});
