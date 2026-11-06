import {NextResponse} from 'next/server';
import {getPublicCatalog} from '../../../server/catalog';
import {listeningTrack, matchListeningPreview} from '../../../utils/listeningPreview.mjs';

// Only metadata is cached. Audio streams directly from the provider, after a
// visitor asks to listen; no audio is proxied, downloaded or stored by Musiclub.
export async function GET(request) {
  const id = new URL(request.url).searchParams.get('album');
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id || '')) return NextResponse.json({preview:null}, {status:400});
  try {
    const {albums, reviews} = await getPublicCatalog();
    const album = albums.find(a => a.id === id);
    if (!album?.review_count) return NextResponse.json({preview:null}, {status:404});
    const track = listeningTrack(album, reviews);
    if (!track) return NextResponse.json({preview:null});
    let providerUnavailable=false;
    for (const country of ['MX', 'US']) {
      const url = new URL('https://itunes.apple.com/search');
      url.search = new URLSearchParams({term:`${album.artist_name} ${track.name} ${album.album_name}`,media:'music',entity:'song',limit:'25',country}).toString();
      const response = await fetch(url, {next:{revalidate:21600}, signal:AbortSignal.timeout(5000)});
      if (!response.ok) {providerUnavailable=true;continue;}
      const data = await response.json();
      const preview = matchListeningPreview(data.results || [], album, track);
      if (preview) return NextResponse.json({preview}, {headers:{'Cache-Control':'public, s-maxage=21600, max-age=300'}});
    }
    if(providerUnavailable)return NextResponse.json({preview:null,retry:true},{status:503,headers:{'Cache-Control':'no-store'}});
    return NextResponse.json({preview:null}, {headers:{'Cache-Control':'public, s-maxage=1800, max-age=300'}});
  } catch { return NextResponse.json({preview:null, retry:true}, {status:503,headers:{'Cache-Control':'no-store'}}); }
}
