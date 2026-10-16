'use client';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect, useState } from 'react';
import { metricsAllowed } from '../services/siteMetrics';
import { publicMetricEvent } from '../utils/metricsPrivacy';
const beforeSend = event => metricsAllowed() ? publicMetricEvent(event) : null;
export function SiteMetrics() {
  const [production, setProduction] = useState(false);
  useEffect(() => { setProduction(window.location.hostname === 'www.musiclub.org' || window.location.hostname === 'musiclub.org'); }, []);
  if (!production) return null;
  return <><Analytics beforeSend={beforeSend} /><SpeedInsights sampleRate={0.5} beforeSend={beforeSend} /></>;
}
export function MetricsPreference() {
  const [disabled, setDisabled] = useState(false);
  useEffect(() => { setDisabled(!metricsAllowed()); }, []);
  return <button type="button" className="mt-3 rounded-xl border border-white/30 px-4 py-2 text-white" onClick={() => {
    const next = !disabled;
    try { localStorage.setItem('musiclub_metrics_disabled', String(next)); setDisabled(next); } catch {}
  }}>{disabled ? 'Permitir medición de uso en este navegador' : 'Desactivar medición de uso en este navegador'}</button>;
}
