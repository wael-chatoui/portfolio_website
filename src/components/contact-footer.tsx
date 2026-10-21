'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

export default function ContactFooter() {
  const t = useTranslations('contact');
  const tf = useTranslations('footer');

  const [formData, setFormData] = useState({ name: '', email: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === 'loading' || !formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(15_000),
      });

      const data = await res.json();
      if (!res.ok || data.success !== true) throw new Error(t('formError'));

      setStatus('success');
      setFormData({ name: '', email: '', message: '', website: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      <div>
        <section
          id="contact"
          className="snap-section relative min-h-screen flex items-center py-20 lg:py-0"
          style={{ backgroundColor: '#141414' }}
        >
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-2xl mx-auto text-center">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-text-subtle text-xs tracking-[0.3em] uppercase font-body mb-6">
                  04
                </p>
                <h2 className="font-display text-4xl lg:text-6xl font-bold tracking-tight mb-4">
                  {t('title')}
                </h2>
                <p className="text-text-muted font-body text-lg mb-14">
                  {t('subtitle')}
                </p>
              </motion.div>

              {/* Contact Form */}
              <motion.form
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4 mb-14 text-left"
                onSubmit={handleSubmit}
                aria-busy={status === 'loading'}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <label htmlFor="contact-name" className="sr-only">{t('formName')}</label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    maxLength={120}
                    disabled={status === 'loading'}
                    placeholder={t('formName')}
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="flex-1 bg-white/[0.04] border border-border/50 rounded-lg px-4 py-3 text-sm font-body text-text placeholder:text-text-subtle/60 focus:outline-none focus:border-text-subtle transition-colors duration-300"
                  />
                  <label htmlFor="contact-email" className="sr-only">{t('formEmail')}</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength={254}
                    disabled={status === 'loading'}
                    placeholder={t('formEmail')}
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="flex-1 bg-white/[0.04] border border-border/50 rounded-lg px-4 py-3 text-sm font-body text-text placeholder:text-text-subtle/60 focus:outline-none focus:border-text-subtle transition-colors duration-300"
                  />
                </div>
                <label htmlFor="contact-message" className="sr-only">{t('formMessageLabel')}</label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder={t('formMessage')}
                  required
                  maxLength={6000}
                  disabled={status === 'loading'}
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-border/50 rounded-lg px-4 py-3 text-sm font-body text-text placeholder:text-text-subtle/60 focus:outline-none focus:border-text-subtle transition-colors duration-300 resize-none"
                />
                <div hidden aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))} />
                </div>
                <p className="text-xs text-text-muted">{t('formPrivacy')}</p>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="cursor-pointer self-center inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-text text-bg font-body text-sm font-medium rounded-full hover:bg-accent transition-colors duration-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {status === 'loading' ? t('formSending') : t('formSend')}
                </button>

                {/* Feedback */}
                {status === 'success' && (
                  <p role="status" className="text-center text-sm font-body text-green-400 mt-2">
                    {t('formSuccess')}
                  </p>
                )}
                {status === 'error' && (
                  <p role="alert" className="text-center text-sm font-body text-red-400 mt-2">
                    {t('formError')}
                  </p>
                )}
                <a href="mailto:chatoui.wael40@gmail.com" className="self-center text-sm text-text-muted underline underline-offset-4 hover:text-text">{t('directEmail')}</a>
              </motion.form>

              {/* Contact links */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-5"
              >
                <ContactLink href="https://github.com/wael-chatoui" label="GitHub">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </ContactLink>
                <ContactLink href="https://linkedin.com/in/wael-chatoui" label="LinkedIn">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </ContactLink>
                <ContactLink href="mailto:chatoui.wael40@gmail.com" label={t('email')}>
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </ContactLink>
                <ContactLink href="tel:+33618704659" label={t('phone')}>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </ContactLink>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-8" style={{ backgroundColor: '#141414' }}>
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-text-subtle text-xs font-body">
              &copy; {new Date().getFullYear()} Wael Chatoui. {tf('rights')}
            </p>
            <p className="text-text-subtle text-xs font-body">
              {tf('madeWith')} Next.js & Framer Motion
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ContactLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('mailto:') || href.startsWith('tel:') ? undefined : '_blank'}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 text-text-subtle text-xs font-body hover:text-text hover:border-border transition-all duration-300 no-underline"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
      {label}
    </a>
  );
}
