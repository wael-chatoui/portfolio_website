import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContactHandler } from '../src/lib/contact';

const brief = { name: 'Example Client', email: 'client@example.com', message: 'Connect our CRM to our support tool.' };
const request = (body: unknown) => new Request('https://portfolio.example/api/contact', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const options = { configured: true, from: 'Portfolio <contact@example.com>', to: 'owner@example.com' };

test('only reports success after the provider accepts a real email', async () => {
  const handler = createContactHandler({ ...options, sendEmail: async (payload) => {
    assert.equal(payload.to, options.to);
    assert.equal(payload.replyTo, brief.email);
    assert.ok(payload.text.includes(brief.message));
    return { data: { id: 'accepted-email' }, error: null };
  } });
  const result = await handler(request(brief));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { success: true });
});

test('a returned provider error cannot become a false success', async () => {
  const handler = createContactHandler({ ...options, sendEmail: async () => ({ data: null, error: { name: 'validation_error' } }) });
  const result = await handler(request(brief));
  assert.equal(result.status, 502);
  assert.equal((await result.json()).success, undefined);
});

test('a provider timeout and an empty provider result both fail explicitly', async () => {
  for (const sendEmail of [async () => { throw new Error('timeout'); }, async () => ({ data: null, error: null })]) {
    assert.equal((await createContactHandler({ ...options, sendEmail })(request(brief))).status, 502);
  }
});

test('invalid, empty and oversized fields never reach the provider', async () => {
  let calls = 0;
  const handler = createContactHandler({ ...options, sendEmail: async () => { calls++; return { data: { id: 'unexpected' }, error: null }; } });
  for (const body of [null, [], {}, { ...brief, name: '  ' }, { ...brief, name: { unsafe: true } }, { ...brief, name: 'A\nB' }, { ...brief, email: 'invalid' }, { ...brief, message: 'x'.repeat(6_001) }]) {
    assert.equal((await handler(request(body))).status, 400);
  }
  assert.equal(calls, 0);
});

test('malformed JSON, unsupported bodies and missing configuration have distinct responses', async () => {
  const handler = createContactHandler({ ...options, configured: false, sendEmail: async () => { throw new Error('must not send'); } });
  assert.equal((await handler(request(brief))).status, 503);
  assert.equal((await handler(new Request('https://portfolio.example/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
  assert.equal((await handler(new Request('https://portfolio.example/api/contact', { method: 'POST', body: 'plain text' }))).status, 415);
  assert.equal((await handler(request({ message: 'x'.repeat(20_001) }))).status, 413);
});

test('honeypot submissions are discarded without sending email', async () => {
  const handler = createContactHandler({ ...options, sendEmail: async () => { throw new Error('must not send'); } });
  assert.equal((await handler(request({ ...brief, website: 'spam.example' }))).status, 200);
});
