const library = require('../data/musicIconLibrary.json');
const {FAMILY_ICONS} = require('./genreIdentityPlan.cjs');
// Compatibility with older 100-unit vinyl assets: no nested groups.
module.exports=Object.fromEntries(Object.entries(FAMILY_ICONS).map(([family,icon])=>[
  family,library.icons[icon].body.replace(/<(path|circle|rect|ellipse|polyline|polygon|line)\b/g,
    '<$1 transform="scale(4.1666667)" stroke-width="2"')
]));
