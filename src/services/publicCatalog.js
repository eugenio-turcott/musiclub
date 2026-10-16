const pending = new Map();
const cached = new Map();
export function clearPublicCatalog() { cached.clear(); }
export async function publicCatalog(slug) {
  const url = slug ? `/api/catalog?slug=${encodeURIComponent(slug)}` : '/api/catalog';
  const recent = cached.get(url);
  if (recent && Date.now() - recent.time < 30000) return structuredClone(recent.data);
  if (!pending.has(url)) pending.set(url, fetch(url, { cache: 'no-store' }).then(async response => {
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Catálogo temporalmente no disponible');
    const data = await response.json();
    cached.set(url, { time: Date.now(), data });
    return data;
  }).finally(() => pending.delete(url)));
  return structuredClone(await pending.get(url));
}
