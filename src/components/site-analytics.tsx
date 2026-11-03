'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { analyticsExcluded, filterAnalyticsEvent } from '@/lib/analytics-policy';

export default function SiteAnalytics({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const [context, setContext] = useState<{ excluded: boolean } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/analytics/exclusion', { cache:'no-store', signal:controller.signal });
        const result = await response.json();
        if (response.ok && typeof result.excluded === 'boolean') setContext(result);
      } catch { /* An unavailable exclusion check leaves collection disabled. */ }
    }
    void load(); return () => controller.abort();
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !context || !pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    const event = filterAnalyticsEvent({ url:location.href }, analyticsExcluded(document.cookie, context.excluded));
    if (!event) return;
    let source = '';
    try { source = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
    void fetch('/api/visits', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'same-origin', keepalive:true, body:JSON.stringify({ eventId:crypto.randomUUID(), path:new URL(event.url).pathname, source }) }).catch(() => {});
  }, [enabled, context, pathname]);
  if (!enabled || !context) return null;
  return <Analytics mode="production" debug={false} beforeSend={event => filterAnalyticsEvent(event, analyticsExcluded(document.cookie, context.excluded))} />;
}
