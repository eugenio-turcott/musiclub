import {matchListeningPreview} from '../utils/listeningPreview.mjs';

// Try the alternate storefront even if the first request times out. Provider
// failures remain retryable; they must never become cached "no sample" results.
export async function lookupListeningPreview(album,track,{fetcher=fetch}={}) {
  let providerUnavailable=false;
  for(const country of ['MX','US']) {
    const url=new URL('https://itunes.apple.com/search');
    url.search=new URLSearchParams({term:`${album.artist_name} ${track.name} ${album.album_name}`,media:'music',entity:'song',limit:'25',country}).toString();
    try {
      const response=await fetcher(url,{next:{revalidate:21600},headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)});
      if(!response.ok){providerUnavailable=true;continue;}
      const data=await response.json();
      const preview=matchListeningPreview(data.results||[],album,track);
      if(preview)return {preview};
    } catch {providerUnavailable=true;}
  }
  return providerUnavailable?{preview:null,retry:true}:{preview:null};
}
