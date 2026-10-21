const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const library=require('../src/data/musicIconLibrary.json');
const output=path.resolve('outputs/musiclub-genre-library-v2');
fs.mkdirSync(output,{recursive:true});
const entries=Object.entries(library.icons).filter(([,icon])=>icon.source.startsWith('Musiclub'));
const width=1120,height=Math.ceil(entries.length/8)*140;
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#171433"/>`;
for(let index=0;index<entries.length;index++){
  const [id,icon]=entries[index],x=index%8*140,y=Math.floor(index/8)*140;
  svg+=`<g transform="translate(${x+34} ${y+12}) scale(3)" fill="none" stroke="#f57fa2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.body}</g><text x="${x+70}" y="${y+112}" fill="white" text-anchor="middle" font-size="11" font-family="Arial">${id}</text>`;
}
svg+='</svg>';
sharp(Buffer.from(svg)).png().toFile(path.join(output,'instrumentos-revision.png')).then(()=>console.log(output));
