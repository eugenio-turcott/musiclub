const {createHash}=require('node:crypto');
const sharp=require('sharp');
const {GENRES}=require('../../src/utils/genreCatalog.cjs');
const {genreSymbol}=require('../../src/utils/genreSymbols.cjs');
const {variationSignature}=require('../../src/utils/genreVariationRules.cjs');

async function auditGenreVariations(sizes=[32,64]) {
  const compositions=new Map(),pixels=new Map(sizes.map(size=>[size,new Map()])),duplicates=[];
  for(const genre of GENRES) {
    const symbol=genreSymbol(genre.id);
    if(symbol.variationStatus!=='assigned')throw new Error(`Unassigned genre: ${genre.id}`);
    const signature=variationSignature(symbol.figure,symbol.details.map(detail=>detail.icon));
    if(compositions.has(signature))duplicates.push({kind:'composition',genres:[compositions.get(signature),genre.id]});
    compositions.set(signature,genre.id);
    for(const size of sizes) {
      const raw=await sharp(Buffer.from(symbol.markSvg)).resize(size,size).removeAlpha().raw().toBuffer();
      const hash=createHash('sha256').update(raw).digest('hex'),seen=pixels.get(size);
      if(seen.has(hash))duplicates.push({kind:'pixels',size,genres:[seen.get(hash),genre.id]});
      seen.set(hash,genre.id);
    }
  }
  return {genres:GENRES.length,uniqueCompositions:compositions.size,monochromeImages:sizes.map(size=>({size,unique:pixels.get(size).size})),excluded:['color','decorative rim','genre name','file name','metadata','badge order in composition comparison'],duplicates};
}
module.exports={auditGenreVariations};
if(require.main===module)auditGenreVariations().then(report=>{
  const fs=require('node:fs'),path=require('node:path');
  const directory=path.resolve('outputs/musiclub-genre-library-v2');fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'auditoria-variaciones.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));if(report.duplicates.length)process.exitCode=1;
}).catch(error=>{console.error(error);process.exitCode=1;});
