import { getLocale } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { getProducts } from '@/lib/products';

export default async function Products({ full = false }: { full?: boolean }) {
  const english = (await getLocale()) === 'en';
  const Heading = full ? 'h2' : 'h3';
  return (
    <section id="products" aria-label={english ? 'Products' : 'Produits'} className={`snap-section relative border-t border-border ${full ? 'py-10 lg:py-14' : 'py-24 lg:py-32'}`}>
      <div className="max-w-6xl mx-auto px-6">
        {!full && <div className="max-w-2xl mb-12">
          <h2 className="font-display font-bold tracking-tight text-4xl lg:text-5xl">{english ? 'Products you can explore' : 'Des produits à découvrir'}</h2>
          <p className="text-text-muted leading-relaxed mt-5">{english ? 'Three tools built around a concrete daily task. Choose the one that matches your work.' : 'Trois outils construits autour d’un usage quotidien. Choisissez celui qui correspond à votre besoin.'}</p>
        </div>}
        <div className="divide-y divide-border">
          {getProducts(english).map((product) => (
            <article id={product.id} key={product.id} className="grid lg:grid-cols-[1fr_1.5fr_auto] gap-5 lg:gap-10 py-9 scroll-mt-24">
              <div><p className="text-sm text-text-muted mb-2">{product.category}</p><Heading className="font-display text-3xl font-semibold tracking-tight">{product.name}</Heading></div>
              <div><p className="leading-relaxed">{product.description}</p><p className="text-sm text-text-muted mt-3">{product.audience}</p>
                {full && <ul className="text-sm text-text-muted list-disc pl-5 mt-5 space-y-2">{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}
              </div>
              <a href={product.href} className="self-start inline-flex items-center justify-between gap-2 min-h-11 text-sm underline underline-offset-4 hover:text-text-muted">{product.cta}<ArrowUpRight size={16} aria-hidden="true" /></a>
            </article>
          ))}
        </div>
        {!full && <a href="/produits" className="inline-flex min-h-11 items-center gap-2 mt-7 text-sm text-text-muted hover:text-text">{english ? 'Compare the three tools' : 'Voir les trois outils en détail'}<ArrowUpRight size={16} aria-hidden="true" /></a>}
      </div>
    </section>
  );
}
