import { invoiceTerms } from './studio-invoice-policy';

export type InvoiceLanguage = 'fr' | 'en';
export const invoiceLanguage = (value?: string): InvoiceLanguage => value === 'en' ? 'en' : 'fr';
const fr = {
  invoice:'Facture', number:'Numéro de facture', numberPrefix:'N°', from:'De', to:'À',
  service:'Prestation', services:'Prestations', name:'Nom de la prestation', description:'Description',
  quantity:'Quantité', quantityShort:'Qté', unitPrice:'Prix unitaire en €', price:'Prix', total:'Total',
  billingMode:'Mode de facturation', servicesMode:'Prestations', dailyMode:'TJM', mission:'Mission', missionName:'Nom de la mission',
  days:'Nombre de jours', daysShort:'Jours', dailyRate:'TJM en € / jour', dailyRateShort:'TJM',
  dailyHelp:'Nombre de jours × tarif journalier. Les fractions de journée sont acceptées, par exemple 0,5.',
  addMission:'+ Ajouter une mission', removeMission:'Supprimer cette mission',
  subtotal:'Total HT', amountDue:'Total à payer', issueDate:'Date de facture', serviceDate:'Date de prestation', dueDate:'Date limite de paiement',
  dueIn30Days:'À 30 jours', customDueDate:'Date personnalisée',
  dueHeading:'Échéance', payment:'Paiement', bankTransfer:'Paiement par virement bancaire', thanks:'Merci de votre confiance',
  exemption:'TVA non applicable, art. 293 B du CGI.', missing:'À renseigner', billingCheck:'Coordonnées de facturation à vérifier.',
  po:'Bon de commande, si fourni', poShort:'Bon de commande', discount:'Escompte', latePenalty:'Pénalités de retard', conditions:'Conditions de facturation',
  selectClient:'Choisir un client', manualClient:'Saisie manuelle', otherDetails:'Autres coordonnées du client', clientName:'Nom du client', clientAddress:'Adresse du client',
  clientSiret:'SIRET du client', clientSiren:'SIREN du client', clientEmail:'E-mail du client',
  addService:'+ Ajouter une prestation', removeService:'Supprimer cette prestation', paid:'Payé', unpaid:'Non payé', unconfirmed:'À confirmer', declared:'Déclaré', declarationHelp:'Indique uniquement si la déclaration a été effectuée.',
  namePlaceholder:'Ex. Création de site', descriptionPlaceholder:'Détail de la prestation',
  editPrompt:'Complète les informations puis crée la facture.', saved:'Facture enregistrée. Langue, paiement et déclaration restent modifiables.',
  numberHelp:'Proposé automatiquement, modifiable avant création.',
};
const en: Record<keyof typeof fr, string> = {
  invoice:'Invoice', number:'Invoice number', numberPrefix:'No.', from:'From', to:'Bill to',
  service:'Service', services:'Services', name:'Service name', description:'Description',
  quantity:'Quantity', quantityShort:'Qty', unitPrice:'Unit price in €', price:'Price', total:'Total',
  billingMode:'Billing mode', servicesMode:'Services', dailyMode:'Daily rate', mission:'Assignment', missionName:'Assignment name',
  days:'Number of days', daysShort:'Days', dailyRate:'Daily rate in € / day', dailyRateShort:'Rate / day',
  dailyHelp:'Number of days × daily rate. Fractions of a day are accepted, for example 0.5.',
  addMission:'+ Add an assignment', removeMission:'Remove this assignment',
  subtotal:'Total excl. VAT', amountDue:'Amount due', issueDate:'Invoice date', serviceDate:'Service date', dueDate:'Payment due date',
  dueIn30Days:'In 30 days', customDueDate:'Custom date',
  dueHeading:'Due date', payment:'Payment', bankTransfer:'Payment by bank transfer', thanks:'Thank you for your business',
  exemption:'VAT not applicable, Article 293 B of the French General Tax Code.', missing:'To be completed', billingCheck:'Please confirm the billing details.',
  po:'Purchase order, if supplied', poShort:'Purchase order', discount:'Early payment discount', latePenalty:'Late payment interest', conditions:'Payment terms',
  selectClient:'Select a client', manualClient:'Manual entry', otherDetails:'Other client details', clientName:'Client name', clientAddress:'Client address',
  clientSiret:'Client SIRET', clientSiren:'Client SIREN', clientEmail:'Client email',
  addService:'+ Add a service', removeService:'Remove this service', paid:'Paid', unpaid:'Unpaid', unconfirmed:'To be confirmed', declared:'Declared', declarationHelp:'Records whether the declaration has been completed.',
  namePlaceholder:'e.g. Website development', descriptionPlaceholder:'Service details',
  editPrompt:'Complete the details, then create the invoice.', saved:'Invoice saved. Language, payment and declaration status can be updated.',
  numberHelp:'Suggested automatically; editable before creation.',
};
export const invoiceText = { fr, en };
const englishTerms = {
  discountTerms:'No discount for early payment.',
  latePenalty:'Late payment interest: the applicable ECB refinancing rate plus 10 percentage points, accruing from the day after the due date.',
  recoveryTerms:'Fixed compensation for recovery costs: €40 for late payments between businesses.',
};
export function invoiceTermsText(data: Record<string,string>, language: InvoiceLanguage) {
  const result = { discountTerms:'', latePenalty:'', recoveryTerms:'' };
  for (const key of Object.keys(result) as (keyof typeof result)[]) {
    const value = data[key] || '';
    result[key] = value === invoiceTerms[key] || value === englishTerms[key]
      ? language === 'en' ? englishTerms[key] : invoiceTerms[key]
      : value;
  }
  return result;
}
export function invoiceDate(value: string | undefined, language: InvoiceLanguage): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return invoiceText[language].missing;
  const timestamp = Date.parse(value+'T12:00:00Z');
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0,10) !== value) return invoiceText[language].missing;
  return language === 'fr' ? value.split('-').reverse().join('/') : new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
}
export function invoiceQuantity(value: string, language: InvoiceLanguage): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'fr-FR',{maximumFractionDigits:2}).format(Number(value.replace(',','.')));
}
