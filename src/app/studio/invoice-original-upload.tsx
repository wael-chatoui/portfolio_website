'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { InvoiceLanguage } from '@/lib/studio-invoice-i18n';

type Props = {
  name?: string;
  onFile: (data: Record<string, string>) => void;
  fieldError?: string;
  language?: InvoiceLanguage;
};

export default function InvoiceOriginalUpload({ name, onFile, fieldError, language = 'fr' }: Props) {
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const readId = useRef(0);
  useEffect(() => () => { readId.current += 1; }, []);
  const id = useId();
  const en = language === 'en';
  const message = error || fieldError;

  async function select(file?: File) {
    const currentRead = ++readId.current;
    onFile({ sourcePdf: '', sourceName: '' });
    setError('');
    setReading(false);
    if (!file) return;
    if (file.size > 2000000) {
      setError(en ? 'Choose a PDF no larger than 2 MB.' : 'Choisis un PDF de 2 Mo maximum.');
      return;
    }
    setReading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (currentRead !== readId.current) return;
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') {
        setError(en ? 'This file is not a PDF.' : 'Ce fichier n’est pas un PDF.');
        return;
      }
      let value = '';
      for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
      onFile({ sourcePdf: btoa(value), sourceName: file.name });
    } catch {
      if (currentRead === readId.current) setError(en ? 'The PDF could not be read. Choose the file again.' : 'Lecture du PDF impossible. Sélectionne à nouveau le fichier.');
    } finally {
      if (currentRead === readId.current) setReading(false);
    }
  }

  return <div className="invoice-original-upload" aria-busy={reading}>
    <label className="invoice-field"><span>{en ? 'Original PDF' : 'PDF original'} *</span>
      <input type="file" accept="application/pdf,.pdf" data-invoice-field="sourcePdf" data-invoice-start="" aria-invalid={!!message} aria-describedby={`${id}-help${message ? ` ${id}-error` : ''}`} onChange={event => void select(event.target.files?.[0])} />
    </label>
    <p id={`${id}-help`}>{en ? 'PDF, maximum 2 MB. Copy the client, invoice number, dates and amounts below. They are not extracted automatically.' : 'PDF, 2 Mo maximum. Recopie ci-dessous le client, le numéro, les dates et les montants. Ils ne sont pas extraits automatiquement.'}</p>
    {reading && <p role="status">{en ? 'Checking the PDF…' : 'Vérification du PDF…'}</p>}
    {!reading && name && <p role="status">{en ? 'Saved PDF: ' : 'PDF validé : '}{name}</p>}
    {message && <p id={`${id}-error`} className="invoice-field-error" role="alert">{message}</p>}
  </div>;
}
