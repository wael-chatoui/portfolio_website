import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyClientToInvoice } from '../src/lib/studio-billing';
import { clean } from '../src/lib/studio';

test('copies a client’s billing details into a durable draft snapshot', () => {
  const contact = { id: 'contact-1', data: { name: 'Camille', company: 'Ancien nom', legalName: 'Exemple SAS', email: 'contact@example.test', billingEmail: 'factures@example.test', registeredAddress: '1 rue du Siège', billingAddress: '2 rue de Facturation', siret: '123 456 789 00012', vatNumber: 'FR00123456789' } };
  const draft = copyClientToInvoice({ name: 'Prestation', amount: '150' }, contact);
  assert.equal(draft.client, 'Exemple SAS');
  assert.equal(draft.clientAddress, '2 rue de Facturation');
  assert.equal(draft.clientAddressSource, 'billing');
  assert.equal(draft.clientEmail, 'factures@example.test');
  assert.equal(draft.clientSiren, '123456789');
  assert.equal(draft.clientSiret, '123 456 789 00012');
  assert.equal(draft.clientVatNumber, 'FR00123456789');
  assert.equal(draft.amount, '150');
  contact.data.legalName = 'Nouveau nom';
  assert.equal(draft.client, 'Exemple SAS');
  assert.equal(clean('invoice', draft)?.clientSiret, '123 456 789 00012');
});

test('flags an unconfirmed registered address and handles incomplete or old records', () => {
  const oldContact = { id: 'contact-2', data: { name: 'Camille', company: 'Exemple', registeredAddress: '1 rue du Siège', siret: '123' } };
  const draft = copyClientToInvoice({ name: 'Mission' }, oldContact);
  assert.equal(draft.client, 'Exemple');
  assert.equal(draft.clientAddress, '1 rue du Siège');
  assert.equal(draft.clientAddressSource, 'registered');
  assert.equal(draft.clientSiren, '');
  assert.equal(clean('invoice', { name: 'Ancien brouillon', client: 'Ancien client' })?.client, 'Ancien client');
  assert.equal(clean('contact', { name: 'Ancien contact', notes: 'Conserver' })?.notes, 'Conserver');
});
