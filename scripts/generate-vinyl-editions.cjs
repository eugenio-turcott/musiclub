const fs = require('node:fs');
const path = require('node:path');
const { EDITIONS } = require('../src/utils/vinylEditions.cjs');
const { vinylDiscSvg } = require('../src/utils/vinylDisc.cjs');
const directory = path.join(__dirname, '../public/genres/editions');
fs.mkdirSync(directory, {recursive:true});
for (const edition of EDITIONS) fs.writeFileSync(path.join(directory,edition.id+'.svg'), vinylDiscSvg(edition));
console.log(`Generated ${EDITIONS.length} independent vinyl editions.`);
