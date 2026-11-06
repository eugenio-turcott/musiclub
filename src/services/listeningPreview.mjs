import {listeningTrack,matchListeningPreview} from '../utils/listeningPreview.mjs';

// Apple's public search endpoint supports cross-origin JSON requests. This
// fallback uses the visitor's ordinary connection when the shared server is
// rate-limited. It sends public music metadata only, never Musiclub credentials.
export async function browserListeningPreview(entry,{fetcher=fetch}={}) {
  const {album,reviews}=entry, track=listeningTrack(album,reviews);
  if(!track)return null;
  for(const country of ['MX','US']) {
    const url=new URL('https://itunes.apple.com/search');
    url.search=new URLSearchParams({term:`${album.artist_name} ${track.name} ${album.album_name}`,media:'music',entity:'song',limit:'25',country}).toString();
    const response=await fetcher(url,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(7000)});
    // Respect a visitor's own rate limit. No retries, proxy rotation or polling.
    if(!response.ok)throw new Error('Music preview search unavailable');
    const data=await response.json();
    const preview=matchListeningPreview(data.results||[],album,track);
    if(preview)return preview;
  }
  return null;
}
