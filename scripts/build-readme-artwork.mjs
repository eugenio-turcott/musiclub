import fs from 'node:fs/promises';
import sharp from 'sharp';
import artwork from '../src/utils/genreEmailArtwork.cjs';
import icons from '../src/utils/interfaceArtwork.cjs';
const dir='public/readme';await fs.mkdir(dir,{recursive:true});
const fontfile='src/fonts/Gabarito-Readme.ttf';
const png=async(input,width,height)=>sharp(input).resize(width,height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
const vinyl=async(id,size)=>png(Buffer.from(artwork.genreEmailSvg(id)),size,size);
const logo=await png('public/musiclub_logo_corchea.png',116,128);
const text=async(value,size,color='#f5f2ff',width)=>sharp({text:{text:`<span foreground="${color}">${value.replaceAll('&','&amp;')}</span>`,font:`Gabarito Bold ${size}`,fontfile,rgba:true,...(width?{width}:{}),dpi:72}}).png().toBuffer();
const centered=async(input,centerX,top)=>({input,left:Math.round(centerX-(await sharp(input).metadata()).width/2),top});
const svg=body=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="720" viewBox="0 0 1600 720"><defs><linearGradient id="bg"><stop stop-color="#101321"/><stop offset="1" stop-color="#25172f"/></linearGradient><linearGradient id="plate" x2=".3" y2="1"><stop stop-color="#55505b"/><stop offset=".18" stop-color="#322e38"/><stop offset="1" stop-color="#201b25"/></linearGradient></defs>${body}</svg>`);
let base=svg('<rect width="1600" height="720" rx="44" fill="url(#bg)"/><circle cx="1370" cy="0" r="480" fill="#f472b6" opacity=".035"/><rect x="706" y="123" width="796" height="502" rx="34" fill="#17131d"/><rect x="692" y="104" width="796" height="502" rx="34" fill="url(#plate)" stroke="#847686" stroke-width="3"/><rect x="1236" y="204" width="202" height="207" rx="17" fill="#181421" stroke="#726078"/><circle cx="1192" cy="180" r="23" fill="#817585"/><circle cx="1192" cy="180" r="14" fill="#2b2431"/><path d="M1192 180 1154 422" stroke="#c6bbd0" stroke-width="11" stroke-linecap="round"/><path d="m1154 422-13 38" stroke="#f77db6" stroke-width="20" stroke-linecap="round"/><circle cx="740" cy="559" r="19" fill="#544653" stroke="#ac94ad"/><path d="M736 550v18m9-18v18" stroke="#fce69e" stroke-width="3" stroke-linecap="round"/>');
await sharp(base).composite([{input:logo,left:72,top:80},{input:await text('Musiclub.',108),left:66,top:253},{input:await text('Tu música. Tu criterio.',35,'#f68abf'),left:73,top:403},{input:await text('Descubre · Reseña · Comparte',22,'#bbb6d0'),left:74,top:477},{input:await vinyl('pop',447),left:726,top:143},{input:await vinyl('r&b',190),left:1242,top:208},{input:await text('MUSICLUB',16,'#f68abf'),left:734,top:126},await centered(await text('LA PRÓXIMA ESCUCHA',13,'#d7cde2'),1337,443),await centered(await text('empieza aquí.',21),1337,468)]).png().toFile(`${dir}/musiclub.png`);
const genres=[['pop','Pop'],['rock','Rock'],['r&b','R&B'],['hip-hop','Hip-Hop'],['indie','Indie'],['electronic','Electrónica'],['jazz','Jazz'],['latino','Latino']];
const tiles=[];
for(let i=0;i<genres.length;i++){const [id,name]=genres[i],centerX=200+(i%4)*400,y=50+Math.floor(i/4)*320;tiles.push(await centered(await vinyl(id,245),centerX,y),await centered(await text(name,24,'#dfd8ef'),centerX,y+250));}
await sharp(svg('<rect width="1600" height="720" rx="40" fill="#10101b"/>')).composite(tiles).png().toFile(`${dir}/genres.png`);
const icon=(name,color)=>Buffer.from(`<svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons.ICON_BODIES[name]||icons.ICON_BODIES.music}</svg>`);
await sharp(svg('<rect width="1600" height="720" rx="40" fill="#12101e"/><rect x="24" y="24" width="766" height="672" rx="30" fill="#282135" stroke="#b69440"/><rect x="810" y="24" width="766" height="672" rx="30" fill="#d9eaa8"/>')).composite([
 {input:await vinyl('jazz',440),left:187,top:80},{input:await png(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><circle cx="110" cy="110" r="110" fill="#171433"/></svg>'),220,220),left:297,top:190},{input:await png(icon('gramophone','#f8d67c'),190,190),left:312,top:205},await centered(await text('Grammy 2027',48,'#f8d67c'),407,543),
 {input:logo,left:860,top:66},await centered(await text('2026.',150,'#241c30'),1193,210),await centered(await text('El año del club.',38,'#49344e'),1193,429),{input:await vinyl('pop',195),left:1284,top:482},{input:await png(icon('review','#b9407c'),76,76),left:882,top:542},{input:await png(icon('headphones','#087b84'),76,76),left:1022,top:542},{input:await png(icon('share','#574598'),76,76),left:1162,top:542}
]).png().toFile(`${dir}/editions.png`);
console.log('Built README artwork from Musiclub’s existing logos, vinyls and icons.');
