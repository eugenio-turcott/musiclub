// Pressing colors belong to the vinyl edition, independently of its musical genre.
const palettes = [
  ['laguna-coral', '#16d9d0', '#ff648b', '#d7fff5', 'split'],
  ['acido-violeta', '#c9f438', '#9464ff', '#f2ffae', 'swirl'],
  ['miel-translucida', '#f6ae36', '#dc642a', '#fff2ba', 'clear'],
  ['petroleo', '#117c91', '#bb62ed', '#70f6dc', 'marble'],
  ['atardecer', '#ff7057', '#b343de', '#ffe999', 'gradient'],
  ['galaxia', '#7951d9', '#f955b9', '#c6b6ff', 'splatter'],
  ['plata', '#a7b9ca', '#435871', '#f6fcff', 'marble'],
  ['perla', '#f6daeb', '#7bded2', '#fff9c4', 'swirl'],
  ['hielo', '#72cae7', '#6179ad', '#d7fbff', 'clear'],
  ['cereza-electrica', '#ed315b', '#396cfc', '#ffb8db', 'split'],
  ['lima-lava', '#acdf30', '#ff7434', '#e8ffa1', 'splatter'],
  ['durazno', '#ffb498', '#dc8aa4', '#fff0d9', 'marble'],
  ['esmeralda', '#25bb88', '#16756d', '#a8f6c7', 'clear'],
  ['rosa-tinta', '#ff65b4', '#29223e', '#ffd0ec', 'splatter'],
  ['aguamarina', '#1acbbd', '#327ced', '#c8ffec', 'swirl'],
  ['mandarina', '#ff973c', '#ed4f79', '#fff0a2', 'gradient'],
  ['cobalto-oro', '#3465dc', '#e8b650', '#c2dbff', 'split'],
  ['vino-crema', '#a43e76', '#ead6ad', '#ffc3dc', 'swirl'],
  ['menta-chicle', '#a8f3ca', '#ee7cd3', '#f6ffe2', 'split'],
  ['aurora', '#41ccce', '#7763f1', '#ffe3a0', 'marble'],
  ['lavanda', '#c5a2f0', '#8c6acc', '#f6d8ff', 'clear'],
  ['solar', '#f4d03b', '#f48646', '#fff9bd', 'splatter'],
  ['bosque-lila', '#418c6a', '#bd98ed', '#d4f5b6', 'marble'],
  ['sandia', '#ee6381', '#51c6a0', '#ffe0bb', 'swirl'],
];
const EDITIONS = Object.freeze(palettes.map(([id, base, accent, highlight, pattern]) => Object.freeze({
  id, base, accent, highlight, pattern, disc: `/genres/editions/${id}.svg`, glow: `${base}99`,
})));
function vinylEdition(value = 0) {
  if (typeof value === 'number') return EDITIONS[((Math.trunc(value) % EDITIONS.length) + EDITIONS.length) % EDITIONS.length];
  return EDITIONS.find(edition => edition.id === value) || EDITIONS[0];
}
function defaultEdition(seed) {
  let hash = 2166136261;
  for (const char of String(seed || 'musiclub')) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return vinylEdition(hash);
}
function drawVinylEdition(previous, random = Math.random) {
  const choices = EDITIONS.filter(edition => edition.id !== previous);
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
}
module.exports = { EDITIONS, vinylEdition, defaultEdition, drawVinylEdition };
