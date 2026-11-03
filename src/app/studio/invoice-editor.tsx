'use client';

import { invoiceLanguage, invoiceText, invoiceTermsText } from '@/lib/studio-invoice-i18n';
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
  const language = invoiceLanguage(data.language); const t = invoiceText[language];
  const terms = invoiceTermsText(data, language);
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
    <label className="invoice-field"><span>{label}</span><textarea rows={2} value={data[key] || ''} placeholder={language === 'en' ? 'Billing address' : 'Adresse à renseigner'} onChange={event => onChange(key, event.target.value)} /></label>
  );
  return <>
    {!historical && <div className="invoice-language"><label><span>Langue de la facture</span><select value={language} onChange={event=>onChange('language',event.target.value)}><option value="fr">Français</option><option value="en">English</option></select></label><p>Les prestations et les conditions personnalisées gardent le texte saisi.</p></div>}
    <div className="invoice-document" lang={language}>
    <header className="invoice-document-head"><div><span className="invoice-kicker">{historical ? 'FACTURE IMPORTÉE' : t.invoice.toUpperCase()}</span><h3>{t.invoice}</h3><p>{locked ? (historical ? 'Facture enregistrée. Seul le paiement reste modifiable.' : t.saved) : historical ? 'Reprends le numéro et les montants du PDF original.' : t.editPrompt}</p></div><label className="invoice-field invoice-number"><span>{t.number}</span><input disabled={locked} maxLength={40} value={data.invoiceNumber !== undefined ? data.invoiceNumber : suggestedNumber || ''} placeholder={suggestedNumber || 'Ex. INV013'} onChange={e=>onChange('invoiceNumber',e.target.value)}/>{!locked&&<small>{historical ? 'Numéro exact du document d’origine.' : t.numberHelp}</small>}</label></header>
    {historical && !locked && <><InvoiceOriginalUpload name={data.sourceName} onFile={onOriginal}/><label className="invoice-conflict-option"><input type="checkbox" checked={data.numberConflict === 'yes'} onChange={e=>onChange('numberConflict',e.target.checked ? 'yes' : '')}/><span>Ce PDF porte un numéro déjà utilisé : conserver le numéro d’origine et signaler le conflit.</span></label></>}
    {locked && data.numberConflict === 'yes' && <p className="invoice-warning" role="status">Numéro en doublon sur les documents d’origine. Vérifie les deux factures concernées ; leurs PDF sont conservés.</p>}
    <fieldset className="invoice-editable-content" disabled={locked}>
    <div className="invoice-parties">
      <section aria-labelledby="invoice-seller-title"><h4 id="invoice-seller-title">{t.from}</h4>
        <p className="invoice-seller">{data.seller || 'Coordonnées à renseigner dans « Mes coordonnées de facturation »'}{data.sellerAddress && <><br/>{data.sellerAddress}</>}{data.sellerSiret ? <><br/>SIRET : {data.sellerSiret}</> : data.siren ? <><br/>SIREN : {data.siren}</> : null}</p>
      </section>
      <section aria-labelledby="invoice-client-title"><h4 id="invoice-client-title">{t.to}</h4>
        {!locked && <label className="invoice-field"><span>{t.selectClient}</span><select value={data.clientId || ''} onChange={event => onSelectClient(event.target.value)}><option value="">{t.manualClient}</option>{data.clientId && !contacts.some(contact => contact.id === data.clientId) && <option value={data.clientId}>Fiche client introuvable</option>}{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.data.legalName || contact.data.company || contact.data.name}{contact.data.name && contact.data.name !== (contact.data.legalName || contact.data.company) && (contact.data.legalName || contact.data.company) ? ` (${contact.data.name})` : ''}</option>)}</select></label>}
        {data.clientWarning && <p className="invoice-warning">{data.clientWarning}</p>}
        {data.clientAddressSource === 'registered' && <p className="invoice-warning">Adresse du siège : vérifie qu’elle convient pour la facturation.</p>}
        {(data.clientId || locked) ? <p className="invoice-seller">{data.client || 'Nom à renseigner'}{data.clientAddress && <><br/>{data.clientAddress}</>}{data.clientSiret ? <><br/>SIRET : {data.clientSiret}</> : data.clientSiren ? <><br/>SIREN : {data.clientSiren}</> : null}{data.clientEmail && <><br/>{data.clientEmail}</>}</p> : <>{input('client', t.clientName, language === 'en' ? 'Name or company name' : 'Nom ou raison sociale')}{address('clientAddress', t.clientAddress)}{input('clientSiret', t.clientSiret, t.clientSiret)}<details className="invoice-details"><summary>{t.otherDetails}</summary>{input('clientSiren', t.clientSiren, t.clientSiren)}{input('clientEmail', t.clientEmail, t.clientEmail, { type: 'email' })}</details></>}
      </section>
    </div>
    <div className="invoice-service"><h4>{t.services}</h4>
      {legacyTax ? <><p className="invoice-warning">Cette facture contient des montants de TVA enregistrés auparavant. Ils sont conservés ; son montant ne peut pas être modifié dans ce modèle simplifié.</p><p>{data.name} · {data.amount} €</p></> : <>
      {lines.map((line, index) => <fieldset className="invoice-line" key={index}><legend>{t.service} {index + 1}</legend>
        <label className="invoice-field"><span>{t.name} *</span><input required maxLength={120} value={line.name} placeholder={t.namePlaceholder} onChange={event => changeLine(index, 'name', event.target.value)} /></label>
        <label className="invoice-field"><span>{t.description}</span><textarea rows={2} maxLength={500} value={line.description} placeholder={t.descriptionPlaceholder} onChange={event => changeLine(index, 'description', event.target.value)} /></label>
        <div className="invoice-line-amounts"><label className="invoice-field"><span>{t.quantity} *</span><input required inputMode="decimal" maxLength={9} value={line.quantity} onChange={event => changeLine(index, 'quantity', event.target.value)} /></label><label className="invoice-field"><span>{t.unitPrice} *</span><input required inputMode="decimal" maxLength={12} value={line.unitPrice} placeholder={language === 'en' ? '0.00' : '0,00'} onChange={event => changeLine(index, 'unitPrice', event.target.value)} /></label><div className="invoice-line-total"><span>{t.total}</span><strong>{displayCents(lineTotal(line), language)}</strong></div></div>
        {!locked && lines.length > 1 && <button type="button" className="invoice-remove-line" onClick={() => onLinesChange(lines.filter((_, i) => i !== index))}>{t.removeService}</button>}
      </fieldset>)}
      {!locked && lines.length < 30 && <button type="button" className="invoice-add-line" onClick={() => onLinesChange([...lines, emptyLine()])}>{t.addService}</button>}
      <div className="invoice-grand-total"><span>{t.total}</span><strong>{displayCents(linesTotal(lines), language)}</strong></div>
      </>}
    </div>
    <div className="invoice-dates">{input('issueDate', t.issueDate, '', { type: 'date', required:true })}{input('serviceDate', t.serviceDate, '', { type: 'date', required:!historical })}{input('dueDate', t.dueDate, '', { type: 'date', required:!historical })}</div>
    <div className="invoice-payment"><h4>{t.payment}</h4><p>{t.bankTransfer}{data.iban ? <><br/>IBAN : {data.iban}</> : <><br/>IBAN à renseigner dans « Mes coordonnées de facturation »</>}</p><p className="invoice-thanks">{t.thanks}</p></div>
    <details className="invoice-details"><summary>{t.conditions}</summary>{input('purchaseOrder', t.po, language === 'en' ? 'Optional reference' : 'Référence facultative')}<label className="invoice-field"><span>{t.discount}</span><input value={terms.discountTerms} onChange={e=>onChange('discountTerms',e.target.value)}/></label><label className="invoice-field"><span>{t.latePenalty}</span><textarea rows={3} value={terms.latePenalty} onChange={e=>onChange('latePenalty',e.target.value)}/></label><p>{terms.recoveryTerms}</p></details>
    </fieldset><div className="invoice-tracking">{data.paymentUnconfirmed === 'yes' && <p>État du paiement à confirmer.</p>}<label className="invoice-field"><span>{t.payment}</span><select value={data.paymentUnconfirmed === 'yes' ? 'À confirmer' : paymentStatus(data.status)} onChange={event => {if(event.target.value !== 'À confirmer') onChange('status', event.target.value);}}>{data.paymentUnconfirmed === 'yes' && <option value="À confirmer">{t.unconfirmed}</option>}<option value="Non payé">{t.unpaid}</option><option value="Payé">{t.paid}</option></select></label></div>
    <details className="invoice-details"><summary>Notes internes</summary><label className="invoice-field"><span>Notes</span><textarea disabled={locked} rows={2} value={data.notes || ''} onChange={event => onChange('notes', event.target.value)} /></label></details>
    <p className="invoice-footnote">{historical ? 'Le téléchargement restitue le PDF original conservé.' : t.exemption}</p>
  </div></>;
}
