import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Products from '@/components/products';
import LocaleSwitcher from '@/components/locale-switcher';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const english = (await getLocale()) === 'en';
  const title = english ? 'FluentFlow, Fluide and La rédaction | Wael Chatoui' : 'FluentFlow, Fluide et La rédaction | Wael Chatoui';
  const description = english ? 'Explore three tools for French teaching, strength training and editorial research.' : 'Découvrez trois outils pour l’enseignement du français, le suivi de musculation et la veille éditoriale.';
  return { title, description, alternates: { canonical: '/produits' }, openGraph: { title, description, url: '/produits', images: ['/opengraph-image'] }, twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] } };
}

export default async function ProductsPage() {
  const english = (await getLocale()) === 'en';
  return <>
    <header className="max-w-6xl mx-auto px-6 pt-7 flex justify-between items-center"><Link href="/" className="font-display font-bold text-lg">Wael Chatoui</Link><LocaleSwitcher /></header>
    <main id="main-content" className="pt-20"><div className="max-w-6xl mx-auto px-6"><h1 className="font-display text-5xl lg:text-7xl font-bold tracking-tight max-w-3xl">{english ? 'Teach. Train. Write.' : 'Enseigner. S’entraîner. Écrire.'}</h1><p className="text-lg text-text-muted max-w-xl mt-6 mb-16">{english ? 'Find the right tool for your next lesson, training session or editorial subject.' : 'Trouvez l’outil adapté à votre prochain cours, votre prochaine séance ou votre prochain sujet.'}</p></div><Products full /></main>
    <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-border"><Link href="/#contact" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">{english ? 'Discuss a project with Wael' : 'Parler d’un projet avec Wael'}</Link></footer>
  </>;
}
