'use client';

import { useEffect, useState } from 'react';
import type { TrafficReport } from '@/lib/studio-analytics';
import { analyticsDashboardUrl } from '@/lib/analytics-policy';
import AnalyticsPreference from './analytics-preference';

const number = (value: number) => new Intl.NumberFormat('fr-FR').format(value);
function countryName(value: string) {
  try { return /^[A-Z]{2}$/.test(value) ? new Intl.DisplayNames(['fr'], { type: 'region' }).of(value) || value : value; } catch { return value; }
}

export default function SiteTraffic() {
  const [days, setDays] = useState(7); const [refresh, setRefresh] = useState(0);
  const [report, setReport] = useState<TrafficReport | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/studio/analytics?days=${days}`, { cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Statistiques indisponibles.');
        setReport(result);
      } catch (e) { if (!controller.signal.aborted) { setReport(null); setError(e instanceof Error ? e.message : 'Statistiques indisponibles.'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [days, refresh]);
  const topList = (title: string, items: { name: string; views: number }[], country = false) => <section><h3>{title}<small>Pages vues</small></h3>{items.length ? <ul>{items.map(item => <li key={item.name}><span>{country ? countryName(item.name) : item.name}</span><strong>{number(item.views)}</strong></li>)}</ul> : <p>Les premières visites apparaîtront ici.</p>}</section>;
  return <section className="studio-panel studio-traffic" aria-labelledby="studio-traffic-title"><div className="studio-panel-head"><div><p className="studio-eyebrow">TON PORTFOLIO</p><h2 id="studio-traffic-title">Visites du site</h2></div><div className="studio-traffic-actions"><label><span className="sr-only">Période des statistiques</span><select value={days} onChange={event=>setDays(Number(event.target.value))}><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={60}>60 derniers jours</option><option value={90}>90 derniers jours</option></select></label><button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)}>{loading ? 'Chargement…' : 'Actualiser'}</button></div></div>
    <div className="studio-traffic-body" aria-busy={loading}>
      {loading ? <p role="status">Chargement des statistiques…</p> : error ? <p className="studio-traffic-error" role="status">{error}</p> : report && <>
        <div className="studio-traffic-totals"><div><span>Visiteurs</span><strong>{number(report.visitors)}</strong></div><div><span>Pages vues</span><strong>{number(report.pageviews)}</strong></div><p>Visiteurs estimés par jour, cumulés sur la période. Une personne revenant un autre jour peut être comptée à nouveau.</p></div>
        <div className="studio-traffic-lists">{topList('Pages consultées', report.pages)}{topList('D’où viennent-ils ?', report.sources)}{topList('Pays', report.countries, true)}</div>
        <p className="studio-traffic-updated">Relevé du {new Intl.DateTimeFormat('fr-FR', { dateStyle:'short', timeStyle:'short' }).format(new Date(report.fetchedAt))}. Statistiques du Studio, collectées depuis l’activation du suivi. Historique conservé 90 jours.</p>
      </>}
      <AnalyticsPreference/>
      <a className="studio-traffic-link" href={analyticsDashboardUrl} target="_blank" rel="noreferrer">Ouvrir les statistiques Vercel ↗</a>
    </div></section>;
}
