import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

for(const entrance of ['catalogue','header'])test(`${entrance} imports the exact classical edition and opens its review form when Spotify omits genres`,async({page})=>{
 await communityAccount(page);
 await page.route('**/api/catalog?view=collection',route=>route.fulfill({json:{albums:[]}}));
 const title='Rachmaninov: Piano Concerto No.2',credits=['Sergei Rachmaninoff','Valentina Lisitsa','London Symphony Orchestra','Michael Francis'];
 const spotify={id:'5lVqgXqdoIH3W1wUM2hzPx',name:title,artists:credits.map((name,i)=>({id:'artist-'+i,name})),album_type:'album',genres:[],total_tracks:3,release_date:'2012-04-01',external_ids:{upc:'00028947851097'},images:[{url:'/musiclub_logo.png'}],external_urls:{spotify:'https://open.spotify.com/album/5lVqgXqdoIH3W1wUM2hzPx'},tracks:{items:['Moderato','Adagio sostenuto','Allegro scherzando'].map((name,i)=>({id:'official-track-'+i,name,track_number:i+1,duration_ms:600000}))}};
 let lookups=0,searches=0;const writes=[];
 await page.route('**/api/spotify?*',route=>{
  const resource=new URL(route.request().url()).searchParams.get('path');
  if(resource.startsWith('/v1/albums/'))return route.fulfill({json:spotify});
  if(resource.startsWith('/v1/artists/'))return route.fulfill({json:{genres:[]}});
  return route.fulfill({json:{albums:{items:[spotify],next:null},artists:{items:[]},tracks:{items:[]}}});
 });
 await page.route('https://api.deezer.com/**',route=>{
  const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
  let data={data:[]};
  if(url.pathname==='/album/upc:028947851097'){
   lookups++;data={id:6433904,title,upc:'028947851097',artist:{name:'Valentina Lisitsa'},contributors:[{name:'Valentina Lisitsa',role:'Main'},{name:'London Symphony Orchestra',role:'Main'},{name:'Sergei Rachmaninov',role:'Main'},{name:'Michael Francis',role:'Main'}],genres:{data:[{name:'Clásica'}]}};
  }else searches++;
  return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify(data)});`});
 });
 await page.route('**/rest/v1/albums*',async route=>{
  if(route.request().method()!=='POST')return route.fulfill({json:[]});
  const [payload]=route.request().postDataJSON();writes.push(payload);
  const saved=await page.request.post('http://127.0.0.1:54329/__fixture/import-classical-release',{data:payload});
  return route.fulfill({json:await saved.json()});
 });
 if(entrance==='catalogue'){
  await page.goto('/catalogo?q=Rachmaninov&tab=releases');
  await page.getByRole('button',{name:'Ver Álbum en Musiclub',exact:true}).click();
 }else{
  await page.goto('/');await page.getByRole('button',{name:'Buscar álbum',exact:true}).filter({visible:true}).click();
  await page.getByPlaceholder('Escribe el nombre del álbum o artista...',{exact:true}).fill('Rachmaninov');
  await page.getByText(title,{exact:true}).first().click();
 }
 await expect(page).toHaveURL(/\/albumes\/sergei-rachmaninoff-valentina-lisitsa-london-symphony-orchestra-michael-francis-rachmaninov-piano-concerto-no-2/);
 expect(writes).toHaveLength(1);expect(writes[0].genres).toEqual(['Clásica']);expect(writes[0].artist_name).toBe(credits.join(', '));
 expect(writes[0].barcode).toBe('00028947851097');expect(writes[0].tracks.map(t=>t.id)).toEqual(spotify.tracks.items.map(t=>t.id));expect(lookups).toBe(1);
 if(entrance==='catalogue')expect(searches).toBe(0);
 await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
 await page.getByRole('button',{name:'Reseñar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Escribir Reseña',exact:true})).toBeVisible();
});

for(const entrance of ['catalogue','header'])test(`${entrance} imports the exact localized soundtrack with all 34 tracks`,async({page})=>{
 await communityAccount(page);
 await page.route('**/api/catalog?view=collection',route=>route.fulfill({json:{albums:[]}}));
 const title='Grand Theft Auto VI: The Album';
 const songs=Array.from({length:34},(_,i)=>({id:2000+i,title:`Soundtrack song ${i+1}`,duration:180}));
 const edition={id:1119883012,title,upc:'075679556431',artist:{name:'Grand Theft Auto VI'},contributors:[{name:'Grand Theft Auto VI',role:'Main'}],cover_xl:'/musiclub_logo.png',record_type:'album',release_date:'2026-11-20',nb_tracks:34,genres:{data:[{name:'Películas/Juegos'},{name:'Scores de Películas'}]},tracks:{data:songs.slice(0,25)}};
 const spotify={id:'5lVqgXqdoIH3W1wUM2hzPx',name:title,artists:[{id:'gta-artist',name:edition.artist.name}],album_type:'album',genres:[],total_tracks:34,release_date:edition.release_date,external_ids:{upc:edition.upc},images:[{url:edition.cover_xl}],tracks:{items:songs.map((song,i)=>({id:`official-${song.id}`,name:song.title,track_number:i+1,duration_ms:180000}))}};
 const writes=[];let pages=0;
 await page.route('**/api/spotify?*',route=>{
  const resource=new URL(route.request().url()).searchParams.get('path');
  const data=resource.startsWith('/v1/albums/')?spotify:resource.startsWith('/v1/artists/')?{genres:[]}:{albums:{items:entrance==='catalogue'?[spotify]:[],next:null},artists:{items:[]},tracks:{items:[]}};
  return route.fulfill({json:data});
 });
 await page.route('https://api.deezer.com/**',route=>{
  const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
  let data={data:[]};
  if(url.pathname==='/search/album')data={data:[edition]};
  if(['/album/1119883012','/album/upc:075679556431'].includes(url.pathname))data=edition;
  if(['/album/1119883012/tracks','/album/upc:075679556431/tracks'].includes(url.pathname)){
   pages++;expect(url.searchParams.get('index')).toBe('25');data={data:songs.slice(25),total:34};
  }
  return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify(data)});`});
 });
 await page.route('**/rest/v1/albums*',async route=>{
  if(route.request().method()!=='POST')return route.fulfill({json:[]});
  const [payload]=route.request().postDataJSON();writes.push(payload);
  const saved=await page.request.post('http://127.0.0.1:54329/__fixture/import-soundtrack-release',{data:payload});
  return route.fulfill({json:await saved.json()});
 });
 if(entrance==='catalogue'){
  await page.goto('/catalogo?q=Grand%20Theft&tab=releases');
  await page.getByRole('button',{name:'Ver Álbum en Musiclub',exact:true}).click();
 }else{
  await page.goto('/');await page.getByRole('button',{name:'Buscar álbum',exact:true}).filter({visible:true}).click();
  await page.getByPlaceholder('Escribe el nombre del álbum o artista...',{exact:true}).fill('Grand Theft');
  await page.getByText(title,{exact:true}).first().click();
 }
 await expect(page).toHaveURL(/\/albumes\/grand-theft-auto-vi-grand-theft-auto-vi-the-album/);
 expect(writes).toHaveLength(1);expect(writes[0].genres).toEqual(['Soundtrack']);
 expect(writes[0].total_tracks).toBe(34);expect(writes[0].tracks.map(t=>t.id)).toEqual(songs.map(t=>entrance==='catalogue'?`official-${t.id}`:`dz_track_${t.id}`));expect(pages).toBeGreaterThan(0);
 await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
 await page.getByRole('button',{name:'Reseñar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Escribir Reseña',exact:true})).toBeVisible();
});
