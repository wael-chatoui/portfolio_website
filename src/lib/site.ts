export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://wael-chatoui.vercel.app').replace(/\/$/, '');
export const isProduction = process.env.VERCEL_ENV === 'production';

export function campaignUrl(base: string, product: string, path = '/') {
  const url = new URL(path, base);
  url.searchParams.set('utm_source', 'portfolio');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'produits');
  url.searchParams.set('utm_content', product);
  return url.toString();
}
