// Musiclub's own vector artwork. Uses the brand palette from Musiclub General in Canva.
const fs = require('node:fs');
const path = require('node:path');
const genres = require('../src/utils/genreCatalog.cjs');
const motifs = require('../src/utils/genreMotifs.cjs');
// Bootstrap the visual registry before requiring its lookup utility.
const manifestPath = path.join(__dirname, '../src/data/genreArtwork.json');
if (!fs.existsSync(manifestPath)) fs.writeFileSync(manifestPath, '{}\n');
const { genreFamily, uniqueGenreMotif } = require('../src/utils/genreVisuals.cjs');
const palettes = [['#56408E','#F57FA2','#FFDBE6'],['#5A2D7C','#FFDBE6','#F57FA2'],['#171433','#F57FA2','#FFDBE6'],['#56408E','#FFDBE6','#F57FA2']];
function art(family, index=0) {
 const [center,accent,ink] = palettes[index % palettes.length];
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><clipPath id="record"><circle cx="160" cy="154" r="144"/></clipPath></defs><ellipse cx="164" cy="166" rx="144" ry="144" fill="#000000" opacity=".22"/><circle cx="160" cy="154" r="144" fill="#000000"/><g clip-path="url(#record)" fill="${accent}"><path d="M160 154 280 28 323 109Z"/><path d="M160 154 330 139 330 173Z"/><path d="M160 154-14 139-2 280Z"/></g><g fill="none" stroke="#56408E" opacity=".35"><circle cx="160" cy="154" r="127"/><circle cx="160" cy="154" r="117"/><circle cx="160" cy="154" r="106"/></g><circle cx="160" cy="154" r="78" fill="${center}"/><g transform="translate(110 104)" color="${ink}" stroke="${ink}" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${motifs[family] || uniqueGenreMotif(family)}</g><circle cx="160" cy="154" r="144" fill="none" stroke="${accent}" stroke-width="2" opacity=".25"/></svg>`;
}
const out = path.join(__dirname,'../public/genres'); fs.mkdirSync(path.join(out,'families'),{recursive:true});
Object.keys(motifs).forEach((family,index)=>fs.writeFileSync(path.join(out,'families',family+'.svg'),art(family,index)));
const auditPath=path.join(__dirname,'../audit'); fs.mkdirSync(auditPath,{recursive:true});
const snapshotPath=process.argv[2] || path.join(auditPath,'genre-catalog-after.json');
const snapshot=fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath,'utf8')) : null;
const present=snapshot ? genres.genreCounts(Array.isArray(snapshot) ? snapshot : snapshot.albums) : new Map(Object.keys(JSON.parse(fs.readFileSync(manifestPath,'utf8'))).map(id=>[id,0]));
const list=genres.GENRES.filter(genre=>present.has(genre.id));
const manifest={};
list.forEach((genre,index)=>{
 const slug=genre.id.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const filename=slug+'.svg'; manifest[genre.id]='/genres/'+filename;
 fs.writeFileSync(path.join(out,filename),art(genreFamily(genre.id),index));
});
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'../audit/genre-artwork-pages.json'),JSON.stringify(list.map((genre,index)=>({...genre,src:manifest[genre.id],family:genreFamily(genre.id),count:present.get(genre.id),index})),null,2));
console.log(`Generated ${list.length} genre records and ${Object.keys(motifs).length} visual families.`);

// Split the record and its label so only the center can expand/fade during reveal.
const revealOut = path.join(out, 'reveal');
fs.mkdirSync(path.join(revealOut, 'centers', 'families'), {recursive:true});
const disc = art('rock').replace(/<circle cx="160" cy="154" r="78"[^>]*\/>/, '<circle cx="160" cy="154" r="78" fill="#07070d"/>').replace(/<g transform="translate\(110 104\)"[^>]*>.*?<\/g>/, '');
fs.writeFileSync(path.join(revealOut,'disc.svg'), disc);
for (const relative of [...Object.values(manifest).map(src=>src.slice('/genres/'.length)), ...Object.keys(motifs).map(family=>'families/'+family+'.svg')]) {
  const svg = fs.readFileSync(path.join(out,relative),'utf8');
  const center = svg.match(/<circle cx="160" cy="154" r="78" fill="([^"]+)"/)[1];
  const group = svg.match(/<g transform="translate\(110 104\)"([^>]*)>(.*?)<\/g>/);
  const label = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${center}"/><g transform="translate(16 16) scale(.68)"${group[1]}>${group[2]}</g></svg>`;
  fs.writeFileSync(path.join(revealOut,'centers',relative), label);
}
console.log('Generated a separate record and 107 genre/family centers for the reveal.');
