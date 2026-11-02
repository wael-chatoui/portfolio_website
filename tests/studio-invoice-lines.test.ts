import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clean } from '../src/lib/studio';
import { lineTotal, linesForDraft, linesTotal, formatCents, parseLines } from '../src/lib/studio-invoice-lines';

test('quantities, cents and rounding produce the expected invoice total', () => {
  const lines = [{ name: 'Site', description: 'Création', quantity: '3', unitPrice: '70,00' }, { name: 'Maintenance', description: 'Suivi', quantity: '1,5', unitPrice: '30.10' }];
  assert.equal(lineTotal(lines[0]), 21000);
  assert.equal(lineTotal(lines[1]), 4515);
  assert.equal(linesTotal(lines), 25515);
  assert.equal(lineTotal({ ...lines[0], quantity: '0,5', unitPrice: '0,01' }), 1);
  assert.equal(formatCents(linesTotal(lines)!), '255.15');
  const data = { name: 'Site', items: JSON.stringify(lines), amount: '255,15' };
  assert.equal(clean('invoice', data)?.items, data.items);
  assert.equal(clean('invoice', { ...data, amount: '254,15' }), null);
});

test('rejects invalid quantities, incomplete lines and oversized totals', () => {
  const base = { name: 'Mission', description: '', quantity: '1', unitPrice: '10' };
  assert.equal(lineTotal({ ...base, quantity: '0' }), null);
  assert.equal(lineTotal({ ...base, quantity: '-1' }), null);
  assert.equal(lineTotal({ ...base, unitPrice: '2,999' }), null);
  assert.equal(linesTotal([{ ...base, name: '' }]), null);
  assert.equal(lineTotal({ ...base, quantity: '999999', unitPrice: '999999999' }), null);
  assert.equal(parseLines('[{"name":null}]'), null);
});

test('previous drafts remain editable as one line', () => {
  const lines = linesForDraft({ name: 'Ancienne mission', amount: '42,50' });
  assert.deepEqual(lines[0], { name: 'Ancienne mission', description: '', quantity: '1', unitPrice: '42,50' });
  assert.equal(linesTotal(lines), 4250);
  assert.equal(clean('invoice', { name: 'Ancienne mission', amount: '42,50' })?.amount, '42,50');
});
