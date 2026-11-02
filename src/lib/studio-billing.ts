export type StudioContact = { id: string; data: Record<string, string> };

/** Copy billing details into the draft; later client edits must not rewrite it. */
export function copyClientToInvoice(invoice: Record<string, string>, contact: StudioContact): Record<string, string> {
  const data = contact.data;
  const siretDigits = (data.siret || '').replace(/\s/g, '');
  return {
    ...invoice,
    clientId: contact.id,
    client: data.legalName || data.company || data.name || '',
    clientAddress: data.billingAddress || data.registeredAddress || '',
    clientAddressSource: data.billingAddress ? 'billing' : data.registeredAddress ? 'registered' : '',
    clientEmail: data.billingEmail || data.email || '',
    clientWarning: data.billingWarning || '',
    clientSiren: data.siren || (/^\d{14}$/.test(siretDigits) ? siretDigits.slice(0, 9) : ''),
    clientSiret: data.siret || '',
    clientVatNumber: data.vatNumber || '',
  };
}
