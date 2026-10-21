'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section id="hero" className="snap-section relative min-h-screen flex items-center justify-center overflow-hidden py-28 lg:py-20">
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-text-muted text-sm tracking-[0.3em] uppercase font-body mb-6"
            >
              {t('greeting')}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-[0.95] mb-6"
            >
              {t('name').split(' ').map((word, i) => (
                <span key={i} className="block">
                  {word}
                </span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="text-text-muted text-lg sm:text-xl font-body max-w-md mx-auto lg:mx-0 mb-10"
            >
              {t('tagline')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <a
                href="#contact"
                className="cursor-pointer inline-flex items-center justify-center px-7 py-3.5 bg-text text-bg font-body text-sm font-medium rounded-full hover:bg-accent transition-colors duration-300 no-underline"
              >
                {t('contact')}
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <a
                href="#projects"
                className="cursor-pointer inline-flex items-center justify-center px-7 py-3.5 border border-border text-text-muted font-body text-sm font-medium rounded-full hover:text-text hover:border-text-subtle transition-all duration-300 no-underline"
              >
                {t('cta')}
              </a>
            </motion.div>
          </div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-shrink-0"
          >
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96">
              {/* Glow behind image */}
              <div className="absolute inset-0 rounded-full bg-white/[0.03] blur-3xl scale-110" />

              {/* Image container */}
              <div className="relative w-full h-full rounded-full overflow-hidden border border-border/50">
                <Image
                  src="/wchatoui.jpg"
                  alt="Wael Chatoui"
                  fill
                  className="object-cover"
                  priority
                  sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, (min-width: 640px) 288px, 256px"
                />
              </div>

              {/* Decorative ring */}
              <div className="absolute -inset-3 rounded-full border border-border/20" />
              <div className="absolute -inset-6 rounded-full border border-border/10" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 border border-border/50 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 bg-text-muted rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
