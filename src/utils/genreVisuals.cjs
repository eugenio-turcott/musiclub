const genres = require('./genreCatalog.cjs');
const artwork = require('../data/genreArtwork.json');
const FAMILY_RULES = [
  ['arabic', /arabic|arab|khaleeji|raqs|shaabi|maqam/],
  ['world', /world|global/],
  ['metal', /metal|grind|djent|deathcore/], ['punk', /punk|hardcore|emo/],
  ['reggaeton', /reggaeton|latin urban|trap latino/], ['regional', /regional|corrido|banda|mariachi|norteno|ranchera/],
  ['kpop', /k-pop/], ['jpop', /j-pop|city pop|shibuya/],
  ['hiphop', /hip hop|trap|rap|boom bap|drill/], ['rnb', /r&b|rhythm and blues|new jack/],
  ['soul', /soul|gospel/], ['jazz', /jazz|bebop|swing|bossa/], ['blues', /blues/],
  ['funk', /funk/], ['dance', /disco|dance/],
  ['ambient', /ambient|drone|new age|chillout/],
  ['electronic', /electro|techno|house|trance|garage(?! rock)|dubstep|drum|break|idm|edm|ebm|synth|trip hop|lo-fi|industrial|vapor|dub techno|dark wave|new wave/],
  ['classical', /classical|baroque|opera|orchestral|chamber|romantic|soundtrack|score/],
  ['country', /country|bluegrass|americana|honky/], ['reggae', /reggae|ska|dub$/],
  ['latin', /latin|cumbia|salsa|bachata|bolero|merengue|flamenco|tango|samba|rumba/],
  ['folk', /folk|singer-songwriter|acoustic|traditional/],
  ['indie', /indie|alternative$|dream pop|shoegaze/], ['rock', /rock|grunge|post-rock|psychedelia/],
  ['pop', /pop|ballad/], ['experimental', /experimental|avant-garde|noise|musique|art music/],
];
function genreFamily(raw) {
  const key = genres.genreKey(raw) || String(raw || '').toLowerCase();
  return FAMILY_RULES.find(([, pattern]) => pattern.test(key))?.[0] || `genre:${key}`;
}
// Unclassified genres receive their own geometric seal instead of sharing
// a world-music icon with unrelated traditions. The label remains the genre name.
function uniqueGenreMotif(key) {
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  const points = Array.from({length: 8}, (_,index) => {
    const angle = index * Math.PI / 4;
    const radius = 28 + ((hash >>> (index * 4)) & 15);
    return `${(50 + Math.cos(angle) * radius).toFixed(2)},${(50 + Math.sin(angle) * radius).toFixed(2)}`;
  });
  return `<polygon points="${points.join(' ')}"/><circle cx="50" cy="50" r="12"/><path d="M50 28v10M50 62v10M28 50h10M62 50h10"/>`;
}
function genreArtwork(raw) {
  const key = genres.genreKey(raw), family = genreFamily(raw);
  const fallback = family.startsWith('genre:') ? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#171433"/><g fill="none" stroke="#F57FA2" stroke-width="3" stroke-linejoin="round">${uniqueGenreMotif(family)}</g></svg>`)}` : `/genres/families/${family}.svg`;
  return { family, src: artwork[key] || fallback, name: genres.normalizeGenres([raw])[0] || 'Música' };
}
module.exports = { genreFamily, genreArtwork, uniqueGenreMotif };
