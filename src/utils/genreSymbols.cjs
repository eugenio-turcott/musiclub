const catalog = require('./genreCatalog.cjs');
const motifs = require('./genreMotifs.cjs');
const {genreFamily, uniqueGenreMotif} = require('./genreFamilies.cjs');
const PRIMARY = {
  metal:'metal', punk:'punk', rock:'rock', pop:'pop', hiphop:'hip hop', rnb:'r&b',
  soul:'soul', jazz:'jazz', blues:'blues', funk:'funk', dance:'disco', ambient:'ambient',
  electronic:'electronic', classical:'classical', country:'country', reggae:'reggae',
  latin:'latin', folk:'folk', indie:'indie', regional:'regional mexicano', reggaeton:'reggaeton',
  kpop:'k-pop', jpop:'j-pop', experimental:'experimental', arabic:'arabic music', world:'world',
};
// Small musical modifiers accompany the family figure rather than replacing it.
const MODIFIERS = [
  ['atmospheric', /atmospheric|ambient|ethereal|dream|shoegaze/, '<path d="M-8 3q4-5 8 0t8 0M-8 7q4-5 8 0t8 0M0-9v5M-3-6h6"/>'],
  ['black', /black|dark|gothic|noir/, '<path d="M4-8A9 9 0 1 0 4 8 7 7 0 0 1 4-8Z"/>'],
  ['death', /death|grind/, '<path d="M-6 3c-6-11 18-17 12 0L4 5v5h-8V5Z"/><path d="M-3-1h1M3-1h-1M0 6v4"/>'],
  ['doom', /doom|slow|funeral/, '<path d="M-7-9H7M-7 9H7M-5-8c0 7 10 9 10 16M5-8c0 7-10 9-10 16"/>'],
  ['power', /power|epic|royal/, '<path d="M-8-5-5 6H5L8-5 3 0 0-8-3 0ZM-5 9H5"/>'],
  ['progressive', /progressive|math|technical/, '<path d="M-8 8V2h6v-6h6v-5h5M-8 8H8"/>'],
  ['symphonic', /symphonic|orchestral|chamber|baroque/, '<path d="M-8-4H8M-8 1H8M-8 6H8M3-9V5q-7 6-7 1t7-2"/>'],
  ['folk', /folk|acoustic|traditional/, '<path d="M-7 8Q-8-8 7-9 9 6-7 8ZM-7 8 3-4M-1 1h6"/>'],
  ['speed', /thrash|speed|hard|heavy|fast/, '<path d="M-8-6 0 0-8 6M0-6 8 0 0 6"/>'],
  ['industrial', /industrial|machine|cyber/, '<rect x="-6" y="-6" width="12" height="12" rx="2"/><path d="M-3-10v4M3-10v4M-3 6v4M3 6v4M-10-3h4M6 3h4"/>'],
  ['psychedelic', /psyched|acid|space|cosmic/, '<path d="M0 0c-9-9 15-13 9 1S-14 13-9-2 8-15 11-6"/>'],
  ['fusion', /fusion|crossover|mixed/, '<path d="M-9-5H0L7 5H10M-9 5H0L7-5H10M7-8l3 3-3 3M7 2l3 3-3 3"/>'],
  ['minimal', /minimal|micro|lo-fi/, '<path d="M-8 0H8M-4-5H4M-4 5H4"/>'],
  ['dance', /dance|house|techno|club|disco/, '<path d="M-8 5V-3M-4 8V-8M0 5V-5M4 8V-8M8 5V-3"/>'],
  ['soul', /soul|romantic|ballad|love/, '<path d="M0 8-8 0C-13-9-2-11 0-4 2-11 13-9 8 0Z"/>'],
];
function hash(key) {
  let value = 2166136261;
  for (const char of key) value = Math.imul(value ^ char.codePointAt(0),16777619) >>> 0;
  return value;
}
function genreSymbol(raw) {
  const key = catalog.genreKey(raw);
  if (!key) return null;
  const family = genreFamily(key), primary = PRIMARY[family] === key;
  const modifier = primary ? null : MODIFIERS.find(([,pattern]) => pattern.test(key));
  const code = hash(key);
  // Each center has its own small rim accents, even when two subgenres share a modifier.
  const accents = Array.from({length:16}, (_,index) => {
    const angle = (index*22.5-90)*Math.PI/180;
    const radius = .55 + ((code >>> (index*2)) & 3)*.22;
    return `<circle cx="${(50+Math.cos(angle)*43).toFixed(2)}" cy="${(50+Math.sin(angle)*43).toFixed(2)}" r="${radius.toFixed(2)}"/>`;
  }).join('');
  const variation = modifier ? modifier[2] : uniqueGenreMotif('variation:'+key);
  const base = motifs[family] || uniqueGenreMotif('genre:'+key);
  const badge = primary || family.startsWith('genre:') ? '' : `<circle cx="77" cy="76" r="12" fill="#171433" stroke="#f57fa2" stroke-opacity=".35" stroke-width="1"/><g transform="translate(77 76)${modifier ? '' : ' translate(-8 -8) scale(.16)'}" fill="none" stroke="#ffdbe6" stroke-width="${modifier ? '1.5' : '8'}" stroke-linecap="round" stroke-linejoin="round">${variation}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#171433"/><g fill="#f57fa2" opacity=".6">${accents}</g><g transform="translate(${primary || family.startsWith('genre:') ? '17 17' : '18 14'}) scale(.64)" color="#f57fa2" stroke="#f57fa2" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${base}</g>${badge}</svg>`;
  return {key, family, modifier:modifier?.[0] || (primary ? 'primary' : 'individual'), svg};
}
module.exports = {genreSymbol};
