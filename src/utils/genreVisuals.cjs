const genres = require('./genreCatalog.cjs');
const artwork = require('../data/genreArtwork.json');
const FAMILY_RULES = [
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
  return FAMILY_RULES.find(([, pattern]) => pattern.test(key))?.[0] || 'world';
}
function genreArtwork(raw) {
  const key = genres.genreKey(raw), family = genreFamily(raw);
  return { family, src: artwork[key] || `/genres/families/${family}.svg`, name: genres.normalizeGenres([raw])[0] || 'Música' };
}
module.exports = { genreFamily, genreArtwork };
