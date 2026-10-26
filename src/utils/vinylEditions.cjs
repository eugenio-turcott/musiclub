const { EDITIONS, vinylEdition } = require('./vinylPressings.cjs');
const { GENRES, genreKey } = require('./genreCatalog.cjs');
function hashGenre(seed) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return hash;
}
function color(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 30;
  const s = saturation / 100, l = lightness / 100, a = s * Math.min(l, 1-l);
  return '#' + [0,8,4].map(offset => {
    const k = (offset+h) % 12;
    return Math.round(255 * (l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');
  }).join('');
}
// Give familiar genres intentionally distinct pressings. The full registry receives
// deterministic palettes too; resolve collisions before rendering, never by render order.
const featured = ['pop','hip hop','soul','alternative','latin pop','experimental','metal','classical','ambient','reggaeton','funk','folk','rock','punk','reggae','electronic','alternative rock','r&b','indie rock','jazz','k-pop','country','regional mexicano','j-pop'];
const curated = new Map(featured.map((key,index) => [genreKey(key), EDITIONS[index]]));
const genrePalettes = new Map(), combinations = new Set();
const patterns = ['split','swirl','marble','splatter','clear','gradient'];
for (const genre of [...GENRES].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
  const hash = hashGenre(genre.id);
  const h = (hash % 360000) / 1000;
  let palette = curated.get(genre.id) || {
    base: color(h, 58+(hash>>>8)%28, 47+(hash>>>12)%17),
    accent: color(h+75+(hash>>>16)%195, 54+(hash>>>6)%31, 45+(hash>>>10)%21),
    highlight: color(h+30, 65, 85), pattern: patterns[(hash>>>18)%patterns.length],
  };
  const signature = entry => [entry.base.toLowerCase(),entry.accent.toLowerCase(),entry.highlight.toLowerCase()].join('|');
  let attempt = 0;
  while (combinations.has(signature(palette))) palette = {...palette, accent: color(h+127+(++attempt)*.618, 76, 58)};
  combinations.add(signature(palette));
  genrePalettes.set(genre.id, {...palette, id:`genre:${genre.id}`, glow:palette.base+'99'});
}
const artworkCache = new Map();
function defaultEdition(seed) {
  const key = genreKey(seed);
  if (!genrePalettes.has(key)) return EDITIONS[0];
  if (!artworkCache.has(key)) {
    const palette = genrePalettes.get(key);
    // Bump the versioned asset route when changing a palette already served publicly.
    artworkCache.set(key, Object.freeze({...palette, disc:'/genres/colors/v1/'+encodeURIComponent(key)+'.svg'}));
  }
  return artworkCache.get(key);
}
function drawVinylEdition(previous, random = Math.random) {
  const choices = EDITIONS.filter(edition => edition.id !== previous);
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
}
module.exports = { EDITIONS, vinylEdition, defaultEdition, drawVinylEdition };
