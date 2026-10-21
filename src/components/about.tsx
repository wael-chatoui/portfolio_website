'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

export default function About() {
  const t = useTranslations('about');

  return (
    <section id="about" className="snap-section relative min-h-screen flex items-center py-20 lg:py-0">
      {/* Top separator line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4"
          >
            <p className="text-text-subtle text-xs tracking-[0.3em] uppercase font-body mb-3">
              01
            </p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
              {t('title')}
            </h2>
          </motion.div>

          {/* Content */}
          <div className="lg:col-span-8 space-y-6">
            {['p1'].map((key, i) => (
              <motion.p
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="text-text-muted text-base lg:text-lg leading-relaxed font-body"
              >
                {t(key)}
              </motion.p>
            ))}

            <div className="divide-y divide-border">
              {(t.raw('offers') as { title: string; description: string; proof: string; href: string }[]).map((offer) => (
                <article key={offer.title} className="py-6 first:pt-1">
                  <h3 className="font-display text-xl font-semibold mb-2">{offer.title}</h3>
                  <p className="text-text-muted leading-relaxed mb-3">{offer.description}</p>
                  <a href={offer.href} className="text-sm underline underline-offset-4 hover:text-text-muted">{offer.proof}</a>
                </article>
              ))}
            </div>
            <p className="text-sm text-text-muted leading-relaxed">{t('p3')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
