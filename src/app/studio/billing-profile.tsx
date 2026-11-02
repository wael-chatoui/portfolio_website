'use client';

import { useState, type FormEvent } from 'react';
import type { BillingProfile } from '@/lib/studio-profile';

type Props = { profile: BillingProfile | null; onSaved: () => Promise<void> };
export default function BillingProfileForm({ profile, onSaved }: Props) {
  const [data, setData] = useState<BillingProfile>(profile || {});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/studio/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await onSaved(); setNotice('Coordonnées enregistrées pour les nouvelles factures.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Enregistrement impossible.'); }
    finally { setBusy(false); }
  }
  const field = (key: string, label: string) => <label>{label}<input required={key === 'name'} value={data[key] || ''} onChange={e => setData({ ...data, [key]: e.target.value })} /></label>;
  return <details className="studio-profile"><summary>Mes coordonnées de facturation</summary><p>Ces informations privées sont copiées dans tes nouvelles factures. Un changement ne modifie pas les factures existantes. Pour la numérotation, saisis uniquement les chiffres du dernier numéro utilisé.</p><form onSubmit={save}><div className="studio-form-grid">{field('name', 'Nom ou entreprise')}{field('siren', 'SIREN')}{field('siret', 'SIRET')}{field('iban', 'IBAN')}{field('invoiceSequence', 'Dernier numéro de facture (chiffres)')}<label className="wide">Adresse professionnelle<textarea rows={2} value={data.registeredAddress || ''} onChange={e => setData({ ...data, registeredAddress: e.target.value })}/></label></div><button className="studio-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer mes coordonnées'}</button>{notice && <p role="status">{notice}</p>}</form></details>;
}
