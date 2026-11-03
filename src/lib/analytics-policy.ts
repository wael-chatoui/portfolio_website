export const analyticsDashboardUrl = 'https://vercel.com/fraawdrinns-projects/wael-chatoui/analytics';
export const analyticsExclusionCookie = 'portfolio_analytics_excluded';
export const analyticsPreferenceEvent = 'portfolio-analytics-preference';
export const analyticsPreferenceMaxAge = 365 * 24 * 60 * 60;

export function analyticsPreference(cookieHeader: string): boolean | undefined {
  const value = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(analyticsExclusionCookie + '='))?.slice(analyticsExclusionCookie.length + 1);
  return value === '1' ? true : value === '0' ? false : undefined;
}

export function analyticsExcluded(cookieHeader: string, signedIn: boolean): boolean {
  return analyticsPreference(cookieHeader) ?? signedIn;
}

export function privateAnalyticsPath(path: string): boolean {
  try {
    const normalized = decodeURIComponent(path).replace(/\\/g, '/').toLowerCase();
    return ['/studio', '/api', '/_next', '/_vercel'].some(prefix => normalized === prefix || normalized.startsWith(prefix + '/'));
  } catch { return true; }
}

export function publicAnalyticsPath(path: string): boolean {
  return ['/', '/produits', '/rippletide', '/prestations/outils-metier-crm'].includes(path.replace(/\/$/, '') || '/');
}

export function filterAnalyticsEvent<T extends { url: string }>(event: T, excluded: boolean): T | null {
  if (excluded) return null;
  try {
    const url = new URL(event.url);
    if (!['https:', 'http:'].includes(url.protocol) || privateAnalyticsPath(url.pathname) || !publicAnalyticsPath(url.pathname)) return null;
    url.search = ''; url.hash = ''; url.username = ''; url.password = '';
    return { ...event, url: url.toString() };
  } catch { return null; }
}

export function saveAnalyticsPreference(excluded: boolean) {
  document.cookie = `${analyticsExclusionCookie}=${excluded ? '1' : '0'}; Path=/; Max-Age=${analyticsPreferenceMaxAge}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  window.dispatchEvent(new Event(analyticsPreferenceEvent));
}
