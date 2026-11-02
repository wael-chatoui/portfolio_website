export const billingProfileId = '18f147f3-e2bd-4c42-9c0c-9652e2d55881';
export type BillingProfile = Record<string, string>;

export function newInvoice(profile: BillingProfile | null): Record<string, string> {
  return { seller: profile?.name || '', sellerAddress: profile?.registeredAddress || '', siren: profile?.siren || '', sellerSiret: profile?.siret || '', iban: profile?.iban || '', paymentTerms: 'Paiement par virement bancaire', status: 'Non payé' };
}

export function paymentStatus(value?: string): string {
  return value === 'Encaissé' || value === 'Payé' ? 'Payé' : 'Non payé';
}

export function nextInvoiceNumber(last?: string): string | null {
  if (!last || !/^\d{1,8}$/.test(last) || Number(last) >= 99999999) return null;
  return `INV${String(Number(last) + 1).padStart(3, '0')}`;
}
