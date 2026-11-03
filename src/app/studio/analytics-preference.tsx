'use client';

import { useEffect, useState } from 'react';
import { analyticsExcluded, analyticsPreferenceEvent, saveAnalyticsPreference } from '@/lib/analytics-policy';

export default function AnalyticsPreference() {
  const [excluded, setExcluded] = useState(true);
  useEffect(() => {
    const update = () => setExcluded(analyticsExcluded(document.cookie, true));
    update(); window.addEventListener(analyticsPreferenceEvent, update);
    return () => window.removeEventListener(analyticsPreferenceEvent, update);
  }, []);
  return <div className="studio-analytics-preference"><label><input type="checkbox" checked={excluded} onChange={event => saveAnalyticsPreference(event.target.checked)}/><span>Ignorer mes visites sur ce navigateur</span></label><p>{excluded ? 'Tes visites sont exclues, même après déconnexion.' : 'Les visites de ce navigateur sont comptées sur le portfolio public.'} Les pages /studio restent toujours exclues. Ce réglage est propre à chaque navigateur.</p></div>;
}
