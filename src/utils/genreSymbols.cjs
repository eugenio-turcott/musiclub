const {genreKey} = require('./genreCatalog.cjs');
const {genreIdentity} = require('./genreIdentityPlan.cjs');
const library = require('../data/musicIconLibrary.json');
function glyph(icon,x,y,scale,color='#f57fa2') {
  const drawing=library.icons[icon];
  if(!drawing) throw new Error(`Missing music icon: ${icon}`);
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawing.body}</g>`;
}
function composition(identity,monochrome=false) {
  const {details}=identity,ink=monochrome?'#000000':'#f57fa2';
  const base=glyph(identity.figure,18,details.length===3?10:details.length?14:18,2.6667,ink);
  const positions=details.length===3?[[80,75],[20,75],[50,84]]:[[78,78],[23,78]];
  const badges=details.map((detail,index)=>{
    const [x,y]=positions[index],radius=details.length===3?11:13;
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${monochrome?'#ffffff':'#171433'}" stroke="${ink}" stroke-opacity="${monochrome?'1':'.4'}" stroke-width=".8"/>${glyph(detail.icon,x-9,y-9,.75,monochrome?'#000000':'#ffdbe6')}`;
  }).join('');
  return base+badges;
}
function genreSymbol(raw) {
  const key=genreKey(raw); if(!key) return null;
  const identity=genreIdentity(key);
  // The decorative rim is identical for every genre. Uniqueness must come
  // exclusively from the actual musical figure and its named graphic details.
  const accents=Array.from({length:32},(_,index)=>{
    const angle=(index*11.25-90)*Math.PI/180;
    return `<circle cx="${(50+Math.cos(angle)*44).toFixed(2)}" cy="${(50+Math.sin(angle)*44).toFixed(2)}" r=".65" opacity=".25"/>`;
  }).join('');
  const details=identity.details;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#171433"/><g fill="#f57fa2">${accents}</g>${composition(identity)}</svg>`;
  const markSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ffffff"/>${composition(identity,true)}</svg>`;
  return {key,family:identity.family,figure:identity.figure,label:identity.label,modifier:details[0]?.id || 'primary',details,quality:identity.quality,variationStatus:identity.variationStatus,svg,markSvg};
}
module.exports={genreSymbol,glyph};
