'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocale } from 'next-intl';
import styles from './system-showcase.module.css';

export default function SystemShowcase() {
  const en = useLocale() === 'en';
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const [run, setRun] = useState(0);
  const examples = en ? [
    { name: 'CRM', nodes: ['A new enquiry', 'A shared record', 'A clear next action'], detail: 'Contacts, context and follow-up in one place. Permissions and workflow are defined with your team.', proof: 'See my internal CRM', href: '#project-leads' },
    { name: 'Automation', nodes: ['An identified source', 'A checked transformation', 'An update to your tool'], detail: 'Connect existing tools while keeping control of duplicates, errors and the information being transferred.', proof: 'Explore Attio Bridge', href: '#project-attio' },
    { name: 'Product', nodes: ['A user need', 'A working interface', 'A tested user journey'], detail: 'Build a focused feature, with its loading, empty, error and recovery states considered from the start.', proof: 'Explore my work on Miria.ai', href: '#project-miria' },
  ] : [
    { name: 'CRM', nodes: ['Une nouvelle demande', 'Un dossier partagé', 'Une prochaine action claire'], detail: 'Contacts, contexte et suivi au même endroit. Les droits et le parcours se définissent avec votre équipe.', proof: 'Voir mon CRM interne', href: '#project-leads' },
    { name: 'Automatisation', nodes: ['Une source identifiée', 'Une transformation contrôlée', 'Une mise à jour dans votre outil'], detail: 'Relier vos outils existants en gardant la maîtrise des doublons, des erreurs et des informations transmises.', proof: 'Découvrir Attio Bridge', href: '#project-attio' },
    { name: 'Produit', nodes: ['Un besoin utilisateur', 'Une interface qui fonctionne', 'Un parcours testé'], detail: 'Construire une fonctionnalité ciblée, avec ses états de chargement, vide, erreur et reprise pensés dès le départ.', proof: 'Voir mon travail sur Miria.ai', href: '#project-miria' },
  ];
  const current = examples[selected];
  return <section className={styles.section} aria-labelledby="system-title">
    <div className={styles.intro}>
      <h2 id="system-title">{en ? 'Less copying.\nMore continuity.' : 'Moins de recopies.\nPlus de continuité.'}</h2>
      <p>{en ? 'I build business tools, CRM and web products around the way your team works. Start with the information that moves between people.' : 'Je construis des outils métier, CRM et produits web autour du travail de votre équipe. Le point de départ : les informations qui circulent entre les personnes.'}</p>
      <a href="/prestations/outils-metier-crm">{en ? 'Scope a business tool' : 'Cadrer un outil métier'} <span aria-hidden="true">↗</span></a>
    </div>
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <div role="group" aria-label={en ? 'Explore a project type' : 'Explorer un type de projet'}>{examples.map((item, index) => <button key={item.name} type="button" aria-pressed={selected === index} onClick={() => { setSelected(index); setRun(0); }}>{item.name}</button>)}</div>
        <span>{en ? 'Concept illustration' : 'Schéma de principe'}</span>
      </div>
      <div className={styles.network}>
        <svg viewBox="0 0 800 180" preserveAspectRatio="none" className={styles.wire} aria-hidden="true">
          <path d="M120 90 H680" fill="none" stroke="currentColor" strokeWidth="1" />
          {run > 0 && !reduced && <motion.circle key={`${selected}-${run}`} r="5" cy="90" fill="#fafafa" initial={{ cx: 120, opacity: 0 }} animate={{ cx: [120, 400, 680], opacity: [0, 1, 0] }} transition={{ duration: 1.2, ease: 'easeInOut' }} />}
        </svg>
        {current.nodes.map((node, index) => <div key={index} className={styles.node}><span aria-hidden="true">{['IN', 'SYSTEM', 'OUT'][index]}</span><strong>{node}</strong></div>)}
      </div>
      <div className={styles.description} id="system-flow-details"><p>{current.detail}</p><a href={current.href}>{current.proof} <span aria-hidden="true">↗</span></a></div>
      <div className={styles.bottom}><button type="button" aria-describedby="system-flow-details" onClick={() => setRun(value => value + 1)}>{en ? 'Trace the flow' : 'Voir le flux'} <span aria-hidden="true">→</span></button><p>{en ? 'Illustration only. No customer data or live connection.' : 'Illustration sans données client ni connexion réelle.'}</p></div>
    </div>
  </section>;
}
