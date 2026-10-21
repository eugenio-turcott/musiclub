const fs=require('node:fs');
const path=require('node:path');
const {GENRES}=require('../src/utils/genreCatalog.cjs');
const {genreSemanticIdentity}=require('../src/utils/genreIdentityPlan.cjs');
const {variationPalette,variationSignature}=require('../src/utils/genreVariationRules.cjs');
const library=require('../src/data/musicIconLibrary.json');
const file=path.resolve('src/data/genreVariationAssignments.json');
const previous=JSON.parse(fs.readFileSync(file,'utf8'));
const records=GENRES.map(genre=>genreSemanticIdentity(genre.id));
const used=new Map(),assigned={},loads=new Map();
const roots=new Set('pop|rock|hip hop|r&b|soul|electronic|jazz|metal|punk|folk|classical|latin|regional mexicano|reggaeton|indie|alternative|country|ambient|reggae|disco|dance|funk|blues|k-pop|j-pop|experimental|arabic music|world|gamelan|qawwali|bhangra|tango|samba'.split('|'));
for(const key of 'black metal|death metal|doom metal|power metal|progressive metal|symphonic metal|folk metal|thrash metal|speed metal|heavy metal|industrial metal|psychedelic rock|progressive rock|acoustic rock|indie rock|alternative rock|art rock|acid house|acid techno|techno|house|deep house|dream pop|shoegaze|jazz fusion'.split('|'))roots.add(key);
const compare=(a,b)=>a<b?-1:a>b?1:0;
function valid(record,identity) {
  return record && record.figure===identity.figure && Array.isArray(record.details) && record.details.length<=3 &&
    new Set(record.details).size===record.details.length && record.details.every(icon=>library.icons[icon] && icon!==record.figure) &&
    identity.details.every(detail=>record.details.includes(detail.icon));
}
function accept(identity,details) {
  const signature=variationSignature(identity.figure,details);
  if(used.has(signature)) return false;
  assigned[identity.key]={figure:identity.figure,details};used.set(signature,identity.key);
  for(const icon of details){const key=identity.figure+'|'+icon;loads.set(key,(loads.get(key)||0)+1);}
  return true;
}
// Published assignments always keep their identity when the registry grows.
for(const identity of records){const old=previous.genres[identity.key];if(valid(old,identity))accept(identity,old.details);}
const pending=records.filter(identity=>!assigned[identity.key]).sort((a,b)=>Number(roots.has(b.key))-Number(roots.has(a.key)) || b.details.length-a.details.length || compare(a.key,b.key));
// Reserve the meaning-bearing combinations before assigning extra signatures.
for(const identity of pending) accept(identity,identity.details.map(detail=>detail.icon));
for(const identity of pending.filter(identity=>!assigned[identity.key])) {
  const base=identity.details.map(detail=>detail.icon),{pool,preferred}=variationPalette(identity);
  const available=pool.filter(icon=>!base.includes(icon));
  for(const icon of available) if(!library.icons[icon])throw new Error(`Unknown variation figure: ${icon}`);
  let best=null;
  for(let count=1;count<=3-base.length && !best;count++) {
    function visit(start,extras) {
      if(extras.length!==count){for(let i=start;i<available.length;i++)visit(i+1,[...extras,available[i]]);return;}
      const details=[...base,...extras],signature=variationSignature(identity.figure,details);
      if(used.has(signature))return;
      const score=[-extras.filter(icon=>preferred.has(icon)).length,
        extras.reduce((sum,icon)=>sum+(loads.get(identity.figure+'|'+icon)||0),0),signature];
      if(!best || score[0]<best.score[0] || score[0]===best.score[0] && (score[1]<best.score[1] || score[1]===best.score[1] && compare(score[2],best.score[2])<0))best={details,score};
    }
    visit(0,[]);
  }
  if(!best || !accept(identity,best.details)) throw new Error(`No exclusive composition available for ${identity.key}`);
}
if(Object.keys(assigned).length!==GENRES.length)throw new Error('Incomplete variation registry');
const ordered=Object.fromEntries(Object.entries(assigned).sort(([a],[b])=>compare(a,b)));
if(process.argv.includes('--check')) {
  for(const identity of records){const old=previous.genres[identity.key];if(!valid(old,identity))throw new Error(`Missing or stale variation: ${identity.key}`);}
  const signatures=records.map(identity=>variationSignature(previous.genres[identity.key].figure,previous.genres[identity.key].details));
  if(new Set(signatures).size!==records.length)throw new Error('Repeated variation compositions');
} else fs.writeFileSync(file,JSON.stringify({version:1,genres:ordered},null,2)+'\n');
console.log(JSON.stringify({genres:records.length,uniqueCompositions:used.size,repeatedCompositions:records.length-used.size,detailCounts:records.reduce((counts,identity)=>{const n=assigned[identity.key].details.length;counts[n]=(counts[n]||0)+1;return counts;},{})}));
