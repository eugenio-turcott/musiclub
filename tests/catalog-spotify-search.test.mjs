import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesCatalogQuery,normalizeSpotifySearch,searchSpotifyCatalog} from '../src/services/catalogSpotifySearch.mjs';
const album=(name,id='1234567890123456789012')=>({id,name,artists:[{name:'Artista Ejemplo'}],images:[{url:'https://i.scdn.co/example.jpg'}],album_type:'album',total_tracks:12,release_date:'2026-10-21',external_urls:{spotify:`https://open.spotify.com/album/${id}`}});
test('internal catalogue matching ignores case and accents before trying another provider',()=>{
 assert.equal(matchesCatalogQuery({album_name:'Sí',artist_name:'Julieta Venegas'},'si'),true);
 assert.equal(matchesCatalogQuery({album_name:'Sí',artist_name:'Julieta Venegas'},'JULIETA'),true);
 assert.equal(matchesCatalogQuery({album_name:'Sí'},'missing'),false);
});
test('Spotify cards preserve official fields without inventing club ratings or duplicating clean editions',()=>{
 const rows=normalizeSpotifySearch([album('Azul'),album('Azul (Clean)','2234567890123456789012'),album('Azul (Deluxe)','3234567890123456789012'),null]);
 assert.equal(rows.length,2);
 assert.ok(rows.some(row=>row.album_name==='Azul (Deluxe)'));
 for(const row of rows){assert.equal(row.source,'SPOTIFY');assert.equal(row.review_count,0);assert.equal(row.final_rating,null);assert.equal(row.is_in_club,false);assert.equal(row.release_year,2026);assert.deepEqual(row.genres,[]);}
});
test('Spotify fallback uses the same-origin proxy, ten results and an abortable read-only request',async()=>{
 const controller=new AbortController();let called;
 const result=await searchSpotifyCatalog('  Disco  ',{signal:controller.signal,offset:10,fetcher:async(url,options)=>{
   called={url,options};return {ok:true,json:async()=>({albums:{items:[album('Disco')],next:'https://api.spotify.com/v1/search?offset=20'}})};
 }});
 const path=new URL(called.url,'https://musiclub.org').searchParams.get('path'),query=new URL(path,'https://api.spotify.com').searchParams;
 assert.equal(query.get('q'),'Disco');assert.equal(query.get('limit'),'10');assert.equal(query.get('offset'),'10');assert.equal(query.get('type'),'album');assert.equal(called.options.signal,controller.signal);assert.equal(result.nextOffset,20);assert.equal(result.albums[0].album_name,'Disco');
});
test('Spotify failures remain visible errors rather than masquerading as empty results from another platform',async()=>{
 await assert.rejects(searchSpotifyCatalog('Disco',{fetcher:async()=>({ok:false,status:429})}),/muchas búsquedas/);
 await assert.rejects(searchSpotifyCatalog('Disco',{fetcher:async()=>({ok:true,json:async()=>({error:'Unavailable'})})}),/lista de releases válida/);
});
