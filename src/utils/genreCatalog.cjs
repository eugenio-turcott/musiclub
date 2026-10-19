const officialNames = require('../data/musicGenres.json');
const additionalNames = ['alternative', 'indie', 'arabic music', 'latin urban', 'soundtrack'];
const fold = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/&amp;/g, '&').replace(/[‐‑–—_-]+/g, ' ').replace(/\s+/g, ' ').trim();
const aliases = {
  rap: 'hip hop', 'rap/hip hop': 'hip hop', 'rhythm and blues': 'r&b', 'rhythm & blues': 'r&b',
  electronica: 'electronic', electronico: 'electronic',
  'rock alternativo': 'alternative rock', 'metal alternativo': 'alternative metal',
  'rock psicodelico': 'psychedelic rock', 'rock progresivo': 'progressive rock',
  'hip hop alternativo': 'alternative hip hop', alternativo: 'alternative', alternativa: 'alternative',
  latino: 'latin', 'musica latina': 'latin', urbano: 'latin urban', 'pop latino': 'latin pop',
  'latin trap': 'trap latino', 'regional mexican': 'regional mexicano',
  'musica mexicana': 'regional mexicano', 'mexican music': 'regional mexicano',
  clasica: 'classical', 'musica clasica': 'classical', cantautor: 'singer-songwriter',
  arabe: 'arabic music', arabic: 'arabic music', 'musica arabe': 'arabic music',
  balada: 'ballad', 'rock & roll': 'rock and roll', 'rock n roll': 'rock and roll',
  synthpop: 'synth-pop', kpop: 'k-pop', jpop: 'j-pop',
};
const translations = {
  'hip hop': 'Hip-Hop', 'r&b': 'R&B', electronic: 'Electrónica',
  'alternative rock': 'Rock Alternativo', 'alternative metal': 'Metal Alternativo',
  'alternative hip hop': 'Hip-Hop Alternativo', 'alternative pop': 'Pop Alternativo',
  'psychedelic rock': 'Rock Psicodélico', 'progressive rock': 'Rock Progresivo',
  alternative: 'Alternativo', indie: 'Indie', classical: 'Clásica', 'singer-songwriter': 'Cantautor',
  'latin pop': 'Pop Latino', latin: 'Latino', 'latin urban': 'Urbano', 'trap latino': 'Trap Latino',
  'regional mexicano': 'Regional Mexicano', reggaeton: 'Reggaetón', 'arabic music': 'Música Árabe',
  ballad: 'Balada', 'jazz fusion': 'Jazz Fusión', 'k-pop': 'K-Pop', 'j-pop': 'J-Pop',
  idm: 'IDM', edm: 'EDM', ebm: 'EBM', 'uk garage': 'UK Garage', 'neo-soul': 'Neo-Soul', 'lo-fi': 'Lo-Fi',
};
const byName = new Map([...officialNames, ...additionalNames].map(name => [fold(name), name]));
const exactNames = new Map([...officialNames, ...additionalNames].map(name => [name.normalize('NFC').toLowerCase(), name]));
const nameForKey = key => translations[key] || key.replace(/(^|[\s-])\p{L}/gu, letter => letter.toUpperCase());
for (const [key, label] of Object.entries(translations)) { byName.set(fold(label), key); exactNames.set(label.normalize('NFC').toLowerCase(), key); }
const GENRES = [...new Set([...officialNames, ...additionalNames])].map(id => ({ id, name: nameForKey(id), official: officialNames.includes(id) }))
  .sort((a,b) => a.name.localeCompare(b.name, 'es'));
const GENRE_SOURCE = { url: 'https://musicbrainz.org/genres', retrieved: '2026-10-19', officialCount: officialNames.length, additionalCount: additionalNames.length };

function genreKey(raw) {
  const name = typeof raw === 'object' && raw ? raw.name : raw;
  if (typeof name !== 'string' || name.length > 120) return null;
  const exact = exactNames.get(name.trim().normalize('NFC').toLowerCase());
  if (exact) return exact;
  const folded = fold(name), mapped = aliases[folded];
  return (mapped && byName.get(fold(mapped))) || byName.get(folded) || null;
}
function normalizeGenres(raw = [], max = 12) {
  if (!Array.isArray(raw) || max < 1) return [];
  const result = [], seen = new Set();
  for (const value of raw) {
    const parts = genreKey(value) ? [value] : typeof value === 'string' ? value.split(/[\/;|,]/) : [value];
    for (const part of parts) {
      const id = genreKey(part);
      if (!id || seen.has(id)) continue;
      seen.add(id); result.push(nameForKey(id));
      if (result.length >= max) return result;
    }
  }
  return result;
}
function albumGenreKeys(album) { return normalizeGenres(album?.genres).map(genreKey); }
function genreCounts(albums) {
  const counts = new Map();
  for (const album of albums) for (const id of albumGenreKeys(album)) counts.set(id, (counts.get(id) || 0) + 1);
  return counts;
}
function filterByGenre(albums, selected = 'all') {
  if (selected === 'all') return albums;
  const id = genreKey(selected);
  return id ? albums.filter(album => albumGenreKeys(album).includes(id)) : [];
}
function genreCapsule(raw) {
  const id = genreKey(raw);
  if (!id) throw new Error('A capsule requires a recognized genre');
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  const hue = (hash % 36000) / 100, saturation = 65 + ((hash >>> 8) % 20), name = nameForKey(id);
  return { id: `genre:${id}`, genre: id, name: `Cápsula de ${name}`, badge: name,
    icon: name.split(/[\s-]+/).map(word => word[0]).slice(0,2).join('').toUpperCase(),
    topGrad: 'from-white/20 to-black/20', botGrad: 'from-white/95 to-white/75', ring: 'border-white/50', shadow: 'shadow-black/30',
    topBackground: `linear-gradient(135deg,hsl(${hue} ${saturation}% 64%),hsl(${(hue+24)%360} ${saturation}% 38%))`,
    bottomBackground: `linear-gradient(135deg,hsl(${hue} 70% 96%),hsl(${hue} 65% 82%))`,
    glow: `hsl(${hue} ${saturation}% 55% / 0.6)` };
}
function drawGenreCapsule(pool, selected = 'all', random = Math.random) {
  const candidates = filterByGenre(pool, selected).filter(album => albumGenreKeys(album).length);
  if (!candidates.length) return null;
  const album = candidates[Math.min(candidates.length-1, Math.floor(random() * candidates.length))], genres = albumGenreKeys(album);
  const id = selected === 'all' ? genres[Math.min(genres.length-1, Math.floor(random() * genres.length))] : genreKey(selected);
  return { album, theme: genreCapsule(id) };
}
module.exports = { GENRES, GENRE_SOURCE, genreKey, normalizeGenres, albumGenreKeys, genreCounts, filterByGenre, genreCapsule, drawGenreCapsule };
