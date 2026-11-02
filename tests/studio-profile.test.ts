import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newInvoice, paymentStatus } from '../src/lib/studio-profile';
import { clean } from '../src/lib/studio';

test('new drafts take a private snapshot of billing details', () => {
  const profile = { name: 'Exemple', registeredAddress: 'Adresse fictive', siren: '123456789', siret: '12345678900012', iban: 'FR0000000000000000000000000' };
  const invoice = newInvoice(profile);
  profile.iban = 'autre';
  assert.equal(invoice.iban, 'FR0000000000000000000000000');
  assert.equal(invoice.sellerSiret, '12345678900012');
  assert.equal(invoice.paymentTerms, 'Paiement par virement bancaire');
  assert.equal(invoice.status, 'Non payé');
  assert.equal(clean('invoice', { ...invoice, name: 'Mission' })?.iban, invoice.iban);
  assert.equal(clean('contact', { ...profile, role: 'billing-profile' })?.role, 'billing-profile');
});
test('old statuses remain understandable in the simplified paid state', () => {
  assert.equal(paymentStatus('Encaissé'), 'Payé');
  assert.equal(paymentStatus('Payé'), 'Payé');
  assert.equal(paymentStatus('À facturer'), 'Non payé');
  assert.equal(paymentStatus(), 'Non payé');
});
