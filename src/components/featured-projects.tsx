'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const publicProjects = [
  {
    title: 'Miria.ai',
    description: 'Plateforme SaaS connectant des experts à leurs clients via IA. Chat temps réel, synthèse vocale, abonnements Stripe, backoffice et workflows CRM.',
    tags: ['Next.js', 'TypeScript', 'Supabase', 'AI / LLMs', 'Stripe'],
    link: 'https://miria.ai',
    github: null,
  },
  {
    title: 'Niko\' Life Rent',
    description: 'Plateforme de réservation et vitrine pour une agence de location de véhicules. Présentation de la flotte, système de tarification et contact client direct.',
    tags: ['Next.js', 'TypeScript', 'TailwindCSS'],
    link: 'https://nikolife-rent.com',
    github: null,
  },
  {
    title: 'Attio Bridge',
    description: 'Extension Chrome connectée à un backend Go pour synchroniser automatiquement les profils d\'entreprises et prospects LinkedIn directement dans le CRM Attio.',
    tags: ['Chrome Extension', 'Go', 'PostgreSQL', 'CRM Automation'],
    link: 'https://github.com/wael-chatoui/attio-extension',
    github: 'https://github.com/wael-chatoui/attio-extension',
  },
  {
    title: 'Lead Generation CRM',
    description: 'Outil complet d\'acquisition client interne : scrapers Python (Google Maps, ESN, PME), scoring automatique avec Gemini AI et dashboard Next.js.',
    tags: ['Python', 'Supabase', 'Next.js', 'Gemini AI', 'Automation'],
    link: 'https://github.com/wael-chatoui/leads',
    github: 'https://github.com/wael-chatoui/leads',
  },
  {
    title: 'Flashscore Scraper',
    description: 'Pipeline automatisé d\'extraction sportive en temps réel. Scraping haute fréquence, parsing de cotes et statistiques avec synchronisation Google Sheets.',
    tags: ['Python', 'Scraping', 'Data Pipeline'],
    link: 'https://github.com/wael-chatoui/flashscore-scraper',
    github: 'https://github.com/wael-chatoui/flashscore-scraper',
  },
  {
    title: 'AI Call - Blackbox',
    description: 'Assistant vocal d\'accueil et de qualification téléphonique basé sur l\'API Blackbox NLP pour le traitement automatique des flux d\'appels.',
    tags: ['Python', 'AI / NLP', 'Voice', 'API'],
    link: 'https://github.com/wael-chatoui/AI-CALL-Blackbox',
    github: 'https://github.com/wael-chatoui/AI-CALL-Blackbox',
  },
];

const hackathonProjects = [
  {
    title: 'Antalyzr — AI Tinkerers Paris',
    description: 'Agent IA autonome conçu lors du Paris Vibe-a-thon (AI Tinkerers). Orchestration de workflows décisionnels et d\'analyse automatisée avec n8n, Mistral AI et OpenAI.',
    tags: ['Mistral AI', 'n8n', 'OpenAI', 'AI Agents'],
    link: 'https://paris.aitinkerers.org',
  },
  {
    title: 'Fitlens — Specs in the City Paris',
    description: 'Assistant de fitness et coaching en réalité augmentée développé pour les lunettes connectées Snapchat Spectacles. Hackathon Devpost.',
    tags: ['Snap Spectacles', 'AR', 'TypeScript', 'Devpost'],
    link: 'https://devpost.com',
  },
  {
    title: 'Vigil — CND Défense',
    description: 'Dashboard de surveillance firewall en temps réel avec détection intelligente des menaces (SQL injection, XSS, DDoS, brute force). Pipeline Python + WebSocket + React. Hackathon Ministère des Armées.',
    tags: ['Python', 'React', 'TypeScript', 'WebSocket', 'Sécurité'],
    link: 'https://github.com/hindkh21/HACKATHON_CND_TEAM3',
  },
  {
    title: 'HackTheFork',
    description: 'Application web full-stack construite en 24h sous contrainte forte en équipe.',
    tags: ['TypeScript', 'Next.js'],
    link: 'https://github.com/wael-chatoui/HackTheFork',
  },
];

const ecoleProjects = [
  {
    title: '42 - Minishell',
    description: 'Reproduction d\'un shell Unix POSIX from scratch en C. Parsing de commandes, pipes, redirections, variables d\'environnement et built-ins complets.',
    tags: ['C', 'Unix', 'Shell'],
    link: 'https://github.com/wael-chatoui/42-minishell',
  },
  {
    title: '42 - Philosophers',
    description: 'Problème des philosophes implementé en C. Gestion de la concurrence avec threads POSIX et mutex pour éviter deadlocks et race conditions.',
    tags: ['C', 'Threads', 'Concurrency'],
    link: 'https://github.com/wael-chatoui/42-philo',
  },
  {
    title: '42 - FdF',
    description: 'Renderer 3D isométrique wireframe en C avec MiniLibX. Projection de heightmaps en fil de fer avec gestion des transformations.',
    tags: ['C', 'Graphics', '3D'],
    link: 'https://github.com/wael-chatoui/42-FdF',
  },
];

const privateProjects = [
  {
    title: 'Miria',
    description: 'Plateforme SaaS qui connecte des experts à leurs clients via IA. Chats personnalisés, réponses 24/7, backoffice de gestion des connaissances.',
    tags: ['Next.js', 'Supabase', 'AI', 'SaaS'],
    year: 2025,
    demo: 'https://miria.ai',
  },
  {
    title: 'Glint',
    description: 'App iOS de crowdsourcing de données visuelles pour entreprises. Pipeline de collecte, validation et sanitisation d\'images par IA.',
    tags: ['Swift', 'SwiftUI', 'Supabase', 'AI'],
    year: 2026,
  },
];

function HackathonDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-lg bg-bg-surface border border-border/50 rounded-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-text-subtle text-xs tracking-[0.2em] uppercase font-body mb-1">Compétition</p>
            <h3 className="font-display text-2xl font-bold text-text">Hackathons</h3>
            <p className="text-text-muted text-sm font-body mt-1">Projets construits sous pression, en équipe.</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-text transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {hackathonProjects.map((project) => (
            <div key={project.title} className="border-l-2 border-border pl-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display font-semibold text-text hover:text-text-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {project.title}
                </a>
              </div>
              <p className="text-text-muted text-sm font-body leading-relaxed mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-xs font-body text-text-subtle px-2.5 py-0.5 rounded-full border border-border/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function EcoleDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-lg bg-bg-surface border border-border/50 rounded-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-text-subtle text-xs tracking-[0.2em] uppercase font-body mb-1">42 Paris</p>
            <h3 className="font-display text-2xl font-bold text-text">Projets d'école</h3>
            <p className="text-text-muted text-sm font-body mt-1">Projets réalisés à 42 Paris en C.</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-text transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {ecoleProjects.map((project) => (
            <div key={project.title} className="border-l-2 border-border pl-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display font-semibold text-text hover:text-text-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {project.title}
                </a>
              </div>
              <p className="text-text-muted text-sm font-body leading-relaxed mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-xs font-body text-text-subtle px-2.5 py-0.5 rounded-full border border-border/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PrivateDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-lg bg-bg-surface border border-border/50 rounded-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-text-subtle text-xs tracking-[0.2em] uppercase font-body mb-1">Privé</p>
            <h3 className="font-display text-2xl font-bold text-text">Projets non publics</h3>
            <p className="text-text-muted text-sm font-body mt-1">En cours ou code propriétaire.</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-text transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {privateProjects.map((project) => (
            <div key={project.title} className="border-l-2 border-border pl-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-display font-semibold text-text">{project.title}</h4>
                <span className="text-text-subtle text-xs font-body">{project.year}</span>
                {'demo' in project && project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-subtle hover:text-text text-xs font-body underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(project.demo as string).replace('https://', '')}
                  </a>
                )}
              </div>
              <p className="text-text-muted text-sm font-body leading-relaxed mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-xs font-body text-text-subtle px-2.5 py-0.5 rounded-full border border-border/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function FeaturedProjects() {
  const t = useTranslations('projects');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ecoleDialogOpen, setEcoleDialogOpen] = useState(false);
  const [hackathonDialogOpen, setHackathonDialogOpen] = useState(false);

  return (
    <>
      <section id="projects" className="snap-section relative min-h-screen flex items-center py-20 lg:py-0">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="max-w-6xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-text-subtle text-xs tracking-[0.3em] uppercase font-body mb-3">
              03
            </p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
              {t('title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicProjects.map((project, i) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.1 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}

          </div>

          {/* Separator + secondary dialog cards */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10 mb-6 flex items-center gap-4"
          >
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-text-subtle text-xs tracking-[0.2em] uppercase font-body">Voir aussi</span>
            <div className="flex-1 h-px bg-border/30" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hackathon card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <button onClick={() => setHackathonDialogOpen(true)} className="cursor-pointer group block w-full text-left">
                <div className="h-full p-5 rounded-xl bg-bg-surface/60 border border-border/30 transition-all duration-300 group-hover:border-border/60 group-hover:bg-bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-base font-semibold text-text-muted group-hover:text-text transition-colors">Hackathons</h3>
                    <svg className="w-4 h-4 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-text-subtle text-xs font-body">{hackathonProjects.length} projets · compétition</p>
                </div>
              </button>
            </motion.div>

            {/* 42 card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <button onClick={() => setEcoleDialogOpen(true)} className="cursor-pointer group block w-full text-left">
                <div className="h-full p-5 rounded-xl bg-bg-surface/60 border border-border/30 transition-all duration-300 group-hover:border-border/60 group-hover:bg-bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-base font-semibold text-text-muted group-hover:text-text transition-colors">42 Paris</h3>
                    <svg className="w-4 h-4 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-text-subtle text-xs font-body">{ecoleProjects.length} projets · C / systèmes</p>
                </div>
              </button>
            </motion.div>

            {/* Private card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <button onClick={() => setDialogOpen(true)} className="cursor-pointer group block w-full text-left">
                <div className="h-full p-5 rounded-xl bg-bg-surface/60 border border-border/30 transition-all duration-300 group-hover:border-border/60 group-hover:bg-bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-base font-semibold text-text-muted group-hover:text-text transition-colors">Projets privés</h3>
                    <svg className="w-4 h-4 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-text-subtle text-xs font-body">{privateProjects.length} projets · sur demande</p>
                </div>
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <a
              href="https://github.com/wael-chatoui"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer inline-flex items-center gap-2 text-text-muted hover:text-text text-sm font-body transition-colors no-underline"
            >
              {t('viewAll')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {dialogOpen && <PrivateDialog onClose={() => setDialogOpen(false)} />}
      {ecoleDialogOpen && <EcoleDialog onClose={() => setEcoleDialogOpen(false)} />}
      {hackathonDialogOpen && <HackathonDialog onClose={() => setHackathonDialogOpen(false)} />}
    </>
  );
}

const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

function ProjectCard({ project }: { project: typeof publicProjects[number] }) {
  const hasWebsite = project.github !== null;

  const inner = (
    <div className="group h-full p-6 lg:p-8 rounded-2xl bg-bg-surface border border-border/50 transition-all duration-300 hover:border-border hover:bg-bg-elevated flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-text">{project.title}</h3>
        {hasWebsite && (
          <a
            href={project.github!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text-subtle hover:text-text transition-colors p-1 -mt-1 -mr-1 flex-shrink-0"
            aria-label="GitHub"
          >
            <GithubIcon />
          </a>
        )}
      </div>
      <p className="text-text-muted text-sm font-body mb-6 leading-relaxed flex-1">{project.description}</p>
      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="text-xs font-body text-text-subtle px-3 py-1 rounded-full border border-border/50">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className="cursor-pointer block no-underline h-full"
    >
      {inner}
    </a>
  );
}
