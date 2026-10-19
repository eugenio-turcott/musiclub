import 'server-only';
import { unstable_cache } from 'next/cache';
import { slugifyArtist } from '../utils/ratingUtils';
import genres from '../utils/genreCatalog.cjs';

// Serialize uncached MusicBrainz requests, including concurrent artist pages.
let queue = Promise.resolve();
let nextRequestAt = 0;
function musicBrainz(path) {
  const task = queue.then(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, nextRequestAt - Date.now())));
    nextRequestAt = Date.now() + 1100;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(`https://musicbrainz.org/ws/2/${path}`, {
        headers: { 'User-Agent': 'Musiclub/9.16 (https://www.musiclub.org; contact@musiclub.org)', Accept: 'application/json' },
        signal: AbortSignal.timeout(8000), next: { revalidate: 86400 },
      });
      if (response.ok) return response.json();
      if (attempt || ![429, 502, 503, 504].includes(response.status)) throw new Error('MusicBrainz no está disponible');
      await new Promise(resolve => setTimeout(resolve, 1200));
      nextRequestAt = Date.now() + 1100;
    }
  });
  queue = task.catch(() => {});
  return task;
}

export const getVerifiedArtistProfile = unstable_cache(async name => {
  const query = `artist:"${name.replace(/["\\]/g, ' ')}"`;
  const search = await musicBrainz(`artist/?query=${encodeURIComponent(query)}&limit=10&fmt=json`);
  const target = slugifyArtist(name);
  const artist = (search.artists || []).find(a => slugifyArtist(a.name) === target || (a.aliases || []).some(alias => slugifyArtist(alias.name) === target));
  if (!artist) return null;
  const groups = [];
  for (let offset = 0; ; offset += 100) {
    const page = await musicBrainz(`release-group?artist=${artist.id}&inc=artist-credits&limit=100&offset=${offset}&fmt=json`);
    const items = page['release-groups'] || [];
    groups.push(...items);
    if (offset + items.length >= (page['release-group-count'] || 0) || !items.length) break;
  }
  const discography = groups.filter(g => (g['artist-credit'] || []).some(credit => credit.artist?.id === artist.id)).map(g => {
    const secondary = (g['secondary-types'] || []).map(t => t.toLowerCase());
    const release_type = secondary.includes('compilation') ? 'COMPILACION' : secondary.includes('live') ? 'EN VIVO' : secondary.includes('soundtrack') ? 'SOUNDTRACK' : secondary.includes('remix') ? 'REMIX' : g['primary-type'] === 'EP' ? 'EP' : g['primary-type'] === 'Single' ? 'SENCILLO' : 'ALBUM';
    return { id: g.id, mbid: g.id, name: g.title, artists: [artist.name], release_type,
      image: `https://coverartarchive.org/release-group/${g.id}/front-250`,
      releaseDate: g['first-release-date'] || '', releaseYear: Number(g['first-release-date']?.slice(0,4)) || null,
      totalTracks: null, source: 'MUSICBRAINZ' };
  }).sort((a,b) => b.releaseDate.localeCompare(a.releaseDate));
  return { success: true, source: 'MUSICBRAINZ', artist: { id: null, mbid: artist.id, name: artist.name,
    image: '', genres: genres.normalizeGenres((artist.tags || []).filter(t => t.count > 0).map(t => t.name)) },
    topTracks: [], discography };
}, ['verified-artist-discography-v916'], { revalidate: 86400 });
