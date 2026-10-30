'use client';
export function SiteMetrics() {
  // Hosting metrics are collected by Cloudflare, without a browser analytics script.
  return null;
}
export function MetricsPreference() {
  return <p className="mt-3 text-white/60">La medición opcional desde el navegador está desactivada.</p>;
}
