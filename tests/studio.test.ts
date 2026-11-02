import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clean, configured, databaseUrl, makeSession, passwordMatches, sameOrigin, validSession, verifyTotp } from '../src/lib/studio';
import { generate } from 'otplib';

process.env.STUDIO_DATABASE_URL = 'postgresql://localhost/studio-test';
process.env.STUDIO_PASSWORD = 'only-a-fictitious-test-password';
process.env.STUDIO_SESSION_SECRET = 'only-a-fictitious-test-session-signing-secret';

test('uses the actual Vercel integration variable and falls back to local configuration', () => {
  assert.equal(databaseUrl(), 'postgresql://localhost/studio-test');
  process.env.STUDIO_DATABASE_DATABASE_URL = 'postgresql://localhost/vercel-test';
  try { assert.equal(databaseUrl(), 'postgresql://localhost/vercel-test'); }
  finally { delete process.env.STUDIO_DATABASE_DATABASE_URL; }
});

test('sessions are signed, expire, and do not accept tampering', () => {
  assert.equal(configured(), true);
  const token = makeSession();
  assert.equal(validSession(token), true);
  assert.equal(validSession(token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')), false);
  assert.equal(validSession('0.' + token.split('.').slice(1).join('.')), false);
  assert.equal(validSession(), false);
  assert.equal(passwordMatches('wrong-password'), false);
  assert.equal(passwordMatches('only-a-fictitious-test-password'), true);
});
test('invalid amounts and missing names cannot be saved', () => {
  assert.equal(clean('invoice', { name: 'Test', amount: '-5' }), null);
  assert.equal(clean('invoice', { name: 'Test', amount: '1,234' }), null);
  assert.equal(clean('project', { name: '  ' }), null);
  assert.equal(clean('invoice', { name: ' Test ', amount: '12,50', surprise: 'ignored' })?.name, 'Test');
  assert.equal(clean('invoice', { name: 'Test', amount: '12,50' })?.amount, '12,50');
  assert.equal(clean('invoice', { name: 'Test', amountBeforeTax: '100', vat: '20', amount: '119' }), null);
  assert.equal(clean('invoice', { name: 'Test', amountBeforeTax: '100', vat: '20', amount: '120' })?.amount, '120');
  assert.equal(Object.hasOwn(clean('invoice', { name: 'Test', surprise: 'ignored' })!, 'surprise'), false);
});
test('writes accept only matching request origin', () => {
  assert.equal(sameOrigin(new Request('https://example.com/api/studio', { headers: { origin: 'https://example.com' } })), true);
  assert.equal(sameOrigin(new Request('https://example.com/api/studio', { headers: { origin: 'https://other.example' } })), false);
  assert.equal(sameOrigin(new Request('https://example.com/api/studio')), false);
});
test('a configured authenticator rejects missing and incorrect codes and invalidates old sessions', async () => {
  const oldSession = makeSession();
  process.env.STUDIO_TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
  try {
    assert.equal(validSession(oldSession), false);
    assert.equal((await verifyTotp('')).valid, false);
    assert.equal((await verifyTotp('abc123')).valid, false);
    const token = await generate({ secret: process.env.STUDIO_TOTP_SECRET });
    const result = await verifyTotp(token);
    assert.equal(result.valid, true);
    if (result.valid) assert.ok(result.timeStep > 0);
  } finally { delete process.env.STUDIO_TOTP_SECRET; }
});
