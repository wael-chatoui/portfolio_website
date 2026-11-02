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
export function invoiceIssueError(data: Record<string,string>): string | null {
  if (!data.seller || !data.sellerAddress || !/\bEI\b|entrepreneur individuel/i.test(data.seller)) return 'Renseigne le nom complet avec la mention EI et l’adresse professionnelle dans tes coordonnées.';
  if (!/^\d{14}$/.test((data.sellerSiret || '').replace(/\s/g,''))) return 'Vérifie ton SIRET dans tes coordonnées de facturation.';
  if (!data.client || !data.clientAddress) return 'Renseigne le nom et l’adresse de facturation du client dans sa fiche.';
  if (!data.issueDate || !data.serviceDate || !data.dueDate) return 'Renseigne la date de facture, la date de prestation et l’échéance.';
  for (const key of ['issueDate', 'serviceDate', 'dueDate']) {
    const timestamp = Date.parse(data[key] + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data[key]) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== data[key]) return 'Une des dates est invalide.';
  }
  if (data.dueDate < data.issueDate) return 'L’échéance ne peut pas précéder la date de facture.';
  if (data.issueDate > parisDate()) return 'La date d’émission ne peut pas être dans le futur.';
  if (data.taxRegime !== 'franchise' || Number((data.vat || '0').replace(',','.')) !== 0) return 'Ce modèle concerne les prestations en franchise de TVA.';
  if (!data.iban || !data.discountTerms || !data.latePenalty || !data.recoveryTerms) return 'Complète les coordonnées bancaires et les conditions de paiement.';
  if (linesTotal(linesForDraft(data)) === null || !data.amount) return 'Vérifie les prestations, quantités et prix.';
  return null;
}
