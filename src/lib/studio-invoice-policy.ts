import { linesForDraft, linesTotal } from './studio-invoice-lines';
export const invoiceTerms = {
  taxRegime: 'franchise',
  discountTerms: 'Aucun escompte pour paiement anticipé.',
  latePenalty: 'Pénalités de retard : taux de refinancement de la BCE applicable majoré de 10 points, à compter du lendemain de l’échéance.',
  recoveryTerms: 'Indemnité forfaitaire pour frais de recouvrement : 40 € en cas de retard de paiement entre professionnels.',
};
export function invoiceNumberParts(value: string): { prefix: string; digits: string; number: number } | null {
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,39}$/.test(value)) return null;
  const m = value.match(/^(.*?)(\d+)$/);
  if (!m || m[2].length > 8) return null;
  return { prefix: m[1], digits: m[2], number: Number(m[2]) };
}
export function invoiceNumberKey(value: string): string {
  const p = invoiceNumberParts(value);
  return p ? `${p.prefix.toUpperCase().replace(/[^A-Z0-9]/g, '')}:${p.number}` : value.toUpperCase();
}
export function followingInvoiceNumber(value: string): string | null {
  const p = invoiceNumberParts(value);
  if (!p || p.number >= 99999999) return null;
  return p.prefix + String(p.number + 1).padStart(p.digits.length, '0');
}
export const parisDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
export function dueDateIn30Days(issueDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return '';
  const date = new Date(issueDate + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== issueDate) return '';
  date.setUTCDate(date.getUTCDate() + 30);
  return date.getUTCFullYear() <= 9999 ? date.toISOString().slice(0, 10) : '';
}

export type InvoiceFieldError = { field: string; message: string };

export function invoiceIssueProblem(data: Record<string, string>): InvoiceFieldError | null {
  if (!data.seller || !data.sellerAddress || !/\bEI\b|entrepreneur individuel/i.test(data.seller)) {
    return { field: 'seller', message: 'Complète le nom avec la mention EI et l’adresse dans « Mes coordonnées de facturation ».' };
  }
  if (!/^\d{14}$/.test((data.sellerSiret || '').replace(/\s/g, ''))) {
    return { field: 'sellerSiret', message: 'Vérifie ton SIRET dans « Mes coordonnées de facturation ».' };
  }
  if (!data.client) return { field: 'client', message: 'Renseigne le nom du client.' };
  if (!data.clientAddress) {
    return { field: 'clientAddress', message: data.clientId
      ? 'Renseigne l’adresse de facturation dans la fiche de ce client.'
      : 'Renseigne l’adresse de facturation du client.' };
  }
  const dates = {
    issueDate: 'Vérifie la date de facture.',
    serviceDate: 'Vérifie la date de prestation.',
    dueDate: 'Vérifie la date d’échéance.',
  };
  for (const [field, message] of Object.entries(dates)) {
    const value = data[field];
    const timestamp = Date.parse(value + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
      return { field, message };
    }
  }
  if (data.dueDate < data.issueDate) return { field: 'dueDate', message: 'L’échéance ne peut pas précéder la date de facture.' };
  if (data.issueDate > parisDate()) return { field: 'issueDate', message: 'La date d’émission ne peut pas être dans le futur.' };
  if (data.taxRegime !== 'franchise' || Number((data.vat || '0').replace(',', '.')) !== 0) {
    return { field: 'conditions', message: 'Ce modèle concerne les prestations en franchise de TVA.' };
  }
  if (!data.iban) return { field: 'iban', message: 'Renseigne l’IBAN dans « Mes coordonnées de facturation ».' };
  if (!data.discountTerms || !data.latePenalty || !data.recoveryTerms) {
    return { field: 'conditions', message: 'Complète les conditions de paiement.' };
  }
  if (linesTotal(linesForDraft(data)) === null || !data.amount) {
    return { field: 'lines', message: 'Renseigne le nom, une quantité positive et un prix valide pour chaque ligne.' };
  }
  return null;
}

// Retain the existing validator interface for callers that only need the message.
export function invoiceIssueError(data: Record<string, string>): string | null {
  return invoiceIssueProblem(data)?.message ?? null;
}
