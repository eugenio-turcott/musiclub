const {genreKey} = require('./genreCatalog.cjs');
const {genreIdentity} = require('./genreIdentityPlan.cjs');
const library = require('../data/musicIconLibrary.json');
function hash(key) {
  let value=2166136261;
  for(const char of key) value=Math.imul(value ^ char.codePointAt(0),16777619) >>> 0;
  return value;
}
function glyph(icon,x,y,scale,color='#f57fa2') {
  const drawing=library.icons[icon];
  if(!drawing) throw new Error(`Missing music icon: ${icon}`);
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawing.body}</g>`;
}
function genreSymbol(raw) {
  const key=genreKey(raw); if(!key) return null;
  const identity=genreIdentity(key),code=hash(key);
  // Uniform rim dots distinguish styles without random geometric center art.
  const accents=Array.from({length:32},(_,index)=>{
    const angle=(index*11.25-90)*Math.PI/180;
    return `<circle cx="${(50+Math.cos(angle)*44).toFixed(2)}" cy="${(50+Math.sin(angle)*44).toFixed(2)}" r=".65" opacity="${(code >>> index)&1 ? '.7' : '.16'}"/>`;
  }).join('');
  const details=identity.details;
  const base=glyph(identity.figure,18,details.length ? 14 : 18,2.6667);
  const badges=details.map((detail,index)=>{
    const x=index ? 23 : 78,y=78;
    return `<circle cx="${x}" cy="${y}" r="13" fill="#171433" stroke="#f57fa2" stroke-opacity=".4" stroke-width=".8"/>${glyph(detail.icon,x-9,y-9,.75,'#ffdbe6')}`;
  }).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#171433"/><g fill="#f57fa2">${accents}</g>${base}${badges}</svg>`;
  return {key,family:identity.family,figure:identity.figure,label:identity.label,modifier:details[0]?.id || 'primary',details,quality:identity.quality,svg};
}
module.exports={genreSymbol,glyph};
