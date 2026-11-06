import {NextResponse} from 'next/server';
import {getPublicCatalog} from '../../../server/catalog';
import {listeningTrack} from '../../../utils/listeningPreview.mjs';
import {lookupListeningPreview} from '../../../server/listeningPreview.mjs';

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
    const result=await lookupListeningPreview(album,track);
    if(result.preview)return NextResponse.json(result,{headers:{'Cache-Control':'public, s-maxage=21600, max-age=300'}});
    if(result.retry)return NextResponse.json(result,{status:503,headers:{'Cache-Control':'no-store'}});
    return NextResponse.json({preview:null}, {headers:{'Cache-Control':'public, s-maxage=1800, max-age=300'}});
  } catch { return NextResponse.json({preview:null, retry:true}, {status:503,headers:{'Cache-Control':'no-store'}}); }
}
