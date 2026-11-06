import {matchListeningPreview} from '../utils/listeningPreview.mjs';
let sharedConnectionLimitedUntil=0;

// Try the alternate storefront even if the first request times out. Provider
// failures remain retryable; they must never become cached "no sample" results.
export async function lookupListeningPreview(album,track,{fetcher=fetch}={}) {
  if(fetcher===fetch&&Date.now()<sharedConnectionLimitedUntil)return {preview:null,retry:true};
  let providerUnavailable=false;
  for(const country of ['MX','US']) {
    const url=new URL('https://itunes.apple.com/search');
    url.search=new URLSearchParams({term:`${album.artist_name} ${track.name} ${album.album_name}`,media:'music',entity:'song',limit:'25',country}).toString();
    try {
      const response=await fetcher(url,{next:{revalidate:21600},headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)});
      if(!response.ok){
        console.warn('Listening preview provider response',{country,status:response.status});
        if(response.status===429){
          if(fetcher===fetch)sharedConnectionLimitedUntil=Date.now()+30000;
          return {preview:null,retry:true};
        }
        providerUnavailable=true;continue;
      }
      const data=await response.json();
      const preview=matchListeningPreview(data.results||[],album,track);
      if(preview)return {preview};
    } catch(error) {console.warn('Listening preview lookup failed',{country,error:String(error?.message||error).slice(0,180)});providerUnavailable=true;}
  }
  return providerUnavailable?{preview:null,retry:true}:{preview:null};
}
