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

test('invoice numbering advances from the latest saved number', async () => {
  const { nextInvoiceNumber } = await import('../src/lib/studio-profile');
  assert.equal(nextInvoiceNumber('11'), 'INV012');
  assert.equal(nextInvoiceNumber('99'), 'INV100');
  assert.equal(nextInvoiceNumber(''), null);
  assert.equal(nextInvoiceNumber('abc'), null);
  assert.equal(nextInvoiceNumber('99999999'), null);
});

test('previous preparations receive the fields needed for creation without changing recorded invoices', async () => {
  const { editableInvoice } = await import('../src/lib/studio-profile');
  const old = { name:'Mission',seller:'Entreprise Exemple',invoiceNumber:'INV012',client:'Client Exemple',iban:'FR00' };
  const editable = editableInvoice(old,null);
  assert.equal(editable.seller,'Entreprise Exemple EI');
  assert.equal(editable.invoiceNumber,'INV012');
  assert.equal(editable.taxRegime,'franchise');
  assert.match(editable.issueDate,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(old.seller,'Entreprise Exemple');
  const issued = {...old,issuedAt:'2026-10-18T10:00:00.000Z'};
  assert.strictEqual(editableInvoice(issued,null),issued);
});
