import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsExcluded, analyticsExclusionCookie, filterAnalyticsEvent, privateAnalyticsPath } from '../src/lib/analytics-policy';

test('owner exclusion survives logout, defaults on after sign-in, and honors an explicit browser preference', () => {
  assert.equal(analyticsExcluded('', true), true);
  assert.equal(analyticsExcluded('', false), false);
  assert.equal(analyticsExcluded(`${analyticsExclusionCookie}=1; other=value`, false), true);
  assert.equal(analyticsExcluded(`other=1; ${analyticsExclusionCookie}=0`, true), false);
  assert.equal(analyticsExcluded(`${analyticsExclusionCookie}=invalid`, true), true);
  assert.equal(analyticsExcluded(`not_${analyticsExclusionCookie}=1`, false), false);
});

test('private routes and encoded variants never produce analytics events', () => {
  for (const path of ['/studio', '/studio/', '/studio/invoices', '/%73tudio', '/Studio', '/studio%2Finvoices', '/api/studio/records', '/_next/static/a.js', '/_vercel/insights/view', '/%broken']) {
    assert.equal(privateAnalyticsPath(path), true, path);
    assert.equal(filterAnalyticsEvent({ type: 'pageview', url: `https://example.com${path}` }, false), null, path);
  }
  assert.equal(privateAnalyticsPath('/studio-photographie'), false);
  assert.equal(filterAnalyticsEvent({ url: 'invalid' }, false), null);
  assert.equal(filterAnalyticsEvent({ url: 'javascript:alert(1)' }, false), null);
});

test('only public visits without exclusion pass and their query strings and fragments are removed', () => {
  const event = { type:'pageview', url:'https://example.com/produits?email=private@example.test#private-fragment' };
  assert.equal(filterAnalyticsEvent(event, true), null);
  assert.deepEqual(filterAnalyticsEvent(event, false), { type:'pageview', url:'https://example.com/produits' });
  assert.equal(event.url.includes('?email='), true, 'the input event is not mutated');
});
