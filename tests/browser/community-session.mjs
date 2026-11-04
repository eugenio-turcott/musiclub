import {albums} from './fixtures.mjs';
export async function communityAccount(page){
  const id='00000000-0000-4000-8000-000000000081';
  const profile={id,email:'private-account@example.test',name:'Camila de Prueba',avatar_url:'/musiclub_logo_3.png',bio:'Mi siguiente disco todavía no tiene nombre.',favorite_artist:'Radiohead',favorite_album:'In Rainbows',favorite_genres:['R&B / Soul','Latino / Trap'],role:'user'};
  const member={...profile,id:'00000000-0000-4000-8000-000000000082',name:'Mateo del Club',email:'private-member@example.test',favorite_genres:['Indie','Pop']};
  const user={id,email:profile.email,user_metadata:{full_name:profile.name,avatar_url:profile.avatar_url},app_metadata:{provider:'google'},aud:'authenticated',created_at:'2026-10-01T00:00:00Z'};
  const longAlbum={...albums[0],id:'social-long-title',album_name:'Una historia interminable sobre todas las canciones que todavía nos quedan por descubrir (Edición especial del club)',artist_name:'Un artista con un nombre que también merece espacio',image_url:'/musiclub_logo_3.png'};
  const own=[albums[0],longAlbum].map((album,i)=>({id:`own-${i}`,user_id:id,album_id:album.id,reviewer_name:profile.name,reviewer_email:profile.email,rating_produccion:5,rating_composicion:4,rating_letras:3,rating_originalidad:4,rating_cohesion:5,rating_replay:4,rating_general:9,track_ratings:{'track-0':8,'qa-second':10,'qa-third':9},favorite_track:'qa-second',comment:'Un disco para volver a mirar por la ventana y descubrir nuevas formas de escuchar.',created_at:'2026-11-01T00:00:00Z',albums:album}));
  const foreign={...own[0],id:'foreign',user_id:member.id,reviewer_name:member.name,reviewer_email:member.email};
  const reviews=[...own,foreign];
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.addInitScript(user=>{const payload=btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600}));localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.fixture-only`,refresh_token:'fixture-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));},user);
  await page.route('**/auth/v1/user',route=>route.fulfill({json:user}));
  await page.route('**/rest/v1/profiles*',route=>route.fulfill({json:profile}));
  await page.route('**/rest/v1/public_profiles*',route=>route.fulfill({json:[profile,member,{id:'registered-zero',name:'Nueva escucha',role:'user'}]}));
  const filtered=(url,source)=>{const params=new URL(url).searchParams;return source.filter(row=>[...params].every(([key,value])=>!value.startsWith('eq.')||String(row[key])===value.slice(3)));};
  await page.route('**/rest/v1/public_reviews*',route=>route.fulfill({json:filtered(route.request().url(),reviews)}));
  await page.route('**/rest/v1/reviews*',route=>route.fulfill({json:filtered(route.request().url(),own)}));
  return {profile,member,own,reviews};
}
