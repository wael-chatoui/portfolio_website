'use client';

import { useId } from 'react';
import { invoiceDate, invoiceLanguage, invoiceText, invoiceTermsText } from '@/lib/studio-invoice-i18n';
import InvoiceOriginalUpload from './invoice-original-upload';
import { paymentStatus } from '@/lib/studio-profile';
import { displayCents, emptyLine, invoiceBillingMode, lineTotal, linesForDraft, linesTotal, type InvoiceLine } from '@/lib/studio-invoice-lines';

type Contact = { id: string; data: Record<string, string> };
type Props = {
  data: Record<string, string>;
  fieldError?: { field: string; message: string };
  onOriginal: (data: Record<string,string>) => void;
  suggestedNumber: string | null;
  contacts: Contact[];
  onChange: (key: string, value: string) => void;
  onSelectClient: (id: string) => void;
  onLinesChange: (lines: InvoiceLine[]) => void;
};

export default function InvoiceEditor({ data, contacts, onChange, onSelectClient, onLinesChange, suggestedNumber, onOriginal, fieldError }: Props) {
  const errorId = useId();
  const errorProps = (field: string) => ({
    'data-invoice-field': field,
    'aria-invalid': fieldError?.field === field || undefined,
    'aria-describedby': fieldError?.field === field ? `${errorId}-${field}` : undefined,
  });
  const fieldMessage = (field: string) => fieldError?.field === field ? <p id={`${errorId}-${field}`} className="invoice-field-error" role="alert">{fieldError.message}</p> : null;
  const locked = !!data.issuedAt;
  const historical = data.historical === 'yes';
  const automaticDueDate = data.dueDateMode === '30days';
  const language = invoiceLanguage(data.language); const t = invoiceText[language];
  const terms = invoiceTermsText(data, language);
  const daily = invoiceBillingMode(data.billingMode) === 'daily';
  const lines = linesForDraft(data);
  const changeLine = (index: number, field: keyof InvoiceLine, value: string) => onLinesChange(lines.map((line, i) => i === index ? { ...line, [field]: value } : line));
  const legacyTax = !!data.vat && Number(data.vat.replace(',', '.')) !== 0;
  const input = (key: string, label: string, placeholder: string, options?: { type?: string; required?: boolean; disabled?: boolean }) => (
    <label className="invoice-field">
      <span>{label}</span>
      <input {...errorProps(key)} type={options?.type || 'text'} required={options?.required} disabled={options?.disabled} value={data[key] || ''} placeholder={placeholder} onChange={event => onChange(key, event.target.value)} onInput={options?.type === 'date' ? event => onChange(key, event.currentTarget.value) : undefined} />{fieldMessage(key)}
    </label>
  );
  const address = (key: string, label: string) => (
    <label className="invoice-field"><span>{label}</span><textarea {...errorProps(key)} rows={2} value={data[key] || ''} placeholder={language === 'en' ? 'Billing address' : 'Adresse à renseigner'} onChange={event => onChange(key, event.target.value)} />{fieldMessage(key)}</label>
  );
  return <>
    <div className="invoice-document" lang={language}>
    <header className="invoice-document-head"><div><p>{locked ? (historical ? t.importSaved : t.saved) : historical ? t.importPrompt : t.editPrompt}</p></div><label className="invoice-field invoice-number"><span>{t.number}</span><input {...errorProps('invoiceNumber')} disabled={locked} maxLength={40} value={data.invoiceNumber !== undefined ? data.invoiceNumber : suggestedNumber || ''} placeholder={suggestedNumber || 'Ex. INV013'} onChange={e=>onChange('invoiceNumber',e.target.value)}/>{fieldMessage('invoiceNumber')}{!locked&&<small>{historical ? t.importNumberHelp : t.numberHelp}</small>}</label></header>
    {historical && !locked && <><InvoiceOriginalUpload name={data.sourceName} onFile={onOriginal} language={language} fieldError={fieldError?.field === 'sourcePdf' ? fieldError.message : undefined}/><label className="invoice-conflict-option"><input type="checkbox" checked={data.numberConflict === 'yes'} onChange={e=>onChange('numberConflict',e.target.checked ? 'yes' : '')}/><span>Ce PDF porte un numéro déjà utilisé : conserver le numéro d’origine et signaler le conflit.</span></label></>}
    {locked && data.numberConflict === 'yes' && <p className="invoice-warning" role="status">Numéro en doublon sur les documents d’origine. Vérifie les deux factures concernées ; leurs PDF sont conservés.</p>}
    <fieldset className="invoice-editable-content" disabled={locked}>
    <div className="invoice-parties">
      <section className="invoice-client-section" aria-labelledby="invoice-client-title"><h4 id="invoice-client-title">{t.to}</h4>
        {!locked && <label className="invoice-field"><span>{t.selectClient}</span><select data-invoice-start={!historical ? '' : undefined} value={data.clientId || ''} onChange={event => onSelectClient(event.target.value)}><option value="">{t.manualClient}</option>{data.clientId && !contacts.some(contact => contact.id === data.clientId) && <option value={data.clientId}>{t.missingContact}</option>}{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.data.legalName || contact.data.company || contact.data.name}{contact.data.name && contact.data.name !== (contact.data.legalName || contact.data.company) && (contact.data.legalName || contact.data.company) ? ` (${contact.data.name})` : ''}</option>)}</select></label>}
        {data.clientWarning && <p className="invoice-warning">{data.clientWarning}</p>}
        {data.clientAddressSource === 'registered' && <p className="invoice-warning">{t.addressWarning}</p>}
        {(data.clientId || locked) ? <><div {...errorProps('client')} tabIndex={-1}><p className="invoice-seller">{data.client || t.missing}</p>{fieldMessage('client')}</div><div {...errorProps('clientAddress')} tabIndex={-1}><p className="invoice-seller">{data.clientAddress || t.clientAddress + ' : ' + t.missing}{data.clientSiret ? <><br/>SIRET : {data.clientSiret}</> : data.clientSiren ? <><br/>SIREN : {data.clientSiren}</> : null}{data.clientEmail && <><br/>{data.clientEmail}</>}</p>{fieldMessage('clientAddress')}</div>{!locked && <div className="invoice-client-recovery"><button type="button" onClick={() => onSelectClient('')}>{t.manualRecovery}</button><small>{t.manualRecoveryHelp}</small></div>}</> : <>{input('client', t.clientName, language === 'en' ? 'Name or company name' : 'Nom ou raison sociale')}{address('clientAddress', t.clientAddress)}<details className="invoice-details"><summary>{t.otherDetails}</summary>{input('clientSiret', t.clientSiret, t.clientSiret)}{input('clientSiren', t.clientSiren, t.clientSiren)}{input('clientEmail', t.clientEmail, t.clientEmail, { type: 'email' })}</details></>}
      </section>
    </div>
    <div className="invoice-service" {...errorProps('lines')} tabIndex={-1}><div className="invoice-service-heading"><h4>{daily ? t.mission : t.services}</h4>{!historical && <div className="invoice-billing-mode"><label><span>{t.billingMode}</span><select disabled={locked} value={invoiceBillingMode(data.billingMode)} onChange={event=>onChange('billingMode',event.target.value)}><option value="services">{t.servicesMode}</option><option value="daily">{t.dailyMode}</option></select></label>{daily && <p>{t.dailyHelp}</p>}</div>}</div>{fieldMessage('lines')}
      {legacyTax ? <><p className="invoice-warning">Cette facture contient des montants de TVA enregistrés auparavant. Ils sont conservés ; son montant ne peut pas être modifié dans ce modèle simplifié.</p><p>{data.name} · {data.amount} €</p></> : <>
      {lines.map((line, index) => <fieldset className="invoice-line" key={index}><legend>{daily ? t.mission : t.service} {index + 1}</legend>
        <label className="invoice-field"><span>{daily ? t.missionName : t.name} *</span><input required maxLength={120} value={line.name} placeholder={t.namePlaceholder} onChange={event => changeLine(index, 'name', event.target.value)} /></label>
        <details className="invoice-details invoice-line-description" open={!!line.description || undefined}><summary>{t.description}</summary><label className="invoice-field"><span>{t.description}</span><textarea rows={2} maxLength={500} value={line.description} placeholder={t.descriptionPlaceholder} onChange={event => changeLine(index, 'description', event.target.value)} /></label></details>
        <div className="invoice-line-amounts"><label className="invoice-field"><span>{daily ? t.days : t.quantity} *</span><input required inputMode="decimal" maxLength={9} value={line.quantity} onChange={event => changeLine(index, 'quantity', event.target.value)} /></label><label className="invoice-field"><span>{daily ? t.dailyRate : t.unitPrice} *</span><input required inputMode="decimal" maxLength={12} value={line.unitPrice} placeholder={language === 'en' ? '0.00' : '0,00'} onChange={event => changeLine(index, 'unitPrice', event.target.value)} /></label><div className="invoice-line-total"><span>{t.total}</span><strong>{displayCents(lineTotal(line), language)}</strong></div></div>
        {!locked && lines.length > 1 && <button type="button" className="invoice-remove-line" onClick={() => onLinesChange(lines.filter((_, i) => i !== index))}>{daily ? t.removeMission : t.removeService}</button>}
      </fieldset>)}
      {!locked && lines.length < 30 && <button type="button" className="invoice-add-line" onClick={() => onLinesChange([...lines, emptyLine()])}>{daily ? t.addMission : t.addService}</button>}
      <div className="invoice-grand-total"><span>{t.total}</span><strong>{displayCents(linesTotal(lines), language)}</strong></div>
      </>}
    </div>
    <div className="invoice-dates">
      {input('issueDate', t.issueDate, '', { type: 'date', required: true })}
      {input('serviceDate', t.serviceDate, '', { type: 'date', required: !historical })}
      {historical || locked ? input('dueDate', t.dueDate, '', { type: 'date', required: !historical }) : (
        <fieldset className="invoice-due-choice" {...(automaticDueDate ? errorProps('dueDate') : {})} tabIndex={automaticDueDate ? -1 : undefined}>
          <legend>{t.dueHeading}</legend>
          <div className="invoice-due-options">
            <label>
              <input type="radio" name="invoice-due-mode" checked={automaticDueDate} onChange={() => onChange('dueDateMode', '30days')} />
              {t.dueIn30Days}
            </label>
            <label>
              <input type="radio" name="invoice-due-mode" checked={!automaticDueDate} onChange={() => onChange('dueDateMode', 'custom')} />
              {t.customDueDate}
            </label>
          </div>
          {automaticDueDate ? <><output aria-label={t.dueDate}>{invoiceDate(data.dueDate, language)}</output>{fieldMessage('dueDate')}</>
            : input('dueDate', t.dueDate, '', { type: 'date', required: true })}
        </fieldset>
      )}
    </div>
    <details className="invoice-details invoice-billing-details" open={['seller', 'sellerSiret', 'iban', 'conditions'].includes(fieldError?.field || '') || undefined}><summary>{t.billingDetails}</summary>
      <section aria-labelledby="invoice-seller-title"><h4 id="invoice-seller-title">{t.from}</h4>
        <div {...errorProps('seller')} tabIndex={-1}><p className="invoice-seller">{data.seller || t.sellerHelp}{data.sellerAddress && <><br/>{data.sellerAddress}</>}</p>{fieldMessage('seller')}</div>
        <div {...errorProps('sellerSiret')} tabIndex={-1}><p>{data.sellerSiret ? `SIRET : ${data.sellerSiret}` : data.siren ? `SIREN : ${data.siren}` : 'SIRET : —'}</p>{fieldMessage('sellerSiret')}</div>
      </section>
    <div className="invoice-payment" {...errorProps('iban')} tabIndex={-1}><h4>{t.payment}</h4><p>{t.bankTransfer}{data.iban ? <><br/>IBAN : {data.iban}</> : <><br/>{t.ibanHelp}</>}</p>{fieldMessage('iban')}<p className="invoice-thanks">{t.thanks}</p></div>
    <details className="invoice-details" {...errorProps('conditions')} tabIndex={-1} open={fieldError?.field === 'conditions' || undefined}><summary>{t.conditions}</summary>{fieldMessage('conditions')}{input('purchaseOrder', t.po, language === 'en' ? 'Optional reference' : 'Référence facultative')}<label className="invoice-field"><span>{t.discount}</span><input value={terms.discountTerms} onChange={e=>onChange('discountTerms',e.target.value)}/></label><label className="invoice-field"><span>{t.latePenalty}</span><textarea rows={3} value={terms.latePenalty} onChange={e=>onChange('latePenalty',e.target.value)}/></label><p>{terms.recoveryTerms}</p></details>
    </details>
    </fieldset>
    {!historical && <details className="invoice-details invoice-settings"><summary>{t.invoiceOptions}</summary><div className="invoice-language"><label><span>{t.languageLabel}</span><select value={language} onChange={event=>onChange('language',event.target.value)}><option value="fr">Français</option><option value="en">English</option></select></label><p>{t.languageHelp}</p></div>
    </details>}

    <details className="invoice-details"><summary>{t.internalNotes}</summary><label className="invoice-field"><span>{t.notes}</span><textarea disabled={locked} rows={2} value={data.notes || ''} onChange={event => onChange('notes', event.target.value)} /></label></details>
    <p className="invoice-footnote">{historical ? t.originalDownload : t.exemption}</p>
  </div>
  {(historical || locked) && <section className="invoice-tracking-panel" aria-label={t.tracking}><h4>{t.tracking}</h4><div className="invoice-tracking">{data.paymentUnconfirmed === 'yes' && <p>{t.paymentConfirm}</p>}<label className="invoice-field"><span>{t.payment}</span><select value={data.paymentUnconfirmed === 'yes' ? 'À confirmer' : paymentStatus(data.status)} onChange={event => {if(event.target.value !== 'À confirmer') onChange('status', event.target.value);}}>{data.paymentUnconfirmed === 'yes' && <option value="À confirmer">{t.unconfirmed}</option>}<option value="Non payé">{t.unpaid}</option><option value="Payé">{t.paid}</option></select></label><label className="invoice-declaration"><input type="checkbox" checked={data.declared === 'yes'} onChange={event=>onChange('declared',event.target.checked ? 'yes' : '')}/><span>{t.declared}</span></label></div>
    <p className="invoice-tracking-help">{t.declarationHelp}</p>
  </section>}</>;
}
