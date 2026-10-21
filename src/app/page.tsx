import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import About from "@/components/about";
import Skills from "@/components/skills";
import FeaturedProjects from "@/components/featured-projects";
import ContactFooter from "@/components/contact-footer";
import SectionStepper from "@/components/section-stepper";
import { siteUrl } from '@/lib/site';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Products from '@/components/products';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { alternates: { canonical: '/' }, openGraph: { title: t('title'), description: t('description'), url: '/', images: ['/opengraph-image'] } };
}

export default function Home() {
  return (
    <>
      <Navbar />
      <SectionStepper />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: 'Wael Chatoui', url: siteUrl, jobTitle: 'Développeur freelance full-stack', knowsAbout: ['CRM', 'SaaS', 'Next.js', 'TypeScript', 'Python', 'Automatisation IA'], sameAs: ['https://github.com/wael-chatoui', 'https://linkedin.com/in/wael-chatoui'] }).replace(/</g, '\\u003c') }} />
      <main id="main-content">
        <Hero />
        <About />
        <Skills />
        <FeaturedProjects />
        <Products />
        <ContactFooter />
      </main>
    </>
  );
}
