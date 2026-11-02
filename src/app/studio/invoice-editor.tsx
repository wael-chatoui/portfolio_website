'use client';

import InvoiceOriginalUpload from './invoice-original-upload';
import { paymentStatus } from '@/lib/studio-profile';
import { displayCents, emptyLine, lineTotal, linesForDraft, linesTotal, type InvoiceLine } from '@/lib/studio-invoice-lines';

type Contact = { id: string; data: Record<string, string> };
type Props = {
  data: Record<string, string>;
  onOriginal: (data: Record<string,string>) => void;
  suggestedNumber: string | null;
  contacts: Contact[];
  onChange: (key: string, value: string) => void;
  onSelectClient: (id: string) => void;
  onLinesChange: (lines: InvoiceLine[]) => void;
};

export default function InvoiceEditor({ data, contacts, onChange, onSelectClient, onLinesChange, suggestedNumber, onOriginal }: Props) {
  const locked = !!data.issuedAt;
  const historical = data.historical === 'yes';
  const lines = linesForDraft(data);
  const changeLine = (index: number, field: keyof InvoiceLine, value: string) => onLinesChange(lines.map((line, i) => i === index ? { ...line, [field]: value } : line));
  const legacyTax = !!data.vat && Number(data.vat.replace(',', '.')) !== 0;
  const input = (key: string, label: string, placeholder: string, options?: { type?: string; required?: boolean; disabled?: boolean }) => (
    <label className="invoice-field">
      <span>{label}</span>
      <input type={options?.type || 'text'} required={options?.required} disabled={options?.disabled} value={data[key] || ''} placeholder={placeholder} onChange={event => onChange(key, event.target.value)} onInput={options?.type === 'date' ? event => onChange(key, event.currentTarget.value) : undefined} />
    </label>
  );
  const address = (key: string, label: string) => (
    <label className="invoice-field"><span>{label}</span><textarea rows={2} value={data[key] || ''} placeholder="Adresse à renseigner" onChange={event => onChange(key, event.target.value)} /></label>
  );
  return <div className="invoice-document">
    <header className="invoice-document-head"><div><span className="invoice-kicker">{historical ? 'FACTURE IMPORTÉE' : 'FACTURE'}</span><h3>Facture</h3><p>{locked ? 'Facture enregistrée. Seul le paiement reste modifiable.' : historical ? 'Reprends le numéro et les montants du PDF original.' : 'Complète les informations puis crée la facture.'}</p></div><label className="invoice-field invoice-number"><span>Numéro de facture</span><input disabled={locked} maxLength={40} value={data.invoiceNumber !== undefined ? data.invoiceNumber : suggestedNumber || ''} placeholder={suggestedNumber || 'Ex. INV013'} onChange={e=>onChange('invoiceNumber',e.target.value)}/>{!locked&&<small>{historical ? 'Numéro exact du document d’origine.' : 'Proposé automatiquement, modifiable avant création.'}</small>}</label></header>
    {historical && !locked && <InvoiceOriginalUpload name={data.sourceName} onFile={onOriginal}/>}
    <fieldset className="invoice-editable-content" disabled={locked}>
    <div className="invoice-parties">
      <section aria-labelledby="invoice-seller-title"><h4 id="invoice-seller-title">De</h4>
        <p className="invoice-seller">{data.seller || 'Coordonnées à renseigner dans « Mes coordonnées de facturation »'}{data.sellerAddress && <><br/>{data.sellerAddress}</>}{data.sellerSiret ? <><br/>SIRET : {data.sellerSiret}</> : data.siren ? <><br/>SIREN : {data.siren}</> : null}</p>
      </section>
      <section aria-labelledby="invoice-client-title"><h4 id="invoice-client-title">À</h4>
        {!locked && <label className="invoice-field"><span>Choisir un client</span><select value={data.clientId || ''} onChange={event => onSelectClient(event.target.value)}><option value="">Saisie manuelle</option>{data.clientId && !contacts.some(contact => contact.id === data.clientId) && <option value={data.clientId}>Fiche client introuvable</option>}{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.data.legalName || contact.data.company || contact.data.name}{contact.data.name && contact.data.name !== (contact.data.legalName || contact.data.company) && (contact.data.legalName || contact.data.company) ? ` (${contact.data.name})` : ''}</option>)}</select></label>}
        {data.clientWarning && <p className="invoice-warning">{data.clientWarning}</p>}
        {data.clientAddressSource === 'registered' && <p className="invoice-warning">Adresse du siège : vérifie qu’elle convient pour la facturation.</p>}
        {(data.clientId || locked) ? <p className="invoice-seller">{data.client || 'Nom à renseigner'}{data.clientAddress && <><br/>{data.clientAddress}</>}{data.clientSiret ? <><br/>SIRET : {data.clientSiret}</> : data.clientSiren ? <><br/>SIREN : {data.clientSiren}</> : null}{data.clientEmail && <><br/>{data.clientEmail}</>}</p> : <>{input('client', 'Nom du client', 'Nom ou raison sociale')}{address('clientAddress', 'Adresse du client')}{input('clientSiret', 'SIRET du client', 'SIRET du client')}<details className="invoice-details"><summary>Autres coordonnées du client</summary>{input('clientSiren', 'SIREN du client', 'SIREN du client')}{input('clientEmail', 'E-mail du client', 'E-mail du client', { type: 'email' })}</details></>}
      </section>
    </div>
    <div className="invoice-service"><h4>Prestations</h4>
      {legacyTax ? <><p className="invoice-warning">Cette facture contient des montants de TVA enregistrés auparavant. Ils sont conservés ; son montant ne peut pas être modifié dans ce modèle simplifié.</p><p>{data.name} · {data.amount} €</p></> : <>
      {lines.map((line, index) => <fieldset className="invoice-line" key={index}><legend>Prestation {index + 1}</legend>
        <label className="invoice-field"><span>Nom de la prestation *</span><input required maxLength={120} value={line.name} placeholder="Ex. Création de site" onChange={event => changeLine(index, 'name', event.target.value)} /></label>
        <label className="invoice-field"><span>Description</span><textarea rows={2} maxLength={500} value={line.description} placeholder="Détail de la prestation" onChange={event => changeLine(index, 'description', event.target.value)} /></label>
        <div className="invoice-line-amounts"><label className="invoice-field"><span>Quantité *</span><input required inputMode="decimal" maxLength={9} value={line.quantity} onChange={event => changeLine(index, 'quantity', event.target.value)} /></label><label className="invoice-field"><span>Prix unitaire en € *</span><input required inputMode="decimal" maxLength={12} value={line.unitPrice} placeholder="0,00" onChange={event => changeLine(index, 'unitPrice', event.target.value)} /></label><div className="invoice-line-total"><span>Total</span><strong>{displayCents(lineTotal(line))}</strong></div></div>
        {!locked && lines.length > 1 && <button type="button" className="invoice-remove-line" onClick={() => onLinesChange(lines.filter((_, i) => i !== index))}>Supprimer cette prestation</button>}
      </fieldset>)}
      {!locked && lines.length < 30 && <button type="button" className="invoice-add-line" onClick={() => onLinesChange([...lines, emptyLine()])}>+ Ajouter une prestation</button>}
      <div className="invoice-grand-total"><span>Total</span><strong>{displayCents(linesTotal(lines))}</strong></div>
      </>}
    </div>
    <div className="invoice-dates">{input('issueDate', 'Date de facture', '', { type: 'date', required:true })}{input('serviceDate', 'Date de prestation', '', { type: 'date', required:!historical })}{input('dueDate', 'Date limite de paiement', '', { type: 'date', required:!historical })}</div>
    <div className="invoice-payment"><h4>Paiement</h4><p>Par virement bancaire{data.iban ? <><br/>IBAN : {data.iban}</> : <><br/>IBAN à renseigner dans « Mes coordonnées de facturation »</>}</p><p className="invoice-thanks">Merci de votre confiance</p></div>
    <details className="invoice-details"><summary>Conditions de facturation</summary>{input('purchaseOrder', 'Bon de commande, si fourni', 'Référence facultative')}{input('discountTerms', 'Escompte', '')}<label className="invoice-field"><span>Pénalités de retard</span><textarea rows={3} value={data.latePenalty||''} onChange={e=>onChange('latePenalty',e.target.value)}/></label><p>{data.recoveryTerms}</p></details>
    </fieldset><div className="invoice-tracking">{data.paymentUnconfirmed === 'yes' && <p>État du paiement à confirmer.</p>}<label className="invoice-field"><span>Paiement</span><select value={data.paymentUnconfirmed === 'yes' ? 'À confirmer' : paymentStatus(data.status)} onChange={event => {if(event.target.value !== 'À confirmer') onChange('status', event.target.value);}}>{data.paymentUnconfirmed === 'yes' && <option>À confirmer</option>}<option>Non payé</option><option>Payé</option></select></label></div>
    <details className="invoice-details"><summary>Notes internes</summary><label className="invoice-field"><span>Notes</span><textarea disabled={locked} rows={2} value={data.notes || ''} onChange={event => onChange('notes', event.target.value)} /></label></details>
    <p className="invoice-footnote">{historical ? 'Le téléchargement restitue le PDF original conservé.' : 'TVA non applicable, art. 293 B du CGI.'}</p>
  </div>;
}
