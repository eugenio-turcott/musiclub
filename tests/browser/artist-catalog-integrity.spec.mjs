import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

test('an artist shows one Spotify edition and imports its real credits and eight tracks',async({page})=>{
 await communityAccount(page);let writes=[],musicbrainzReads=0;
 await page.route('**/api/musicbrainz*',route=>{musicbrainzReads++;return route.abort();});
 const tracks=Array.from({length:8},(_,i)=>({id:'spotify-track-'+i,name:'Recording '+i,duration_ms:180000,track_number:i+1,disc_number:1,artists:[{id:'creator',name:'Artista Principal'}]}));
 await page.route('**/api/spotify?*',route=>route.fulfill({json:{id:'1234567890123456789012',name:'Quantum Baby',album_type:'album',release_date:'2024-08-16',total_tracks:8,genres:['Pop'],artists:[{id:'creator',name:'Artista Principal'}],images:[{url:'/musiclub_logo.png'}],tracks:{items:tracks},external_urls:{spotify:'https://open.spotify.com/album/1234567890123456789012'}}}));
 await page.route('**/rest/v1/albums*',route=>{
  if(route.request().method()==='POST'){const data=route.request().postDataJSON(),row=Array.isArray(data)?data[0]:data;writes.push(row);return route.fulfill({status:201,json:{...row,id:'imported-featured-work'}});}
  return route.fulfill({json:null});
 });
 await page.goto('/artista/tinashe-de-prueba');
 const heading=page.getByRole('heading',{name:'Quantum Baby',exact:true});await expect(heading).toHaveCount(1);
 const card=page.getByRole('button').filter({has:heading});await expect(card).toContainText('8 pistas');await expect(card).not.toContainText('10 pistas');
 await card.getByRole('button',{name:'Reseñar',exact:true}).click();await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].artist_name).toBe('Artista Principal');expect(writes[0].tracks).toHaveLength(8);expect(writes[0].total_tracks).toBe(8);expect(writes[0].release_date).toBe('2024-08-16');expect(musicbrainzReads).toBe(0);
});
