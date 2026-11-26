'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { copyClientToInvoice } from '@/lib/studio-billing';
import { revenueTotals } from '@/lib/studio-revenue';
import InvoiceEditor from './invoice-editor';
import BillingProfileForm from './billing-profile';
import SiteTraffic from './site-traffic';
import { invoiceLanguage } from '@/lib/studio-invoice-i18n';
import { dueDateIn30Days, invoiceIssueProblem, type InvoiceFieldError } from '@/lib/studio-invoice-policy';
import { editableInvoice, newInvoice, nextInvoiceNumber, paymentStatus, type BillingProfile } from '@/lib/studio-profile';
import { displayCents, formatCents, linesForDraft, linesTotal, parseLines, type InvoiceLine } from '@/lib/studio-invoice-lines';
import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, FolderKanban, LayoutDashboard, LogOut, Plus, ShieldCheck, ReceiptText, Search, Users, Wallet, X } from 'lucide-react';

type Kind = 'project' | 'contact' | 'invoice' | 'expense';
type RecordItem = { id: string; kind: Kind; data: Record<string, string>; updated_at: string };
type EditorInput = { kind: Kind; id?: string; data: Record<string, string> };
type Editor = EditorInput & { initialData: Record<string, string>; customDueDate?: string };
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
  const [backupNotice, setBackupNotice] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Editor | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [formError, setFormError] = useState<InvoiceFieldError | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<RecordItem | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const createdRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closeTrigger = useRef<HTMLElement | null>(null);
  const saving = useRef(false);
  const dialogOpen = !!editing;
  const dirty = !!editing && Object.keys(editing.data).some(key =>
    (editing.data[key] || '') !== (editing.initialData[key] || ''));

  function openEditor(editor: EditorInput) {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirmClose(false);
    setFormError(null);
    setEditing({ ...editor, initialData: editor.data });
  }

  const discardEditor = useCallback(() => {
    setConfirmClose(false);
    setFormError(null);
    setEditing(null);
  }, []);

  const keepEditing = useCallback(() => {
    setConfirmClose(false);
    requestAnimationFrame(() => closeTrigger.current?.focus());
  }, []);

  const closeEditor = useCallback(() => {
    if (saving.current) return;
    if (confirmClose) {
      keepEditing();
    } else if (dirty) {
      closeTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setConfirmClose(true);
    } else {
      discardEditor();
    }
  }, [confirmClose, dirty, discardEditor, keepEditing]);

  useEffect(() => {
    if (confirmClose) dialogRef.current?.querySelector<HTMLElement>('.studio-keep-editing')?.focus();
  }, [confirmClose]);

  useEffect(() => {
    if (!dialogOpen) return;
    const dialog = dialogRef.current;
    const previous = trigger.current;
    // A mobile keyboard should open only when the user selects a text field.
    const start = dialog?.querySelector<HTMLElement>('[data-invoice-start]') || dialog?.querySelector<HTMLElement>('.studio-modal-close');
    start?.focus({ preventScroll: true });
    return () => { previous?.focus(); };
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditor();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const elements = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:enabled, input:enabled, select:enabled, textarea:enabled, summary, a[href]',
      )].filter(element => element.getClientRects().length && (!(element instanceof HTMLInputElement) ||
        element.type !== 'radio' || element.checked));
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [dialogOpen, closeEditor]);

  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!formError || busy || confirmClose) return;
    const dialog = dialogRef.current;
    const control = formError.field && dialog?.querySelector<HTMLElement>(
      `[data-invoice-field="${CSS.escape(formError.field)}"]`,
    );
    const target = control || dialog?.querySelector<HTMLElement>('.studio-form-error');
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'center' });
    }
  }, [formError, busy, confirmClose]);

  useEffect(() => {
    if (createdInvoice) createdRef.current?.focus({ preventScroll: true });
  }, [createdInvoice]);

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
  async function logout() { await fetch('/api/studio/session', { method: 'DELETE' }); setAuth(false); setRecords([]); setProfile(null); setEditing(null); setCreatedInvoice(null); setFormError(null); }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing || saving.current || confirmClose) return;
    const isInvoice = editing.kind === 'invoice';
    const issuing = isInvoice && !editing.data.issuedAt;
    const historical = editing.data.historical === 'yes';
    setFormError(null);

    if (issuing) {
      if (historical && !editing.data.sourcePdf) {
        setFormError({ field: 'sourcePdf', message: 'Choisis un PDF valide à importer.' });
        return;
      }
      if (!historical) {
        const problem = invoiceIssueProblem(editing.data);
        if (problem) {
          setFormError(problem);
          return;
        }
      }
      if (editing.data.items) {
        const lines = parseLines(editing.data.items);
        if (!lines || linesTotal(lines) === null) {
          setFormError({ field: 'lines', message: 'Renseigne le nom, une quantité positive et un prix valide pour chaque ligne.' });
          return;
        }
      }
    }

    let data = editing.data;
    if (isInvoice && !issuing) {
      data = { name: editing.data.name };
      for (const key of ['status', 'paymentUnconfirmed', 'declared', 'language']) {
        if (editing.data[key] !== editing.initialData[key]) data[key] = editing.data[key];
      }
    }

    saving.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/studio/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, kind: editing.kind, data, issue: isInvoice }),
      });
      const result = await response.json();
      if (!response.ok) {
        setFormError({ field: result.field || '', message: result.error || 'Enregistrement impossible.' });
        return;
      }
      setEditing(null);
      if (issuing && result.record) {
        const record: RecordItem = result.record;
        setRecords(current => [record, ...current.filter(item => item.id !== record.id)]);
        setCreatedInvoice(record);
        setQuery('');
        setInvoiceLimit(5);
      }
      await load();
    } catch {
      setFormError({ field: '', message: 'Enregistrement impossible. Réessaie.' });
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function updateInvoiceTracking(item: RecordItem, update: 'payment' | 'declaration', value: string) {
    if (busy || !item.data.issuedAt) return;
    setBusy(true);
    setError('');
    const changes: Record<string, string> = update === 'payment' ? { status: value, paymentUnconfirmed: '' } : { declared: value };
    try {
      const response = await fetch('/api/studio/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, kind: 'invoice', update, data: { name: item.data.name, ...changes } }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) setAuth(false);
        throw new Error(result.error);
      }
      setRecords(current => current.map(record => record.id === item.id
        ? { ...record, data: { ...record.data, ...changes } }
        : record));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Suivi non enregistré. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  async function exportInvoice(id: string, data: Record<string, string>, inForm = false) {
    if (pdfBusy) return;
    const setExportError = (message: string) => {
      if (inForm) setFormError(message ? { field: '', message } : null);
      else setError(message);
    };
    setExportError('');
    setPdfBusy(true);
    try {
      if (data.historical === 'yes') {
        const response = await fetch(`/api/studio/original?id=${id}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Le PDF original ne peut pas être téléchargé. Réessaie.');
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = url;
        link.download = data.sourceName || 'facture-originale.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        if (data.vat && Number(data.vat.replace(',', '.')) !== 0) {
          throw new Error('Cette facture ancienne contient de la TVA et ne peut pas être exportée avec ce modèle.');
        }
        if (linesTotal(linesForDraft(data)) === null) {
          throw new Error('Vérifie les prestations enregistrées avant d’exporter le PDF.');
        }
        const { downloadInvoicePdf } = await import('@/lib/studio-invoice-pdf');
        await downloadInvoicePdf(data);
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export PDF impossible. Réessaie.');
    } finally {
      setPdfBusy(false);
    }
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
    setFormError(current => current?.field === 'client' || current?.field === 'clientAddress' ? null : current);
    setEditing(current => {
      if (!current || current.kind !== 'invoice') return current;
      if (!id) return { ...current, data: { ...current.data, clientId: '' } };
      const contact = contacts.find(item => item.id === id);
      return contact ? { ...current, data: copyClientToInvoice(current.data, contact) } : current;
    });
  }
  function updateInvoiceLines(lines: InvoiceLine[]) {
    setFormError(current => current?.field === 'lines' ? null : current);
    setEditing(current => {
      if (!current || current.kind !== 'invoice') return current;
      const total = linesTotal(lines);
      const amount = total === null ? '' : formatCents(total);
      return { ...current, data: { ...current.data, items: JSON.stringify(lines), name: lines[0]?.name || '', amount, ...(current.data.amountBeforeTax && (!current.data.vat || Number(current.data.vat.replace(',', '.')) === 0) ? { amountBeforeTax: amount } : {}) } };
    });
  }
  function updateField(key: string, value: string) {
    setFormError(current => current?.field === key || ((key === 'dueDateMode' || key === 'issueDate') && current?.field === 'dueDate') ? null : current);
    setEditing(current => {
      if (!current) return current;
      const data = { ...current.data, [key]: value };
      let customDueDate = current.customDueDate;
      if (current.kind === 'invoice') {
        if (key === 'status') data.paymentUnconfirmed = '';
        if (key === 'amount' && data.amountBeforeTax && (!data.vat || Number(data.vat.replace(',', '.')) === 0)) {
          data.amountBeforeTax = value;
        }
        if (key === 'clientAddress') data.clientAddressSource = 'manual';
        if (key === 'dueDateMode') {
          if (current.data.dueDateMode !== '30days') customDueDate = current.data.dueDate;
          if (value === 'custom') data.dueDate = customDueDate ?? current.data.dueDate;
        }
        if ((key === 'issueDate' || key === 'dueDateMode') && data.dueDateMode === '30days') {
          data.dueDate = dueDateIn30Days(data.issueDate);
        }
      }
      return { ...current, data, customDueDate };
    });
  }
  const revenue = revenueTotals(records); const expenses = records.filter(r => r.kind === 'expense' && r.data.status === 'Payé');
  const matched = useMemo(() => {
    const filtered = records.filter(r => r.kind === section && Object.values(r.data).some(v => v.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))));
    if (section === 'invoice') filtered.sort((a,b) => (b.data.issueDate || b.data.date || '').localeCompare(a.data.issueDate || a.data.date || '') || b.updated_at.localeCompare(a.updated_at));
    return filtered;
  }, [records, section, query]);
  const visible = section === 'invoice' ? matched.slice(0, invoiceLimit) : matched;
  function navigate(next: Section) { setCreatedInvoice(null); setSection(next); setQuery(''); setInvoiceLimit(5); setError(''); setBackupNotice(''); }
  if (!auth) return <main id="main-content" className="studio-login"><div className="studio-login-card"><div className="studio-mark">w<span>.</span></div><p className="studio-eyebrow">ESPACE PRIVÉ</p><h1>Bienvenue dans ton studio.</h1><p>Retrouve tes projets et ton activité au même endroit.</p><form onSubmit={login}><label htmlFor="studio-email">Adresse e-mail</label><input id="studio-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /><label htmlFor="studio-password">Mot de passe</label><input id="studio-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /><button className="studio-primary" disabled={busy}>{busy ? 'Connexion…' : 'Accéder au studio'}</button>{error && <p className="studio-error" role="alert">{error}</p>}</form><Link href="/">← Retour au portfolio</Link></div></main>;
  const current = sections.find(s => s.key === section)!;
  return <div className="studio-shell"><aside className="studio-sidebar" inert={dialogOpen}><a href="/studio" className="studio-brand"><span className="studio-mark">w<span>.</span></span><span>Studio<small>ESPACE DE TRAVAIL</small></span></a><p className="studio-nav-label">MON ACTIVITÉ</p><nav aria-label="Navigation du studio">{sections.map(({ key, label, icon: Icon }) => <button key={key} className={section === key ? 'active' : ''} onClick={() => navigate(key)} aria-current={section === key ? 'page' : undefined}><Icon size={18} strokeWidth={1.7} />{label}</button>)}</nav><div className="studio-sidebar-bottom"><span className="studio-avatar">W</span><span>Wael Chatoui<small>Espace personnel</small></span><button aria-label="Se déconnecter" onClick={logout}><LogOut size={17}/></button></div></aside>
    <main id="main-content" className="studio-main" inert={dialogOpen}><header className="studio-topbar"><span>ESPACE PERSONNEL <span className="studio-slash">/</span> <strong>{current.label}</strong></span><div className="studio-topbar-actions"><Link href="/">Voir le portfolio <ArrowUpRight size={15}/></Link><button onClick={logout} className="studio-mobile-logout" aria-label="Se déconnecter"><LogOut size={17}/></button></div></header><div className="studio-content"><div className="studio-heading"><div><p className="studio-eyebrow">TON ESPACE DE TRAVAIL</p><h1>{section === 'overview' ? 'Bonjour Wael,' : current.label}</h1><p>{section === 'overview' ? 'Une vue claire sur tes projets et ton activité.' : section === 'backup' ? 'Garde une copie de tes données et récupère les éléments manquants.' : forms[section].intro}</p></div>{section !== 'overview' && section !== 'backup' && <button className="studio-primary" disabled={loading || busy} onClick={() => openEditor({ kind: section, data: section === 'invoice' ? newInvoice(profile) : {} })}><Plus size={17}/> Ajouter {section === 'invoice' ? 'une facture' : section === 'expense' ? 'une dépense' : `un ${forms[section].singular}`}</button>}</div>
    {section === 'invoice' && !loading && <button className="studio-import-invoice" disabled={busy} onClick={()=>openEditor({kind:'invoice',data:{...newInvoice(profile),historical:'yes',issueDate:'',dueDate:'',dueDateMode:'custom',invoiceNumber:'',paymentUnconfirmed:'yes'}})}>Importer une facture existante</button>}
    {section === 'invoice' && createdInvoice && <div ref={createdRef} tabIndex={-1} className="studio-created-invoice">
      <p role="status"><strong>{createdInvoice.data.invoiceNumber}</strong> {createdInvoice.data.historical === 'yes' ? 'importée' : 'créée'}</p>
      <button type="button" disabled={pdfBusy} onClick={() => void exportInvoice(createdInvoice.id, records.find(item => item.id === createdInvoice.id)?.data || createdInvoice.data)}>
        {pdfBusy ? 'Préparation du PDF…' : 'Télécharger le PDF'}
      </button>
      <button type="button" aria-label="Fermer la confirmation" onClick={() => setCreatedInvoice(null)}><X size={17}/></button>
    </div>}
    {error && !editing && <div className="studio-notice error" role="alert">{error} <button onClick={() => void load()}>Réessayer</button></div>}
    {loading ? <div className="studio-empty">Chargement de ton espace…</div> : error && records.length === 0 ? <div className="studio-empty">Les données ne sont pas disponibles.</div> : section === 'overview' ? <><div className="studio-stats"><div><span>Projets recensés</span><strong>{projects.length}</strong><small><FolderKanban size={14}/> Ton inventaire</small></div><div><span>Contacts</span><strong>{contacts.length}</strong><small><Users size={14}/> Relations suivies</small></div><div><span>Revenus</span><strong>{money(revenue.income)}</strong><small><ArrowDownLeft size={14}/> Factures payées</small></div><div><span>Revenus déclarés</span><strong>{money(revenue.declared)}</strong><small><ShieldCheck size={14}/> Payées et déclarées</small></div><div><span>Dépenses payées</span><strong>{money(sum(expenses))}</strong><small><ArrowUpRight size={14}/> Saisies manuelles</small></div></div><SiteTraffic/><div className="studio-overview-grid"><section className="studio-panel"><div className="studio-panel-head"><div><p className="studio-eyebrow">À GARDER EN VUE</p><h2>Tes projets</h2></div><button onClick={() => navigate('project')}>Tout voir →</button></div>{projects.length ? <div className="studio-project-list">{projects.slice(0, 6).map(p => <button className="studio-project-row" key={p.id} onClick={() => openEditor({ kind: 'project', id: p.id, data: p.data })}><span className="studio-project-icon"><BriefcaseBusiness size={17}/></span><span><strong>{p.data.name}</strong><small>{p.data.next || p.data.category || 'Prochaine action à préciser'}</small></span><span className="studio-tag">{p.data.priority || 'À définir'}</span></button>)}</div> : <div className="studio-empty">Ajoute ton premier projet pour commencer.</div>}</section><section className="studio-panel studio-side-panel"><p className="studio-eyebrow">TON ACTIVITÉ</p><h2>La suite, simplement.</h2><p>Choisis les projets qui comptent, note tes prochaines actions et garde le fil de tes échanges.</p><button onClick={() => navigate('project')}>Organiser mes projets →</button><div className="studio-divider"/><h3>Suivi financier</h3><p>Les montants affichés proviennent de tes saisies. Le suivi des paiements est manuel.</p><button onClick={() => navigate('invoice')}>Voir la facturation →</button></section></div></> : section === 'backup' ? <div className="studio-panel studio-backup"><p className="studio-eyebrow">TES DONNÉES</p><h2>Une copie à conserver chez toi</h2><p>Télécharge régulièrement une copie de tes projets, contacts, factures et dépenses. Le fichier contient des informations privées : conserve-le dans un espace protégé.</p><button className="studio-primary" disabled={busy} onClick={() => void exportBackup()}>Télécharger la sauvegarde</button><div className="studio-divider"/><h2>Importer une sauvegarde</h2><p>Les éléments absents seront ajoutés. Les éléments déjà présents ne seront ni modifiés ni remplacés.</p><label className="studio-file-label">Choisir un fichier JSON<input type="file" accept="application/json,.json" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void importBackup(file); }}/></label>{backupNotice && <p className="studio-backup-notice" role="status">{backupNotice}</p>}</div> : <><div className="studio-section-bar"><div>{section === 'invoice' ? <><strong>{visible.length}</strong> sur <strong>{matched.length}</strong> factures</> : <><strong>{visible.length}</strong> {visible.length === 1 ? 'élément' : 'éléments'}</>}</div><label className="studio-search"><Search size={17}/><span className="sr-only">Rechercher</span><input value={query} onChange={e => {setQuery(e.target.value); setInvoiceLimit(5);}} placeholder="Rechercher…" /></label></div>{section === 'invoice' && <><div className="studio-notice">Les factures créées sont conservées avec leur numéro. Une correction après création nécessite une pièce rectificative.</div><BillingProfileForm key={profile?.invoiceSequence || 'unset'} profile={profile} onSaved={load}/></>}<div className="studio-panel studio-list" id="studio-record-list">{visible.length ? visible.map(item => <div className="studio-list-row" key={item.id}><button className="studio-list-main" onClick={() => openEditor({ kind: item.kind, id: item.id, data: item.kind === 'invoice' ? editableInvoice(item.data, profile) : item.data })}><span className="studio-project-icon">{item.kind === 'contact' ? <Users size={17}/> : item.kind === 'project' ? <FolderKanban size={17}/> : <ReceiptText size={17}/>}</span><span>{item.kind === 'invoice' ? <><strong className="studio-invoice-title"><span>{item.data.invoiceNumber || 'Numéro à définir'}</span>{' '}<span>{item.data.client || 'Client à préciser'}</span></strong><small>{item.data.name}{item.data.issueDate && <> · <time dateTime={item.data.issueDate}>{item.data.issueDate.split('-').reverse().join('/')}</time></>}</small></> : <><strong>{item.data.name}</strong><small>{item.data.next || item.data.client || item.data.company || item.data.category || 'Aucun détail'}</small></>}</span></button><span className="studio-row-amount">{item.data.amount ? money(cents(item.data.amount)) : ''}</span>{item.kind === 'invoice' && item.data.issuedAt && <label className="studio-declaration"><input type="checkbox" checked={item.data.declared === 'yes'} disabled={busy} aria-label={`Déclaré : ${item.data.invoiceNumber || item.data.name}, ${item.data.client || 'client à préciser'}`} onChange={event => void updateInvoiceTracking(item, 'declaration', event.target.checked ? 'yes' : '')}/><span>Déclaré</span></label>}{item.kind === 'invoice' && item.data.issuedAt
      ? <select className="studio-payment-status" aria-label={`Paiement : ${item.data.invoiceNumber || item.data.name}`}
          value={item.data.paymentUnconfirmed === 'yes' ? 'unknown' : paymentStatus(item.data.status)}
          disabled={busy} onChange={event => void updateInvoiceTracking(item, 'payment', event.target.value)}>
          {item.data.paymentUnconfirmed === 'yes' && <option value="unknown" disabled>Paiement à confirmer</option>}
          <option>Non payé</option><option>Payé</option>
        </select>
      : <span className="studio-tag">{item.kind === 'invoice' ? paymentStatus(item.data.status) : item.data.status || 'À préciser'}</span>}
    {item.kind === 'invoice' && item.data.numberConflict === 'yes' && <span className="studio-tag">Numéro en doublon</span>}{!item.data.issuedAt && <button className="studio-delete" onClick={() => void remove(item)} disabled={busy} aria-label={`Supprimer ${item.data.name}`}>Supprimer</button>}</div>) : <div className="studio-empty">{query ? 'Aucun résultat pour cette recherche.' : `${section === 'invoice' || section === 'expense' ? 'Aucune' : 'Aucun'} ${forms[section].singular} pour le moment.`}</div>}</div>{section === 'invoice' && visible.length < matched.length && <div className="studio-load-more"><button type="button" aria-controls="studio-record-list" onClick={()=>setInvoiceLimit(n=>n+5)}>Voir plus</button></div>}</>}
    </div></main>
    {editing && <div className="studio-modal-backdrop" onClick={event => {
      if (event.target === event.currentTarget) closeEditor();
    }}>
      <div ref={dialogRef} className={`studio-modal${editing.kind === 'invoice' ? ' studio-modal-invoice' : ''}`}
        role="dialog" aria-modal="true" aria-labelledby="studio-modal-title">
        <div className="studio-modal-head">
          <h2 id="studio-modal-title">{editing.kind === 'invoice'
            ? editing.data.invoiceNumber && editing.data.issuedAt ? `Facture ${editing.data.invoiceNumber}`
              : editing.data.historical === 'yes' ? 'Importer une facture' : 'Nouvelle facture'
            : forms[editing.kind].singular}</h2>
          <button type="button" className="studio-modal-close" aria-label="Fermer" onClick={closeEditor}><X size={20}/></button>
        </div>
        <form onSubmit={save}>
          <fieldset className="studio-modal-fields" disabled={busy || confirmClose}>
            {editing.kind === 'invoice'
              ? <InvoiceEditor data={editing.data} fieldError={formError || undefined}
                  onOriginal={data => {
                    setFormError(current => current?.field === 'sourcePdf' ? null : current);
                    setEditing(current => current ? { ...current, data: { ...current.data, ...data } } : current);
                  }}
                  suggestedNumber={nextInvoiceNumber(profile?.invoiceLastNumber || profile?.invoiceSequence)}
                  contacts={contacts} onChange={updateField} onSelectClient={selectInvoiceClient} onLinesChange={updateInvoiceLines} />
              : <div className="studio-form-grid">{forms[editing.kind].fields.map(field => <label key={field.key} className={field.type === 'textarea' ? 'wide' : ''}>
                  {field.label}{field.key === 'name' && ' *'}
                  {field.options
                    ? <select value={editing.data[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}>
                        <option value="">Choisir…</option>{field.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : field.type === 'textarea'
                      ? <textarea rows={4} value={editing.data[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}/>
                      : <input required={field.key === 'name'} type={field.type || 'text'} placeholder={field.placeholder} value={editing.data[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}/>}
                </label>)}</div>}
          </fieldset>
          {formError && !formError.field && <p className="studio-error studio-form-error" role="alert" tabIndex={-1}>{formError.message}</p>}
          <div className={`studio-modal-actions${editing.kind === 'invoice' ? ' studio-invoice-actions' : ''}`}>
            {confirmClose ? <>
              <p className="studio-discard-message" role="alert">Fermer et perdre les modifications de ce formulaire ?</p>
              <button type="button" onClick={discardEditor}>Fermer sans enregistrer</button>
              <button type="button" className="studio-primary studio-keep-editing" onClick={keepEditing}>Continuer la saisie</button>
            </> : <>
            {editing.kind === 'invoice' && !editing.data.issuedAt && editing.data.historical !== 'yes' && <div className="studio-invoice-action-total">
              <span>Total</span><strong>{displayCents(linesTotal(linesForDraft(editing.data)), invoiceLanguage(editing.data.language))}</strong>
            </div>}
            {editing.kind === 'invoice' && editing.id && editing.data.issuedAt && <button type="button" disabled={pdfBusy}
              onClick={() => void exportInvoice(editing.id!, editing.data, true)}>{pdfBusy ? 'Préparation du PDF…' : 'Exporter en PDF'}</button>}
            <button type="button" disabled={busy} onClick={closeEditor}>Annuler</button>
            <button type="submit" className="studio-primary" disabled={busy}>
              {busy ? 'Enregistrement…' : editing.kind === 'invoice' && !editing.data.issuedAt
                ? editing.data.historical === 'yes' ? 'Importer la facture' : 'Créer la facture'
                : 'Enregistrer'}
            </button>
            </>}
          </div>
        </form>
      </div>
    </div>}
  </div>;
}
