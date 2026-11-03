import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceDate, invoiceLanguage, invoiceQuantity, invoiceTermsText } from '../src/lib/studio-invoice-i18n';
import { invoiceTerms } from '../src/lib/studio-invoice-policy';
import { displayCents, linesTotal } from '../src/lib/studio-invoice-lines';
import { clean } from '../src/lib/studio';

test('invoice language stays compatible with existing records and rejects unsupported stored values', () => {
  assert.equal(invoiceLanguage(undefined),'fr');
  assert.equal(clean('invoice',{name:'Mission',language:'en'})?.language,'en');
  assert.equal(clean('invoice',{name:'Mission'})?.language,'');
  assert.equal(clean('invoice',{name:'Mission',language:'de'}),null);
});

test('standard payment terms translate without changing a custom agreement', () => {
  const terms = invoiceTermsText({...invoiceTerms,discountTerms:'Escompte de 2 % à 10 jours.'},'en');
  assert.equal(terms.discountTerms,'Escompte de 2 % à 10 jours.');
  assert.match(terms.latePenalty,/10 percentage points/);
  assert.match(terms.recoveryTerms,/€40/);
  assert.equal(invoiceTermsText(terms,'fr').latePenalty,invoiceTerms.latePenalty);
  assert.equal(invoiceTermsText({},'en').discountTerms,'');
});

test('English formatting changes presentation while preserving amounts and unambiguous dates', () => {
  const amount=linesTotal([{name:'Mission',description:'',quantity:'1,5',unitPrice:'280'}]);
  assert.equal(amount,42000);
  assert.equal(displayCents(amount,'en'),'€420.00');
  assert.equal(invoiceQuantity('1,5','en'),'1.5');
  assert.equal(invoiceDate('2026-11-03','en'),'03 Nov 2026');
  assert.equal(invoiceDate('2026-11-03','fr'),'03/11/2026');
  assert.equal(invoiceDate('2026-02-30','en'),'To be completed');
});
