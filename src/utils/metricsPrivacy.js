const privatePage = /^\/(admin|profile|perfil|settings|configuracion|recomendaciones|para-ti|recommendations)(\/|$)/;
export function publicMetricEvent(event) {
  try {
    const url = new URL(event.url);
    if (privatePage.test(url.pathname)) return null;
    return { ...event, url: url.origin + url.pathname };
  } catch { return null; }
}
