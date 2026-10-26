import type { Metadata } from 'next';
import Link from 'next/link';
import LocaleSwitcher from '@/components/locale-switcher';
import { getLocale } from 'next-intl/server';
import { siteUrl } from '@/lib/site';

const path = '/prestations/outils-metier-crm';
function content(en: boolean) {
  return en ? {
    title: 'Custom business tools and CRM | Wael Chatoui',
    description: 'Scope a custom CRM or internal tool with Wael Chatoui: workflow, data, permissions, integrations and clear deliverables. Remote freelance development.',
    heading: 'A CRM built around your workflow.',
    lead: 'I design and develop custom business tools: contact management, case tracking, dashboards and integrations. We define the workflow, users and delivery scope before quoting the project.',
    brief: 'What should the first brief contain?',
    items: ['The task your team repeats, and where information gets lost.', 'The people who use the tool and what each should be allowed to see or change.', 'The existing data and tools to connect, without sending confidential customer records.', 'The first useful outcome, your deadline and the constraints that matter.'],
    scope: 'What can be included in the delivery?',
    scopeText: 'A scoped project can include the interface, data model, access rules, integrations and handover. The quote states what is included, the validation steps and the limits. Hosting, maintenance and third-party subscriptions are clarified separately.',
    proof: 'A concrete example: my internal CRM',
    proofText: 'My own acquisition tool combines prospect collection, qualification and opportunity tracking with Python, Supabase and Next.js. The portfolio explains its scope without exposing the private source code or prospect records.',
    proofLink: 'Read the CRM case study',
    questions: 'Before we start',
    faq: [
      ['Do I need to replace all my existing tools?', 'No. The brief identifies what to keep and what needs to connect. A focused feature or integration may be sufficient.'],
      ['Can you work from a spreadsheet?', 'A sample structure can help explain the fields and workflow. Use fictional or anonymised rows for the first discussion; access to real data is agreed separately.'],
      ['How is the price determined?', 'The project is quoted after scoping the users, workflow, integrations and deliverables.'],
    ],
    next: 'Start with the task you want to simplify.',
    nextText: 'Describe the current process, the expected result and the deadline. Do not include passwords or confidential customer information.',
    contact: 'Describe my project', home: 'Back to the portfolio',
  } : {
    title: 'Outils métier et CRM sur mesure | Wael Chatoui',
    description: 'Cadrer un CRM ou un outil métier sur mesure avec Wael Chatoui : parcours, données, droits, intégrations et livrables définis. Développement freelance à distance.',
    heading: 'Un CRM autour de votre façon de travailler.',
    lead: 'Je conçois et développe des outils métier sur mesure : gestion des contacts, suivi des dossiers, tableaux de bord et intégrations. Nous définissons les parcours, les utilisateurs et le périmètre avant de chiffrer le projet.',
    brief: 'Que doit contenir le premier brief ?',
    items: ['La tâche que votre équipe répète et les endroits où les informations se perdent.', 'Les personnes qui utilisent l’outil et ce que chacune doit pouvoir voir ou modifier.', 'Les données et outils existants à relier, sans transmettre de dossiers clients confidentiels.', 'Le premier résultat utile, votre échéance et les contraintes importantes.'],
    scope: 'Que peut comprendre la livraison ?',
    scopeText: 'Un projet cadré peut comprendre l’interface, le modèle de données, les droits d’accès, les intégrations et la prise en main. Le devis précise les éléments inclus, les étapes de validation et les limites. Hébergement, maintenance et abonnements tiers sont clarifiés séparément.',
    proof: 'Un exemple concret : mon CRM interne',
    proofText: 'Mon propre outil d’acquisition réunit collecte, qualification de prospects et suivi des opportunités avec Python, Supabase et Next.js. Le portfolio décrit son périmètre sans exposer le code privé ni les fiches de prospects.',
    proofLink: 'Lire le cas du CRM',
    questions: 'Avant de démarrer',
    faq: [
      ['Faut-il remplacer tous mes outils existants ?', 'Non. Le cadrage identifie ce qui doit être conservé et ce qui doit communiquer. Une fonctionnalité ou une intégration ciblée peut suffire.'],
      ['Peut-on partir d’un tableur ?', 'Une structure d’exemple aide à expliquer les champs et les parcours. Utilisez des lignes fictives ou anonymisées pour le premier échange ; les accès aux données réelles sont convenus séparément.'],
      ['Comment le prix est-il défini ?', 'Le projet est chiffré après cadrage des utilisateurs, des parcours, des intégrations et des livrables.'],
    ],
    next: 'Commencez par la tâche à simplifier.',
    nextText: 'Décrivez le fonctionnement actuel, le résultat attendu et votre échéance. Ne transmettez ni mot de passe ni donnée client confidentielle.',
    contact: 'Décrire mon projet', home: 'Retour au portfolio',
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const c = content((await getLocale()) === 'en');
  return { title: c.title, description: c.description, alternates: { canonical: path }, openGraph: { title: c.title, description: c.description, url: path, images: ['/opengraph-image'] }, twitter: { card: 'summary_large_image', title: c.title, description: c.description, images: ['/opengraph-image'] } };
}

export default async function BusinessTools() {
  const en = (await getLocale()) === 'en';
  const c = content(en);
  const schema = { '@context': 'https://schema.org', '@type': 'Service', name: en ? 'Custom business tools and CRM development' : 'Développement d’outils métier et CRM sur mesure', description: c.description, url: `${siteUrl}${path}`, provider: { '@type': 'Person', name: 'Wael Chatoui', url: siteUrl } };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <header className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between gap-4"><Link href="/" aria-label={en ? 'Wael Chatoui, home' : 'Wael Chatoui, accueil'} className="font-display font-bold text-2xl min-h-11 inline-flex items-center">w.</Link><div className="flex items-center gap-4"><Link href="/#contact" className="text-sm underline underline-offset-4 min-h-11 inline-flex items-center">{c.contact}</Link><LocaleSwitcher /></div></header>
    <main id="main-content" className="max-w-3xl mx-auto px-6 pt-12 pb-24">
      <Link href="/" className="text-sm text-text-muted min-h-11 inline-flex items-center underline underline-offset-4">{c.home}</Link>
      <h1 className="font-display text-4xl sm:text-6xl leading-tight tracking-tight mt-8">{c.heading}</h1>
      <p className="text-lg text-text-muted leading-relaxed mt-8">{c.lead}</p>
      <section className="mt-16"><h2 className="font-display text-3xl">{c.brief}</h2><ol className="list-decimal pl-6 mt-6 space-y-5 text-text-muted leading-relaxed">{c.items.map(item => <li key={item}>{item}</li>)}</ol></section>
      <section className="mt-16"><h2 className="font-display text-3xl">{c.scope}</h2><p className="mt-6 text-text-muted leading-relaxed">{c.scopeText}</p></section>
      <section className="mt-16 border-y border-border py-10"><h2 className="font-display text-3xl">{c.proof}</h2><p className="mt-6 text-text-muted leading-relaxed">{c.proofText}</p><Link href="/#project-leads" className="inline-flex items-center min-h-11 mt-4 underline underline-offset-4">{c.proofLink}</Link></section>
      <section className="mt-16"><h2 className="font-display text-3xl mb-6">{c.questions}</h2>{c.faq.map(([question, answer]) => <details key={question} className="border-b border-border py-4"><summary className="cursor-pointer min-h-11 flex items-center justify-between gap-4 font-medium">{question}<span aria-hidden="true">+</span></summary><p className="text-text-muted leading-relaxed pt-4 pb-2">{answer}</p></details>)}</section>
      <section className="mt-16"><h2 className="font-display text-3xl">{c.next}</h2><p className="mt-6 text-text-muted leading-relaxed">{c.nextText}</p><Link href="/#contact" className="inline-flex items-center min-h-12 bg-text text-bg rounded-full px-6 py-3 mt-6 text-sm">{c.contact}</Link></section>
    </main>
  </>;
}
