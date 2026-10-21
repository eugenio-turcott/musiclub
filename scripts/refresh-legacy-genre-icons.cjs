// Replace only the label drawing. Preserve every existing disc, color and size.
const fs=require('node:fs');
const path=require('node:path');
const motifs=require('../src/utils/genreMotifs.cjs');
const artwork=require('../src/data/genreArtwork.json');
const {genreFamily}=require('../src/utils/genreFamilies.cjs');
const entries=[...Object.entries(artwork).map(([id,file])=>[file,genreFamily(id)]),...Object.keys(motifs).map(family=>['/genres/families/'+family+'.svg',family])];
let changed=0;
for(const [file,family] of entries) {
  const motif=motifs[family]; if(!motif) continue;
  const absolute=path.resolve('public'+file),source=fs.readFileSync(absolute,'utf8');
  const next=source.replace(/(<g transform="translate\(110 104\)"[^>]*>)[\s\S]*?<\/g>/,`$1${motif}</g>`);
  if(next!==source){fs.writeFileSync(absolute,next);changed++;}
  const centerFile=path.resolve('public/genres/reveal/centers',file.slice('/genres/'.length));
  if(fs.existsSync(centerFile)) {
    const center=fs.readFileSync(centerFile,'utf8');
    fs.writeFileSync(centerFile,center.replace(/(<g transform="translate\(16 16\) scale\(\.68\)"[^>]*>)[\s\S]*?<\/g>/,`$1${motif}</g>`));
  }
}
console.log(`Updated ${changed} legacy labels; record artwork preserved.`);
