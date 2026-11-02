'use client';

type Contact = { id: string; data: Record<string, string> };
type Props = {
  data: Record<string, string>;
  contacts: Contact[];
  onChange: (key: string, value: string) => void;
  onSelectClient: (id: string) => void;
};

export default function InvoiceEditor({ data, contacts, onChange, onSelectClient }: Props) {
  const legacyTax = !!data.vat && Number(data.vat.replace(',', '.')) !== 0;
  const input = (key: string, label: string, placeholder: string, options?: { type?: string; required?: boolean; disabled?: boolean }) => (
    <label className="invoice-field">
      <span>{label}</span>
      <input type={options?.type || 'text'} required={options?.required} disabled={options?.disabled} value={data[key] || ''} placeholder={placeholder} onChange={event => onChange(key, event.target.value)} />
    </label>
  );
  const address = (key: string, label: string) => (
    <label className="invoice-field"><span>{label}</span><textarea rows={2} value={data[key] || ''} placeholder="Adresse à renseigner" onChange={event => onChange(key, event.target.value)} /></label>
  );
  return <div className="invoice-document">
    <header className="invoice-document-head"><div><span className="invoice-kicker">DOCUMENT DE TRAVAIL</span><h3>Brouillon de facture</h3><p>Complète directement les informations ci-dessous.</p></div><span className="invoice-draft-tag">Brouillon</span></header>
    <div className="invoice-parties">
      <section aria-labelledby="invoice-seller-title"><h4 id="invoice-seller-title">De</h4>
        {input('seller', 'Nom du prestataire', 'Ton nom ou entreprise')}
        {address('sellerAddress', 'Adresse professionnelle')}
        {input('siren', 'SIREN du prestataire', 'Ton SIREN')}
      </section>
      <section aria-labelledby="invoice-client-title"><h4 id="invoice-client-title">À</h4>
        <label className="invoice-field"><span>Choisir un client</span><select value={data.clientId || ''} onChange={event => onSelectClient(event.target.value)}><option value="">Saisie manuelle</option>{data.clientId && !contacts.some(contact => contact.id === data.clientId) && <option value={data.clientId}>Fiche client introuvable</option>}{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.data.legalName || contact.data.company || contact.data.name}{contact.data.name && contact.data.name !== (contact.data.legalName || contact.data.company) && (contact.data.legalName || contact.data.company) ? ` (${contact.data.name})` : ''}</option>)}</select></label>
        {data.clientWarning && <p className="invoice-warning">{data.clientWarning}</p>}
        {data.clientAddressSource === 'registered' && <p className="invoice-warning">Adresse du siège : vérifie qu’elle convient pour la facturation.</p>}
        {input('client', 'Nom du client', 'Nom ou raison sociale')}
        {address('clientAddress', 'Adresse du client')}
        {input('clientSiret', 'SIRET du client', 'SIRET du client')}
        <details className="invoice-details"><summary>Autres coordonnées du client</summary>{input('clientSiren', 'SIREN du client', 'SIREN du client')}{input('clientEmail', 'E-mail du client', 'E-mail du client', { type: 'email' })}</details>
      </section>
    </div>
    <div className="invoice-service"><h4>Prestation</h4><div className="invoice-service-row">{input('name', 'Description', 'Ex. Création du site', { required: true })}{input('amount', 'Montant en €', '0,00', { disabled: legacyTax })}</div>
      {legacyTax && <p className="invoice-warning">Ce brouillon contient des montants de TVA enregistrés auparavant. Ils sont conservés ; son montant ne peut pas être modifié dans ce modèle simplifié.</p>}
    </div>
    <div className="invoice-dates">{input('serviceDate', 'Date de prestation', '', { type: 'date' })}{input('dueDate', 'Date limite de paiement', '', { type: 'date' })}</div>
    <label className="invoice-field"><span>Conditions de paiement</span><textarea rows={2} placeholder="Ex. Paiement par virement" value={data.paymentTerms || ''} onChange={event => onChange('paymentTerms', event.target.value)} /></label>
    <div className="invoice-tracking"><label className="invoice-field"><span>Suivi</span><select value={data.status || ''} onChange={event => onChange('status', event.target.value)}><option value="">À préciser</option><option>À préparer</option><option>À facturer</option><option>En attente</option><option>Encaissé</option></select></label>{data.status === 'Encaissé' && input('date', 'Date d’encaissement', '', { type: 'date' })}</div>
    <details className="invoice-details"><summary>Notes internes</summary><label className="invoice-field"><span>Notes</span><textarea rows={2} value={data.notes || ''} onChange={event => onChange('notes', event.target.value)} /></label></details>
    <p className="invoice-footnote">Brouillon de travail, sans numéro ni émission de facture électronique.</p>
  </div>;
}
