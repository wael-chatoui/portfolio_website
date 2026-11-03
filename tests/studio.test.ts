import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clean, configured, databaseUrl, emailMatches, makeSession, passwordMatches, sameOrigin, validSession } from '../src/lib/studio';

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
test('declaration tracking defaults to unchecked for older invoices and accepts only explicit supported values', () => {
  assert.equal(clean('invoice', { name: 'Ancienne facture' })?.declared, '');
  assert.equal(clean('invoice', { name: 'Facture', declared: 'yes' })?.declared, 'yes');
  assert.equal(clean('invoice', { name: 'Facture', declared: '' })?.declared, '');
  assert.equal(clean('invoice', { name: 'Facture', declared: 'no' }), null);
  assert.equal(clean('invoice', { name: 'Facture', declared: true }), null);
});
test('only the configured email is accepted and changing credentials invalidates old sessions', () => {
  const oldSession = makeSession();
  assert.equal(emailMatches(' CHATouI.Wael40@gmail.com '), true);
  assert.equal(emailMatches('someone@example.com'), false);
  process.env.STUDIO_PASSWORD = 'a-new-fictitious-test-password';
  try {
    assert.equal(validSession(oldSession), false);
  } finally { process.env.STUDIO_PASSWORD = 'only-a-fictitious-test-password'; }
});
