'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Plus } from 'lucide-react';
import { getProjects, getOtherProjects } from '@/lib/projects';

export default function FeaturedProjects() {
  const t = useTranslations('projects');
  const english = useLocale() === 'en';

  return (
    <section id="projects" className="snap-section relative py-24 lg:py-32">
      <div className="absolute top-0 left-6 right-6 h-px bg-border" />
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-text-muted mt-5 leading-relaxed">{t('intro')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getProjects(english).map((project) => (
            <article key={project.id} id={`project-${project.id}`} className="p-6 lg:p-8 rounded-2xl bg-bg-surface border border-border flex flex-col scroll-mt-24">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="font-display text-xl font-bold">{project.title}</h3>
                {project.link && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" aria-label={`${t('viewProject')}: ${project.title}`} className="inline-flex min-h-11 min-w-11 items-center justify-center -mt-2 -mr-2 rounded-full hover:bg-bg-elevated text-text-muted hover:text-text">
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </a>
                )}
              </div>
              <p className="text-text-muted text-sm leading-relaxed mb-6">{project.description}</p>
              {project.problem && (
                <dl className="space-y-4 text-sm mb-6">
                  <div><dt className="font-medium mb-1">{t('problem')}</dt><dd className="text-text-muted leading-relaxed">{project.problem}</dd></div>
                  <div><dt className="font-medium mb-1">{t('delivery')}</dt><dd className="text-text-muted leading-relaxed">{project.delivery}</dd></div>
                </dl>
              )}
              <ul aria-label={t('technologies')} className="flex flex-wrap gap-2 mt-auto">
                {project.tags.map((tag) => <li key={tag} className="text-xs text-text-muted px-3 py-1 rounded-full border border-border">{tag}</li>)}
              </ul>
              {project.privateCode && <p className="text-xs text-text-muted mt-5">{t('privateCode')} <a href="#contact" className="underline underline-offset-4 hover:text-text">{t('discuss')}</a></p>}
            </article>
          ))}
        </div>
        <div className="mt-14 space-y-3">
          <h3 className="font-display text-xl mb-5">{t('also')}</h3>
          {getOtherProjects(english).map((group) => (
            <details key={group.id} className="group border border-border rounded-xl bg-bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 min-h-16">
                <span><span className="font-display font-semibold block">{group.title}</span><span className="text-sm text-text-muted mt-1 block">{group.summary}</span></span>
                <Plus size={20} className="shrink-0 group-open:rotate-45 transition-transform" aria-hidden="true" />
              </summary>
              <div className="px-5 pb-6 grid md:grid-cols-2 gap-6">
                {group.projects.map((project) => (
                  <article key={project.title} className="border-l-2 border-border pl-4">
                    <h4 className="font-medium mb-2">{'link' in project ? <a href={project.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{project.title}</a> : project.title}</h4>
                    <p className="text-text-muted text-sm leading-relaxed mb-3">{project.description}</p>
                    <p className="text-text-muted text-xs">{project.tags.join(' · ')}</p>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center"><a href="https://github.com/wael-chatoui" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-11 text-text-muted hover:text-text text-sm">{t('viewAll')} <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}
