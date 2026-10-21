import assert from 'node:assert/strict';
import { test } from 'node:test';
import { campaignUrl } from '../src/lib/site';
import { getProducts } from '../src/lib/products';

test('campaign links preserve the actual product route and contain no personal data', () => {
  const url = new URL(campaignUrl('https://fluent-flow.fr', 'fluent-flow', '/en/teachers?lang=en#access'));
  assert.equal(url.origin, 'https://fluent-flow.fr');
  assert.equal(url.pathname, '/en/teachers');
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(url.hash, '#access');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['lang', 'utm_campaign', 'utm_content', 'utm_medium', 'utm_source']);
  assert.equal(url.searchParams.get('utm_source'), 'portfolio');
});

test('both languages send readers to the correct public teaching page', () => {
  assert.equal(new URL(getProducts(false)[0].href).pathname, '/professeurs');
  assert.equal(new URL(getProducts(true)[0].href).pathname, '/en/teachers');
  for (const english of [false, true]) {
    const products = getProducts(english);
    assert.ok(products.every((p) => p.features.length > 0 && p.cta && p.description));
    assert.ok(products.every((p) => !p.href.includes('supabase') && !p.href.includes('github')));
  }
});
