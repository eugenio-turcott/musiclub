const genres = require('./genreCatalog.cjs');
const DEFAULT_APPEARANCE = { mode: 'gradient', colorA: '#161832', colorB: '#070812', vinyl: 'brand', logo: '/musiclub_logo_4.png', genre: 'pop', mediaUrl: '', mediaSize: 128, heading: '', intro: '' };
function poolAppearance(raw = {}) {
  if (!raw || typeof raw !== 'object') raw = {};
  const color = (value, fallback) => /^#[\da-f]{6}$/i.test(value || '') ? value : fallback;
  let mediaUrl = '';
  try { const url = new URL(raw.mediaUrl); if (url.protocol === 'https:') mediaUrl = url.href.slice(0, 2000); } catch {}
  return { mode: raw.mode === 'solid' ? 'solid' : 'gradient', colorA: color(raw.colorA, DEFAULT_APPEARANCE.colorA), colorB: color(raw.colorB, DEFAULT_APPEARANCE.colorB), vinyl: ['brand', 'genre', 'none'].includes(raw.vinyl) ? raw.vinyl : 'brand', logo: ['/musiclub_logo.png', '/musiclub_logo_2.png', '/musiclub_logo_3.png', '/musiclub_logo_4.png'].includes(raw.logo) ? raw.logo : DEFAULT_APPEARANCE.logo, genre: genres.normalizeGenres([raw.genre])[0] || 'Pop', mediaUrl, mediaSize: [96, 128, 176].includes(Number(raw.mediaSize)) ? Number(raw.mediaSize) : 128, heading: String(raw.heading || '').slice(0, 100), intro: String(raw.intro || '').slice(0, 600) };
}
function poolBackground(raw) { const a = poolAppearance(raw); return a.mode === 'solid' ? a.colorA : `linear-gradient(135deg, ${a.colorA}, ${a.colorB})`; }
function poolCapacity(season, used = 0) {
  const parsed = Number(season?.max_releases);
  const limit = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  return { limit, used, remaining: limit === null ? null : Math.max(0, limit - used), full: limit !== null && used >= limit };
}
function poolReleases(albums = [], entries = []) {
  const ids = new Set(entries.filter(entry => ['ACTIVO', 'GANADOR', 'GRADUADO'].includes(entry.status)).map(entry => String(entry.album_id)));
  return albums.filter(album => [album.id, ...(album.edition_member_ids || [])].some(id => ids.has(String(id))));
}
module.exports = { DEFAULT_APPEARANCE, poolAppearance, poolBackground, poolCapacity, poolReleases };
