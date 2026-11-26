import palette from './artworkPalette.cjs';

// Native decoding is a fallback for formats the edge decoder cannot read (for
// example WebP). The scheduled server job persists those palettes afterwards.
export async function browserArtworkPalette(url,signal){
 const image=new Image();image.crossOrigin='anonymous';
 await new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
  const fail=()=>{cleanup();reject(Error('Artwork unavailable'));};
  const abort=()=>{image.src='';fail();};
  const timer=setTimeout(fail,8000);
  image.onload=()=>{cleanup();resolve();};image.onerror=fail;
  if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});image.src=url;
 });
 signal?.throwIfAborted();
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,64,64);
 return palette.paletteFromPixels(context.getImageData(0,0,64,64).data,{width:64,height:64});
}
