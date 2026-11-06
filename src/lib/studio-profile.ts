import { invoiceTerms, parisDate, followingInvoiceNumber } from './studio-invoice-policy';
export const billingProfileId = '18f147f3-e2bd-4c42-9c0c-9652e2d55881';
export type BillingProfile = Record<string, string>;

export function newInvoice(profile: BillingProfile | null): Record<string, string> {
  return { ...invoiceTerms, language:'fr', billingMode:'services', issueDate: parisDate(), seller: profile?.name ? (/\bEI\b|entrepreneur individuel/i.test(profile.name) ? profile.name : profile.name + ' EI') : '', sellerAddress: profile?.registeredAddress || '', siren: profile?.siren || '', sellerSiret: profile?.siret || '', iban: profile?.iban || '', paymentTerms: 'Paiement par virement bancaire', status: 'Non payé' };
}

export function editableInvoice(data: Record<string,string>, profile: BillingProfile | null): Record<string,string> {
  if (data.issuedAt) return data;
  const result = { ...newInvoice(profile), ...data };
  const seller = data.seller || profile?.name || '';
  result.seller = seller && !/\bEI\b|entrepreneur individuel/i.test(seller) ? seller + ' EI' : seller;
  result.issueDate = data.issueDate || parisDate();
  for (const [key,value] of Object.entries(invoiceTerms)) result[key] = data[key] || value;
  return result;
}

export function paymentStatus(value?: string): string {
  return value === 'Encaissé' || value === 'Payé' ? 'Payé' : 'Non payé';
}

export function nextInvoiceNumber(last?: string): string | null {
  if (!last) return null;
  return followingInvoiceNumber(/^\d{1,8}$/.test(last) ? `INV${last.padStart(3, '0')}` : last);
}
