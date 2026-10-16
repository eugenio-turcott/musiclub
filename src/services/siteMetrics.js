export function metricsAllowed() {
  if (typeof window === 'undefined' || navigator.doNotTrack === '1') return false;
  try { return localStorage.getItem('musiclub_metrics_disabled') !== 'true'; } catch { return false; }
}
