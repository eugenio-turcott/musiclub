// Public, read-only audit. No service credential, database update or email is used.
import fs from 'node:fs/promises';
import path from 'node:path';
import identity from '../src/utils/musicBrainzIdentity.cjs';
import catalog from '../src/utils/genreCatalog.cjs';

const output=process.env.GENRE_AUDIT_OUTPUT || 'audit/genre-quality-2026-10-20.json';
const limit=Number(process.env.GENRE_AUDIT_LIMIT)||Infinity;
const response=await fetch('https://www.musiclub.org/api/catalog',{signal:AbortSignal.timeout(30000)});
if(!response.ok) throw new Error('No se pudo leer el catálogo público.');
const {albums}=await response.json();
const report={date:new Date().toISOString(),total:albums.length,checked:0,items:[]};
await fs.mkdir(path.dirname(output),{recursive:true});
const save=()=>fs.writeFile(output,JSON.stringify(report,null,2));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let failures=0;
for(const album of albums.slice(0,limit)) {
  const row={id:album.id,title:album.album_name,artist:album.artist_name,genres:album.genres,mbid:album.mbid};
  if(!album.mbid) row.status='no-musicbrainz-id';
  else {
    row.source=`https://musicbrainz.org/release-group/${album.mbid}`;
    try {
      await pause(1200);
      const result=await fetch(`https://musicbrainz.org/ws/2/release-group/${album.mbid}?inc=genres+artist-credits&fmt=json`,{
        headers:{'User-Agent':'Musiclub/9.20 (https://www.musiclub.org; contact@musiclub.org)'},signal:AbortSignal.timeout(10000),
      });
      if(!result.ok) throw new Error(`HTTP ${result.status}`);
      const data=await result.json();failures=0;
      row.sourceTitle=data.title;
      row.sourceArtist=(data['artist-credit']||[]).map(c=>c.name||c.artist?.name||'').join(' / ');
      row.sourceGenres=catalog.normalizeGenres((data.genres||[]).filter(g=>(g.count??1)>0));
      const matches=identity.releaseGroupMatches(album.artist_name,album.album_name,data);
      const overlap=(album.genres||[]).some(g=>row.sourceGenres.some(s=>catalog.genreKey(g)===catalog.genreKey(s)));
      row.status=!matches?'identity-needs-review':!row.sourceGenres.length?'source-without-genres':!overlap?'genres-need-review':'source-overlap';
    } catch(error) {
      row.status='source-unavailable';row.error=error.message;failures++;
    }
  }
  report.items.push(row);report.checked++;
  if(report.checked%20===0) {await save();console.log(`Revisados ${report.checked}/${Math.min(albums.length,limit)}; sin escrituras.`);}
  if(failures>=5) {report.stopped='source-unavailable';break;}
}
report.summary=Object.fromEntries([...new Set(report.items.map(r=>r.status))].map(status=>[status,report.items.filter(r=>r.status===status).length]));
await save();console.log(JSON.stringify({total:report.total,checked:report.checked,summary:report.summary,stopped:report.stopped||null,output}));
