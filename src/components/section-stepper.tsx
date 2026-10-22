'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocale } from 'next-intl';

const sections = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'products', label: 'Products' },
  { id: 'contact', label: 'Contact' },
];

export default function SectionStepper() {
  const english = useLocale() === 'en';
  const labels: Record<string, string> = english ? { hero: 'Home', about: 'Services', skills: 'Skills', projects: 'Work', products: 'Products', contact: 'Contact' } : { hero: 'Accueil', about: 'Prestations', skills: 'Compétences', projects: 'Réalisations', products: 'Produits', contact: 'Contact' };
  const [activeSection, setActiveSection] = useState('hero');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show stepper after initial page load animation
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        {
          threshold: 0.2,
          rootMargin: '0px 0px -20% 0px',
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    // Fallback: activate last section when scrolled to bottom
    const handleScroll = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      if (scrollBottom >= pageHeight - 50) {
        setActiveSection(sections[sections.length - 1].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observers.forEach((o) => o.disconnect());
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-6 xl:left-10 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-1"
    >
      {/* Vertical line behind dots */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-border/30" />

      {sections.map((section) => {
        const isActive = activeSection === section.id;

        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="relative group flex items-center min-w-11 min-h-11 justify-center cursor-pointer bg-transparent border-none rounded-full no-underline"
            aria-label={labels[section.id]}
            aria-current={isActive ? 'location' : undefined}
          >
            {/* Dot / indicator */}
            <div className="relative z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1 : 0.6,
                  backgroundColor: isActive
                    ? 'rgba(250, 250, 250, 1)'
                    : 'rgba(113, 113, 122, 0.4)',
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-2.5 h-2.5 rounded-full group-hover:scale-100 transition-transform duration-300"
              />
              {/* Active glow ring */}
              {isActive && (
                <motion.div
                  layoutId="stepper-ring"
                  className="absolute -inset-1.5 rounded-full border border-text/30"
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </div>

            {/* Label - appears to the right on hover or when active */}
            <motion.span
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                x: isActive ? 0 : 8,
              }}
              className="absolute left-full ml-4 text-xs font-body tracking-wider uppercase whitespace-nowrap text-text-muted group-hover:opacity-100 transition-all duration-300 pointer-events-none"
            >
              {labels[section.id]}
            </motion.span>
          </a>
        );
      })}
    </motion.div>
  );
}
