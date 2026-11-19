export const ANNUAL_ICON_SURFACES={
  light:['#f2eddf','#ed9dbe','#a3dfcf','#d0c1eb','#eed47f','#e8c8a4','#e7e0ef','#9fd9cb','#f5ecd8','#8ecdbd','#f25293','#c981e8'],
  dark:['#252030','#24202e','#2c243d','#292334','#292033','#3c2539','#203135','#75506a','#5b2c50'],
};
const rgb=color=>{
  if(/^#[0-9a-f]{6}$/i.test(color))return color.slice(1).match(/../g).map(c=>parseInt(c,16));
  const hsl=color.match(/^hsl\(([-\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)$/);
  if(!hsl)throw new Error('Unsupported annual icon colour: '+color);
  const h=((Number(hsl[1])%360)+360)%360/60,s=Number(hsl[2])/100,l=Number(hsl[3])/100,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2;
  return [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h)%6].map(v=>Math.round((v+m)*255));
};
export function contrastRatio(a,b){
  const luminance=hex=>rgb(hex).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function contrastingInk(color,backgrounds,minimum=3.5){
  const original=rgb(color),weakest=ink=>Math.min(...backgrounds.map(bg=>contrastRatio(ink,bg))),target=weakest('#ffffff')>weakest('#000000')?255:0;
  for(let step=0;step<=100;step++){
    const candidate='#'+original.map(v=>Math.round(v+(target-v)*step/100).toString(16).padStart(2,'0')).join('');
    if(backgrounds.every(bg=>contrastRatio(candidate,bg)>=minimum))return candidate;
  }
  return target?'#ffffff':'#000000';
}
