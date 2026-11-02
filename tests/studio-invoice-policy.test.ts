import { test } from 'node:test';
import assert from 'node:assert/strict';
import { followingInvoiceNumber, invoiceIssueError, invoiceNumberKey, invoiceTerms } from '../src/lib/studio-invoice-policy';

const invoice = { ...invoiceTerms, name:'Prestation exemple', seller:'Entreprise Exemple EI',sellerAddress:'1 rue Exemple',sellerSiret:'12345678900012',client:'Société Exemple',clientAddress:'2 rue Exemple',iban:'FR0000000000000000000000000',issueDate:'2020-02-28',serviceDate:'2020-02-28',dueDate:'2020-03-28',amount:'420',items:JSON.stringify([{name:'Mission',description:'',quantity:'2',unitPrice:'210'}]) };

test('number variants cannot reuse an issued number and the next number keeps its format', () => {
  assert.equal(invoiceNumberKey('INV012'), invoiceNumberKey('INV-0012'));
  assert.equal(invoiceNumberKey('inv/12'), invoiceNumberKey('INV-0012'));
  assert.notEqual(invoiceNumberKey('INV2026-012'), invoiceNumberKey('INV2025-012'));
  assert.equal(followingInvoiceNumber('INV-0012'),'INV-0013');
  assert.equal(followingInvoiceNumber('2026/099'),'2026/100');
  assert.equal(followingInvoiceNumber('INV99999999'),null);
});

test('a service invoice needs identified parties, dates and payment conditions before creation', () => {
  assert.equal(invoiceIssueError(invoice),null);
  for (const key of ['sellerAddress','sellerSiret','clientAddress','issueDate','serviceDate','dueDate','iban','latePenalty']) assert.notEqual(invoiceIssueError({...invoice,[key]:''}),null,key);
  assert.notEqual(invoiceIssueError({...invoice,seller:'Entreprise Exemple'}),null);
  assert.notEqual(invoiceIssueError({...invoice,vat:'20'}),null);
});

test('impossible dates, past due dates and future issue dates are refused', () => {
  assert.notEqual(invoiceIssueError({...invoice,serviceDate:'2020-02-30'}),null);
  assert.notEqual(invoiceIssueError({...invoice,dueDate:'2020-02-27'}),null);
  assert.notEqual(invoiceIssueError({...invoice,issueDate:'2099-01-01',dueDate:'2099-02-01'}),null);
  assert.equal(invoiceIssueError({...invoice,serviceDate:'2020-02-29'}),null);
});
