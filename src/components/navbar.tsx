'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import LocaleSwitcher from './locale-switcher';

const navLinks = [
  { href: '#about', key: 'about' },
  { href: '#projects', key: 'projects' },
  { href: '#products', key: 'products' },
  { href: '#contact', key: 'contact' },
] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (mobileOpen) { dialog?.showModal(); document.body.style.overflow = 'hidden'; }
    else { dialog?.close(); document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav aria-label={t('label')} initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.35 }} className={`fixed top-0 left-0 right-0 z-40 transition-colors ${scrolled ? 'bg-bg/95 border-b border-border' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#hero" aria-label={t('home')} className="font-display font-bold text-lg tracking-tight min-h-11 inline-flex items-center">W.</a>
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => <a key={link.key} href={link.href} className="inline-flex items-center min-h-11 text-sm text-text-muted hover:text-text">{t(link.key)}</a>)}
            <LocaleSwitcher />
          </div>
          <button type="button" onClick={() => setMobileOpen(true)} className="md:hidden w-11 h-11 inline-flex items-center justify-center" aria-label={t('menu')} aria-expanded={mobileOpen} aria-controls="mobile-navigation"><Menu size={22} aria-hidden="true" /></button>
        </div>
      </motion.nav>
      <dialog ref={dialogRef} id="mobile-navigation" aria-label={t('label')} onCancel={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} className="fixed inset-0 m-0 w-full h-full max-w-none max-h-none bg-bg text-text border-0 p-6 backdrop:bg-black/70 [&[open]]:flex flex-col">
        <div className="flex justify-end"><button type="button" onClick={() => setMobileOpen(false)} aria-label={t('close')} className="w-11 h-11 flex items-center justify-center"><X size={24} aria-hidden="true" /></button></div>
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {navLinks.map((link) => <a key={link.key} href={link.href} onClick={() => setMobileOpen(false)} className="font-display text-3xl font-bold min-h-11">{t(link.key)}</a>)}
          <LocaleSwitcher />
        </div>
      </dialog>
    </>
  );
}
