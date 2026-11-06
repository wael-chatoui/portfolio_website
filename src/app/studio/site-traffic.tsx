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
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<TrafficReport | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      clearTimeout(timer);
      if (!stopped && !document.hidden) timer = setTimeout(() => void load(), 30000);
    }
    async function load() {
      if (stopped || document.hidden || controller) return;
      clearTimeout(timer);
      const current = new AbortController(); controller = current;
      let timedOut = false;
      const timeout = setTimeout(() => { timedOut = true; current.abort(); }, 15000);
      setLoading(true);
      try {
        const response = await fetch(`/api/studio/analytics?days=${days}`, { cache: 'no-store', signal: current.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Statistiques indisponibles.');
        if (!stopped && !current.signal.aborted) { setReport(result); setError(''); }
      } catch (e) {
        if (!stopped && (timedOut || !current.signal.aborted)) setError(timedOut ? 'La mise à jour prend trop de temps. Nouvelle tentative automatique dans 30 secondes.' : e instanceof Error ? e.message : 'Statistiques indisponibles.');
      } finally {
        clearTimeout(timeout);
        if (controller === current) {
          controller = null;
          if (!stopped) { setLoading(false); schedule(); }
        }
      }
    }
    function visible() {
      if (document.hidden) {
        clearTimeout(timer); controller?.abort(); controller = null; setLoading(false);
      } else void load();
    }
    const resume = () => void load();
    void load();
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    return () => {
      stopped = true; clearTimeout(timer); controller?.abort();
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
    };
  }, [days]);
  const topList = (title: string, items: { name: string; views: number }[], country = false) => <section><h3>{title}<small>Pages vues</small></h3>{items.length ? <ul>{items.map(item => <li key={item.name}><span>{country ? countryName(item.name) : item.name}</span><strong>{number(item.views)}</strong></li>)}</ul> : <p>Les premières visites apparaîtront ici.</p>}</section>;
  return <section className="studio-panel studio-traffic" aria-labelledby="studio-traffic-title"><div className="studio-panel-head"><div><p className="studio-eyebrow">TON PORTFOLIO</p><h2 id="studio-traffic-title">Visites du site</h2></div><div className="studio-traffic-actions"><label><span className="sr-only">Période des statistiques</span><select value={days} onChange={event=>{setDays(Number(event.target.value));setReport(null);setLoading(true);setError('');}}><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={60}>60 derniers jours</option><option value={90}>90 derniers jours</option></select></label><small className="studio-traffic-auto">{loading && report ? 'Mise à jour…' : 'Actualisation auto · 30 s'}</small></div></div>
    <div className="studio-traffic-body" aria-busy={loading}>
      {loading && !report && <p role="status">Chargement des statistiques…</p>}
      {error && <p className="studio-traffic-error" role="status">{report && 'Dernières statistiques conservées. '}{error}</p>}
      {report && <>
        <div className="studio-traffic-totals"><div><span>Visiteurs</span><strong>{number(report.visitors)}</strong></div><div><span>Pages vues</span><strong>{number(report.pageviews)}</strong></div><p>Visiteurs estimés par jour, cumulés sur la période. Une personne revenant un autre jour peut être comptée à nouveau.</p></div>
        <div className="studio-traffic-lists">{topList('Pages consultées', report.pages)}{topList('D’où viennent-ils ?', report.sources)}{topList('Pays', report.countries, true)}</div>
        <p className="studio-traffic-updated">Relevé du <time dateTime={report.fetchedAt}>{new Intl.DateTimeFormat('fr-FR', { dateStyle:'short', timeStyle:'medium' }).format(new Date(report.fetchedAt))}</time>. Statistiques du Studio, collectées depuis l’activation du suivi. Historique conservé 90 jours.</p>
      </>}
      <AnalyticsPreference/>
      <a className="studio-traffic-link" href={analyticsDashboardUrl} target="_blank" rel="noreferrer">Ouvrir les statistiques Vercel ↗</a>
    </div></section>;
}
