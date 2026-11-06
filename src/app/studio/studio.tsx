'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { copyClientToInvoice } from '@/lib/studio-billing';
import { revenueTotals } from '@/lib/studio-revenue';
import InvoiceEditor from './invoice-editor';
import BillingProfileForm from './billing-profile';
import SiteTraffic from './site-traffic';
import { editableInvoice, newInvoice, nextInvoiceNumber, paymentStatus, type BillingProfile } from '@/lib/studio-profile';
import { formatCents, linesForDraft, linesTotal, parseLines, type InvoiceLine } from '@/lib/studio-invoice-lines';
import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, FolderKanban, LayoutDashboard, LogOut, Plus, ShieldCheck, ReceiptText, Search, Users, Wallet, X } from 'lucide-react';

type Kind = 'project' | 'contact' | 'invoice' | 'expense';
type RecordItem = { id: string; kind: Kind; data: Record<string, string>; updated_at: string };
type Section = 'overview' | 'backup' | Kind;
type Field = { key: string; label: string; type?: string; options?: string[]; placeholder?: string };
const sections: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard }, { key: 'project', label: 'Projets', icon: FolderKanban }, { key: 'contact', label: 'Contacts', icon: Users }, { key: 'invoice', label: 'Facturation', icon: ReceiptText }, { key: 'expense', label: 'Dépenses', icon: Wallet }, { key: 'backup', label: 'Sauvegardes', icon: ShieldCheck },
];
const forms: Record<Kind, { singular: string; intro: string; fields: Field[] }> = {
  project: { singular: 'projet', intro: 'Rassemble tes activités, leur place dans ton travail et leur prochaine étape.', fields: [
    { key: 'name', label: 'Nom du projet' }, { key: 'category', label: 'Type', options: ['Produit personnel', 'Mission client', 'Outil interne', 'Réalisation', 'Autre'] }, { key: 'status', label: 'Situation', options: ['À préciser', 'En cours', 'En pause', 'Terminé'] }, { key: 'priority', label: 'Priorité', options: ['À définir', 'Haute', 'Normale', 'Basse'] }, { key: 'next', label: 'Prochaine action' }, { key: 'url', label: 'Lien', type: 'url', placeholder: 'https://…' }, { key: 'notes', label: 'Notes', type: 'textarea' },
  ] },
  contact: { singular: 'contact', intro: 'Suis tes échanges et garde une prochaine action pour chaque relation.', fields: [
    { key: 'name', label: 'Nom' }, { key: 'company', label: 'Organisation' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Téléphone', type: 'tel' }, { key: 'status', label: 'Relation', options: ['À qualifier', 'Prospect', 'Échange en cours', 'Client', 'Partenaire', 'Sans suite'] }, { key: 'next', label: 'Prochaine action' }, { key: 'notes', label: 'Notes', type: 'textarea' },
    { key: 'legalName', label: 'Raison sociale' }, { key: 'billingEmail', label: 'E-mail de facturation', type: 'email' }, { key: 'siren', label: 'SIREN' }, { key: 'siret', label: 'SIRET' }, { key: 'vatNumber', label: 'Numéro de TVA intracommunautaire' }, { key: 'registeredAddress', label: 'Adresse du siège', type: 'textarea' }, { key: 'billingAddress', label: 'Adresse de facturation', type: 'textarea' }, { key: 'billingWarning', label: 'Point à vérifier pour la facturation', type: 'textarea' },
  ] },
  invoice: { singular: 'facture', intro: 'Crée tes factures et suis leur paiement et leur déclaration.', fields: [] },
  expense: { singular: 'dépense', intro: 'Note les dépenses professionnelles pour garder une vue de trésorerie.', fields: [
    { key: 'name', label: 'Libellé' }, { key: 'category', label: 'Catégorie', options: ['Logiciel', 'Hébergement', 'Matériel', 'Déplacement', 'Prestataire', 'Autre'] }, { key: 'amount', label: 'Montant en euros', type: 'text', placeholder: 'Ex. 29,90' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'status', label: 'Suivi', options: ['À payer', 'Payé'] }, { key: 'notes', label: 'Notes', type: 'textarea' },
  ] },
};
const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n / 100);
const cents = (v?: string) => { const [whole, fraction = ''] = (v || '0').replace(',', '.').split('.'); return Number(whole || 0) * 100 + Number((fraction + '00').slice(0, 2)); };
const sum = (items: RecordItem[]) => items.reduce((total, item) => total + cents(item.data.amount), 0);

export default function Studio({ initiallyAuthenticated }: { initiallyAuthenticated: boolean }) {
  const [auth, setAuth] = useState(initiallyAuthenticated); const [password, setPassword] = useState(''); const [email, setEmail] = useState('');
  const [invoiceLimit, setInvoiceLimit] = useState(5);
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]); const [section, setSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(initiallyAuthenticated); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [backupNotice, setBackupNotice] = useState(''); const [query, setQuery] = useState(''); const [editing, setEditing] = useState<{ kind: Kind; id?: string; data: Record<string, string> } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null); const dialogOpen = !!editing;
  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current; (dialog?.querySelector<HTMLElement>('input:enabled:not([type="checkbox"])') || dialog?.querySelector<HTMLElement>('button:enabled'))?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setEditing(null); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button:enabled, input:enabled, select:enabled, textarea:enabled'));
      if (!elements.length) return;
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) { event.preventDefault(); elements[0].focus(); }
    }
    document.addEventListener('keydown', keydown); return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [dialogOpen]);
  const load = useCallback(async () => {
    try {
      const [response, profileResponse] = await Promise.all([fetch('/api/studio/records', { cache: 'no-store' }), fetch('/api/studio/profile', { cache: 'no-store' })]);
      const data = await response.json(); const profileData = await profileResponse.json();
      if (!response.ok || !profileResponse.ok) { if (response.status === 401 || profileResponse.status === 401) setAuth(false); throw new Error(data.error || profileData.error); }
      setRecords(data.records); setProfile(profileData.profile); setError('');
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Chargement impossible.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (auth) void Promise.resolve().then(load); }, [auth, load]);
  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { const response = await fetch('/api/studio/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setPassword(''); setLoading(true); setAuth(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Connexion impossible.'); } finally { setBusy(false); }
  }
  async function logout() { await fetch('/api/studio/session', { method: 'DELETE' }); setAuth(false); setRecords([]); setProfile(null); setEditing(null); }
  async function save(e: FormEvent) {
    e.preventDefault(); if (!editing) return; if (editing.kind === 'invoice' && editing.data.items && (!parseLines(editing.data.items) || linesTotal(parseLines(editing.data.items)!) === null)) { setError('Renseigne le nom, une quantité positive et un prix valide pour chaque prestation.'); return; } setBusy(true); setError('');
    try { const response = await fetch('/api/studio/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editing, issue: editing.kind === 'invoice' }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setEditing(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.'); } finally { setBusy(false); }
  }
  async function toggleDeclared(item: RecordItem, checked: boolean) {
    if (busy || !item.data.issuedAt) return;
    setBusy(true); setError('');
    const declared = checked ? 'yes' : '';
    try {
      const response = await fetch('/api/studio/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, kind: 'invoice', update: 'declaration', data: { name: item.data.name, declared } }) });
      const result = await response.json();
      if (!response.ok) { if (response.status === 401) setAuth(false); throw new Error(result.error); }
      setRecords(current => current.map(record => record.id === item.id ? { ...record, data: { ...record.data, declared }, updated_at: new Date().toISOString() } : record));
    } catch (e) { setError(e instanceof Error ? e.message : 'Déclaration non enregistrée. Réessaie.'); }
    finally { setBusy(false); }
  }
  async function exportInvoice() {
    if (!editing || editing.kind !== 'invoice') return;
    if (!editing.id || !editing.data.issuedAt) { setError('Crée la facture avant de l’exporter.'); return; }
    if (editing.data.historical === 'yes') {
      setError('');
      try {
        const response = await fetch(`/api/studio/original?id=${editing.id}`, {cache:'no-store'});
        if (!response.ok) throw new Error('Original indisponible');
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a'); link.href = url; link.download = editing.data.sourceName || 'facture-originale.pdf';
        document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      } catch { setError('Le PDF original ne peut pas être téléchargé. Réessaie.'); }
      return;
    }
    if (editing.data.vat && Number(editing.data.vat.replace(',', '.')) !== 0) { setError('Cette facture ancienne contient de la TVA et ne peut pas être exporté avec ce modèle.'); return; }
    if (linesTotal(linesForDraft(editing.data)) === null) { setError('Renseigne le nom, une quantité positive et un prix valide pour chaque prestation avant l’export.'); return; }
    setError('');
    try {
      const { downloadInvoicePdf } = await import('@/lib/studio-invoice-pdf');
      await downloadInvoicePdf(editing.data);
    } catch { setError('Export PDF impossible. Réessaie.'); }
  }
  async function remove(item: RecordItem) {
    if (!window.confirm(`Supprimer « ${item.data.name} » ?`)) return; setBusy(true); setError('');
    try { const response = await fetch('/api/studio/records', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Suppression impossible.'); } finally { setBusy(false); }
  }
  async function exportBackup() {
    setBusy(true); setError(''); setBackupNotice('');
    try {
      const response = await fetch('/api/studio/backup', { cache: 'no-store' });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `studio-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupNotice('Téléchargement lancé. Conserve ce fichier confidentiel dans un endroit sûr.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Sauvegarde impossible.'); } finally { setBusy(false); }
  }
  async function importBackup(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) { setError('Le fichier dépasse la taille autorisée de 5 Mo.'); return; }
    if (!window.confirm('Importer cette sauvegarde ? Les éléments existants ne seront pas écrasés.')) return;
    setBusy(true); setError(''); setBackupNotice('');
    try {
      const response = await fetch('/api/studio/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await file.text() });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      await load(); setBackupNotice(`${result.inserted} élément(s) importé(s), ${result.skipped} déjà présent(s) conservé(s).`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Restauration impossible.'); } finally { setBusy(false); }
  }
  const priorityOrder: Record<string, number> = { Haute: 0, Normale: 1, Basse: 2 };
  const projects = records.filter(r => r.kind === 'project').sort((a, b) => (priorityOrder[a.data.priority] ?? 3) - (priorityOrder[b.data.priority] ?? 3) || a.id.localeCompare(b.id)); const contacts = records.filter(r => r.kind === 'contact');
  function selectInvoiceClient(id: string) {
    setEditing(current => {
      if (!current || current.kind !== 'invoice') return current;
      if (!id) return { ...current, data: { ...current.data, clientId: '' } };
      const contact = contacts.find(item => item.id === id);
      return contact ? { ...current, data: copyClientToInvoice(current.data, contact) } : current;
    });
  }
  function updateInvoiceLines(lines: InvoiceLine[]) {
    setEditing(current => {
      if (!current || current.kind !== 'invoice') return current;
      const total = linesTotal(lines);
      const amount = total === null ? '' : formatCents(total);
      return { ...current, data: { ...current.data, items: JSON.stringify(lines), name: lines[0]?.name || '', amount, ...(current.data.amountBeforeTax && (!current.data.vat || Number(current.data.vat.replace(',', '.')) === 0) ? { amountBeforeTax: amount } : {}) } };
    });
  }
  function updateField(key: string, value: string) {
    setEditing(current => current ? { ...current, data: { ...current.data, [key]: value, ...(current.kind === 'invoice' && key === 'status' ? {paymentUnconfirmed:''} : {}), ...(current.kind === 'invoice' && key === 'amount' && current.data.amountBeforeTax && (!current.data.vat || Number(current.data.vat.replace(',', '.')) === 0) ? { amountBeforeTax: value } : {}), ...(current.kind === 'invoice' && key === 'clientAddress' ? { clientAddressSource: 'manual' } : {}) } } : current);
  }
  const revenue = revenueTotals(records); const expenses = records.filter(r => r.kind === 'expense' && r.data.status === 'Payé');
  const matched = useMemo(() => {
    const filtered = records.filter(r => r.kind === section && Object.values(r.data).some(v => v.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))));
    if (section === 'invoice') filtered.sort((a,b) => (b.data.issueDate || b.data.date || '').localeCompare(a.data.issueDate || a.data.date || '') || b.updated_at.localeCompare(a.updated_at));
    return filtered;
  }, [records, section, query]);
  const visible = section === 'invoice' ? matched.slice(0, invoiceLimit) : matched;
  function navigate(next: Section) { setSection(next); setQuery(''); setInvoiceLimit(5); setError(''); setBackupNotice(''); }
  if (!auth) return <main id="main-content" className="studio-login"><div className="studio-login-card"><div className="studio-mark">w<span>.</span></div><p className="studio-eyebrow">ESPACE PRIVÉ</p><h1>Bienvenue dans ton studio.</h1><p>Retrouve tes projets et ton activité au même endroit.</p><form onSubmit={login}><label htmlFor="studio-email">Adresse e-mail</label><input id="studio-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /><label htmlFor="studio-password">Mot de passe</label><input id="studio-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /><button className="studio-primary" disabled={busy}>{busy ? 'Connexion…' : 'Accéder au studio'}</button>{error && <p className="studio-error" role="alert">{error}</p>}</form><Link href="/">← Retour au portfolio</Link></div></main>;
  const current = sections.find(s => s.key === section)!;
  return <div className="studio-shell"><aside className="studio-sidebar"><a href="/studio" className="studio-brand"><span className="studio-mark">w<span>.</span></span><span>Studio<small>ESPACE DE TRAVAIL</small></span></a><p className="studio-nav-label">MON ACTIVITÉ</p><nav aria-label="Navigation du studio">{sections.map(({ key, label, icon: Icon }) => <button key={key} className={section === key ? 'active' : ''} onClick={() => navigate(key)} aria-current={section === key ? 'page' : undefined}><Icon size={18} strokeWidth={1.7} />{label}</button>)}</nav><div className="studio-sidebar-bottom"><span className="studio-avatar">W</span><span>Wael Chatoui<small>Espace personnel</small></span><button aria-label="Se déconnecter" onClick={logout}><LogOut size={17}/></button></div></aside>
    <main id="main-content" className="studio-main"><header className="studio-topbar"><span>ESPACE PERSONNEL <span className="studio-slash">/</span> <strong>{current.label}</strong></span><div className="studio-topbar-actions"><Link href="/">Voir le portfolio <ArrowUpRight size={15}/></Link><button onClick={logout} className="studio-mobile-logout" aria-label="Se déconnecter"><LogOut size={17}/></button></div></header><div className="studio-content"><div className="studio-heading"><div><p className="studio-eyebrow">TON ESPACE DE TRAVAIL</p><h1>{section === 'overview' ? 'Bonjour Wael,' : current.label}</h1><p>{section === 'overview' ? 'Une vue claire sur tes projets et ton activité.' : section === 'backup' ? 'Garde une copie de tes données et récupère les éléments manquants.' : forms[section].intro}</p></div>{section !== 'overview' && section !== 'backup' && <button className="studio-primary" disabled={loading || !!error} onClick={() => setEditing({ kind: section, data: section === 'invoice' ? newInvoice(profile) : {} })}><Plus size={17}/> Ajouter {section === 'invoice' ? 'une facture' : section === 'expense' ? 'une dépense' : `un ${forms[section].singular}`}</button>}</div>
    {section === 'invoice' && !loading && <button className="studio-import-invoice" onClick={()=>setEditing({kind:'invoice',data:{...newInvoice(profile),historical:'yes',issueDate:'',invoiceNumber:'',paymentUnconfirmed:'yes'}})}>Importer une facture existante</button>}
    {error && !editing && <div className="studio-notice error" role="alert">{error} <button onClick={() => void load()}>Réessayer</button></div>}
    {loading ? <div className="studio-empty">Chargement de ton espace…</div> : error && records.length === 0 ? <div className="studio-empty">Les données ne sont pas disponibles.</div> : section === 'overview' ? <><div className="studio-stats"><div><span>Projets recensés</span><strong>{projects.length}</strong><small><FolderKanban size={14}/> Ton inventaire</small></div><div><span>Contacts</span><strong>{contacts.length}</strong><small><Users size={14}/> Relations suivies</small></div><div><span>Revenus</span><strong>{money(revenue.income)}</strong><small><ArrowDownLeft size={14}/> Factures payées</small></div><div><span>Revenus déclarés</span><strong>{money(revenue.declared)}</strong><small><ShieldCheck size={14}/> Payées et déclarées</small></div><div><span>Dépenses payées</span><strong>{money(sum(expenses))}</strong><small><ArrowUpRight size={14}/> Saisies manuelles</small></div></div><SiteTraffic/><div className="studio-overview-grid"><section className="studio-panel"><div className="studio-panel-head"><div><p className="studio-eyebrow">À GARDER EN VUE</p><h2>Tes projets</h2></div><button onClick={() => navigate('project')}>Tout voir →</button></div>{projects.length ? <div className="studio-project-list">{projects.slice(0, 6).map(p => <button className="studio-project-row" key={p.id} onClick={() => setEditing({ kind: 'project', id: p.id, data: p.data })}><span className="studio-project-icon"><BriefcaseBusiness size={17}/></span><span><strong>{p.data.name}</strong><small>{p.data.next || p.data.category || 'Prochaine action à préciser'}</small></span><span className="studio-tag">{p.data.priority || 'À définir'}</span></button>)}</div> : <div className="studio-empty">Ajoute ton premier projet pour commencer.</div>}</section><section className="studio-panel studio-side-panel"><p className="studio-eyebrow">TON ACTIVITÉ</p><h2>La suite, simplement.</h2><p>Choisis les projets qui comptent, note tes prochaines actions et garde le fil de tes échanges.</p><button onClick={() => navigate('project')}>Organiser mes projets →</button><div className="studio-divider"/><h3>Suivi financier</h3><p>Les montants affichés proviennent de tes saisies. Le suivi des paiements est manuel.</p><button onClick={() => navigate('invoice')}>Voir la facturation →</button></section></div></> : section === 'backup' ? <div className="studio-panel studio-backup"><p className="studio-eyebrow">TES DONNÉES</p><h2>Une copie à conserver chez toi</h2><p>Télécharge régulièrement une copie de tes projets, contacts, factures et dépenses. Le fichier contient des informations privées : conserve-le dans un espace protégé.</p><button className="studio-primary" disabled={busy} onClick={() => void exportBackup()}>Télécharger la sauvegarde</button><div className="studio-divider"/><h2>Importer une sauvegarde</h2><p>Les éléments absents seront ajoutés. Les éléments déjà présents ne seront ni modifiés ni remplacés.</p><label className="studio-file-label">Choisir un fichier JSON<input type="file" accept="application/json,.json" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void importBackup(file); }}/></label>{backupNotice && <p className="studio-backup-notice" role="status">{backupNotice}</p>}</div> : <><div className="studio-section-bar"><div>{section === 'invoice' ? <><strong>{visible.length}</strong> sur <strong>{matched.length}</strong> factures</> : <><strong>{visible.length}</strong> {visible.length === 1 ? 'élément' : 'éléments'}</>}</div><label className="studio-search"><Search size={17}/><span className="sr-only">Rechercher</span><input value={query} onChange={e => {setQuery(e.target.value); setInvoiceLimit(5);}} placeholder="Rechercher…" /></label></div>{section === 'invoice' && <><div className="studio-notice">Les factures créées sont conservées avec leur numéro. Une correction après création nécessite une pièce rectificative.</div><BillingProfileForm key={profile?.invoiceSequence || 'unset'} profile={profile} onSaved={load}/></>}<div className="studio-panel studio-list" id="studio-record-list">{visible.length ? visible.map(item => <div className="studio-list-row" key={item.id}><button className="studio-list-main" onClick={() => setEditing({ kind: item.kind, id: item.id, data: item.kind === 'invoice' ? editableInvoice(item.data, profile) : item.data })}><span className="studio-project-icon">{item.kind === 'contact' ? <Users size={17}/> : item.kind === 'project' ? <FolderKanban size={17}/> : <ReceiptText size={17}/>}</span><span>{item.kind === 'invoice' ? <><strong className="studio-invoice-title"><span>{item.data.invoiceNumber || 'Numéro à définir'}</span>{' '}<span>{item.data.client || 'Client à préciser'}</span></strong><small>{item.data.name}{item.data.issueDate && <> · <time dateTime={item.data.issueDate}>{item.data.issueDate.split('-').reverse().join('/')}</time></>}</small></> : <><strong>{item.data.name}</strong><small>{item.data.next || item.data.client || item.data.company || item.data.category || 'Aucun détail'}</small></>}</span></button><span className="studio-row-amount">{item.data.amount ? money(cents(item.data.amount)) : ''}</span>{item.kind === 'invoice' && item.data.issuedAt && <label className="studio-declaration"><input type="checkbox" checked={item.data.declared === 'yes'} disabled={busy} aria-label={`Déclaré : ${item.data.invoiceNumber || item.data.name}, ${item.data.client || 'client à préciser'}`} onChange={event=>void toggleDeclared(item,event.target.checked)}/><span>Déclaré</span></label>}<span className="studio-tag">{item.kind === 'invoice' ? `${item.data.numberConflict === 'yes' ? 'Numéro en doublon · ' : ''}` + (item.data.paymentUnconfirmed === 'yes' ? 'Paiement à confirmer' : paymentStatus(item.data.status)) : item.data.status || 'À préciser'}</span>{!item.data.issuedAt && <button className="studio-delete" onClick={() => void remove(item)} disabled={busy} aria-label={`Supprimer ${item.data.name}`}>Supprimer</button>}</div>) : <div className="studio-empty">{query ? 'Aucun résultat pour cette recherche.' : `${section === 'invoice' || section === 'expense' ? 'Aucune' : 'Aucun'} ${forms[section].singular} pour le moment.`}</div>}</div>{section === 'invoice' && visible.length < matched.length && <div className="studio-load-more"><button type="button" aria-controls="studio-record-list" onClick={()=>setInvoiceLimit(n=>n+5)}>Voir plus</button></div>}</>}
    </div></main>{editing && <div className="studio-modal-backdrop" onClick={() => setEditing(null)}><div ref={dialogRef} className={`studio-modal${editing.kind === 'invoice' ? ' studio-modal-invoice' : ''}`} role="dialog" aria-modal="true" aria-labelledby="studio-modal-title" onClick={e => e.stopPropagation()}><div className="studio-modal-head"><div><p className="studio-eyebrow">{editing.id ? 'MODIFIER' : 'NOUVEL ÉLÉMENT'}</p><h2 id="studio-modal-title">{forms[editing.kind].singular}</h2></div><button aria-label="Fermer" onClick={() => setEditing(null)}><X size={20}/></button></div><form onSubmit={save}>{editing.kind === 'invoice' ? <InvoiceEditor data={editing.data} onOriginal={data=>setEditing(current=>current?{...current,data:{...current.data,...data}}:current)} suggestedNumber={nextInvoiceNumber(profile?.invoiceLastNumber || profile?.invoiceSequence)} contacts={contacts} onChange={updateField} onSelectClient={selectInvoiceClient} onLinesChange={updateInvoiceLines} /> : <div className="studio-form-grid">{forms[editing.kind].fields.map(field => <label key={field.key} className={field.type === 'textarea' ? 'wide' : ''}>{field.label}{field.key === 'name' && ' *'}{field.options ? <select value={editing.data[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}><option value="">Choisir…</option>{field.options.map(o => <option key={o}>{o}</option>)}</select> : field.type === 'textarea' ? <textarea rows={4} value={editing.data[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}/> : <input required={field.key === 'name'} type={field.type || 'text'} placeholder={field.placeholder} value={editing.data[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}/>}</label>)}</div>}{error && <p className="studio-error" role="alert">{error}</p>}<div className="studio-modal-actions">{editing.kind === 'invoice' && !!editing.data.issuedAt && <button type="button" onClick={() => void exportInvoice()}>Exporter en PDF</button>}<button type="button" onClick={() => setEditing(null)}>Annuler</button><button className="studio-primary" disabled={busy}>{busy ? 'Enregistrement…' : editing.kind === 'invoice' && !editing.data.issuedAt ? editing.data.historical === 'yes' ? 'Importer la facture' : 'Créer la facture' : 'Enregistrer'}</button></div></form></div></div>}</div>;
}
