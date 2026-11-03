import { test } from 'node:test';
import assert from 'node:assert/strict';
import { revenueTotals } from '../src/lib/studio-revenue';

test('revenue counts confirmed payments and declared revenue is a subset, including older paid statuses', () => {
  const invoice = (data: Record<string, string>) => ({ kind: 'invoice', data });
  const records = [
    invoice({ amount: '420', status: 'Payé', declared: 'yes' }),
    invoice({ amount: '12,50', status: 'Payé' }),
    invoice({ amount: '0.10', status: 'Encaissé', declared: 'yes' }),
    invoice({ amount: '0.20', status: 'Encaissé' }),
    invoice({ amount: '900', status: 'Non payé', declared: 'yes' }),
    invoice({ amount: '800', status: 'Payé', paymentUnconfirmed: 'yes', declared: 'yes' }),
    { kind: 'expense', data: { amount: '100', status: 'Payé', declared: 'yes' } },
  ];
  assert.deepEqual(revenueTotals(records), { income: 43280, declared: 42010 });
  assert.deepEqual(revenueTotals(records.map(record => ({ ...record, data: { ...record.data, declared: '' } }))), { income: 43280, declared: 0 });
});

test('empty and invalid amounts cannot corrupt dashboard revenue', () => {
  assert.deepEqual(revenueTotals([]), { income: 0, declared: 0 });
  assert.deepEqual(revenueTotals(['', '-1', 'NaN', '1.234'].map(amount => ({ kind: 'invoice', data: { amount, status: 'Payé', declared: 'yes' } }))), { income: 0, declared: 0 });
});
