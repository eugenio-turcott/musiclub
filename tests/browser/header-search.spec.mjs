import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {albums} from './fixtures.mjs';

test('a verified alternate artist credit shows the existing release once and opens its canonical page',async({page})=>{
 await communityAccount(page);
 await page.route('**/api/catalog?view=collection',route=>route.fulfill({json:{albums:[{...albums[0],artist_aliases:['Artista de Prueba','Crédito alternativo'],review_count:2}]}}));
 await page.route('**/api/spotify?*',route=>route.fulfill({json:{albums:{items:[{id:'alternate-source',name:'Azul',artists:[{name:'Crédito alternativo'}],album_type:'album',images:[{url:'/musiclub_logo.png'}]}]}}}));
 await page.route('https://api.deezer.com/**',route=>{
  const callback=new URL(route.request().url()).searchParams.get('callback');
  return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify({data:[]})});`});
 });
 await page.goto('/');
 await page.getByRole('button',{name:'Buscar álbum',exact:true}).filter({visible:true}).click();
 const input=page.getByPlaceholder('Escribe el nombre del álbum o artista...', {exact:true});
 const dialog=page.getByRole('dialog',{name:'Buscador Universal de Álbumes'});
 for(const query of ['Azul','Crédito alternativo']){
  await Promise.all([page.waitForResponse(response=>response.url().includes('/api/spotify?')),input.fill(query)]);
  await expect(dialog.getByText('Azul',{exact:true})).toHaveCount(1);
  await expect(dialog.getByText('Musiclub (2 reviews)',{exact:true})).toBeVisible();
 }
 await dialog.getByText('Azul',{exact:true}).click();
 await expect(page).toHaveURL(/\/albumes\/artista-de-prueba-azul$/);
 await expect(page.getByRole('heading',{name:'Azul',exact:true}).first()).toBeVisible();
});

async function setup(page,{genres=['R&B'],holdDetail}={}){
 await communityAccount(page);
 const metrics={details:0,spotifyDetails:0,writes:[]};
 const record={id:123,title:'Before The World Blows',artist:{name:'Erykah Badu'},contributors:[{name:'Erykah Badu',role:'Main'},{name:'The Alchemist',role:'Main'}],record_type:'album',nb_tracks:8,cover_xl:'/musiclub_logo.png',release_date:'2026-11-01',genres:{data:genres.map(name=>({name}))},tracks:{data:[{id:111,title:'Canción real de prueba',duration:180,track_position:1}]}};
 const spotify={id:'1234567890123456789012',name:record.title,artists:[{name:'Erykah Badu'},{name:'The Alchemist'}],album_type:'album',total_tracks:8,images:[{url:'/musiclub_logo.png'}],tracks:{items:[{id:'sp-track',name:'Canción real de prueba',track_number:1,duration_ms:180000}]}};
 await page.route('**/api/spotify?*',async route=>{
  const resource=new URL(route.request().url()).searchParams.get('path');
  if(resource.startsWith('/v1/albums/')){metrics.spotifyDetails++;if(holdDetail)await holdDetail;return route.fulfill({json:spotify});}
  return route.fulfill({json:{albums:{items:resource.includes('Azul')?[]:[spotify]}}});
 });
 await page.route('https://api.deezer.com/**',async route=>{
  const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
  const detail=url.pathname==='/album/123';if(detail)metrics.details++;
  const data=detail?record:{data:url.searchParams.get('q')?.includes('Azul')?[]:[record]};
  return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify(data)});`});
 });
 await page.route('**/rest/v1/albums*',route=>{
  if(route.request().method()==='POST'){
   const payload=route.request().postDataJSON();metrics.writes.push(payload);
   return route.fulfill({json:{...payload[0],id:'remote-search-fixture'}});
  }
  return route.fulfill({json:[]});
 });
 await page.goto('/');
 // The header search is available in the mobile menu too.
 const toggle=page.getByRole('button',{name:'Buscar álbum',exact:true}).filter({visible:true});
 await toggle.click();
 const input=page.getByPlaceholder('Escribe el nombre del álbum o artista...', {exact:true});
 await input.fill('Before The World');
 await page.getByText('Before The World Blows',{exact:true}).first().click();
 return {metrics,input};
}

test('the real collaboration credits recover genres automatically from a first-artist-only search summary',async({page},info)=>{
 const {metrics}=await setup(page);
 await expect(page).toHaveURL(/\/albumes\/erykah-badu-the-alchemist-before-the-world-blows/);
 expect(metrics.writes).toHaveLength(1);expect(metrics.writes[0][0].genres).toEqual(['R&B']);
 expect(metrics.writes[0][0].tracks[0].id).toBe('sp-track');
 expect(metrics.writes[0][0].artist_name).toBe('Erykah Badu, The Alchemist');
 expect(metrics.details).toBe(1);expect(metrics.spotifyDetails).toBe(1);
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
});

test('a genre outage imports the release for review without inventing a genre or blocking the user',async({page})=>{
 const {metrics}=await setup(page,{genres:[]});
 await expect(page).toHaveURL(/\/albumes\/erykah-badu-the-alchemist-before-the-world-blows/);
 expect(metrics.writes).toHaveLength(1);expect(metrics.writes[0][0].genres).toEqual([]);
 expect(metrics.writes[0][0].tracks[0].id).toBe('sp-track');
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
});

test('a recognized source genre opens directly without asking for a classification',async({page})=>{
 const {metrics}=await setup(page,{genres:['Hip Hop']});
 await expect(page).toHaveURL(/\/albumes\/erykah-badu-the-alchemist-before-the-world-blows/);
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
 expect(metrics.writes).toHaveLength(1);expect(metrics.writes[0][0].genres).toEqual(['Hip-Hop']);
});

test('changing query while release details are pending prevents a late notice or insert',async({page})=>{
 let resume;const holdDetail=new Promise(resolve=>{resume=resolve;});
 const {metrics,input}=await setup(page,{holdDetail});
 await expect.poll(()=>metrics.spotifyDetails).toBe(1);
 await input.fill('Azul');resume();
 await page.getByText('Azul',{exact:true}).filter({visible:true}).last().click();
 await expect(page).toHaveURL(/\/albumes\/artista-de-prueba-azul/);
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
 expect(metrics.writes).toHaveLength(0);
});
