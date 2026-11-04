import {expect} from '@playwright/test';
import {albums} from './fixtures.mjs';
export const roomId='00000000-0000-4000-8000-000000000000';
export async function openFixturePool(page,{mailFailure=false,openMachine=true,initialWinner=false}={}) {
  const user={id:'00000000-0000-4000-8000-000000000081',email:'eugenioturcott@gmail.com',user_metadata:{full_name:'Administrador de prueba'},app_metadata:{provider:'google'},aud:'authenticated'};
  let draws=0,mail=0,reads=0;
  const entries=albums.slice(0,3).map((album,i)=>({id:`entry-${i}`,season_id:'spin-fixture',album_id:album.id,status:initialWinner&&i===0?'GANADOR':'ACTIVO',user_id:user.id,created_at:`2026-01-0${i+1}T00:00:00Z`}));
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.addInitScript(user=>{
    const payload=btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600}));
    localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.fixture-only`,refresh_token:'fixture-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
  },user);
  await page.route('**/auth/v1/user',route=>route.fulfill({json:user}));
  await page.route('**/rest/v1/profiles*',route=>route.fulfill({json:{...user,name:'Administrador de prueba'}}));
  await page.route('**/rest/v1/pool_rooms*',route=>route.fulfill({json:[{id:roomId,name:'Sala de prueba',visibility:'public',owner_id:user.id}]}));
  await page.route('**/rest/v1/pool_room_members*',route=>route.fulfill({json:[{room_id:roomId}]}));
  const season={id:'spin-fixture',room_id:roomId,name:'Pool de prueba',is_active:true,is_open:false,season_number:1,appearance:{vinyl:'genre',genre:'Jazz'}};
  await page.route('**/rest/v1/rpc/musiclub_generate_pool_code',route=>{season.public_code='AB12CD34EF56';return route.fulfill({json:season.public_code});});
  await page.route('**/rest/v1/seasons*',route=>{reads++;return route.fulfill({json:[season]});});
  await page.route('**/rest/v1/public_pool_entries*',route=>{reads++;const onlyWinner=new URL(route.request().url()).searchParams.get('status')==='eq.GANADOR';return route.fulfill({json:onlyWinner?entries.filter(e=>e.status==='GANADOR'):entries});});
  await page.route('**/rest/v1/albums*',route=>route.fulfill({json:albums.slice(0,3)}));
  await page.route('**/rest/v1/public_profiles*',route=>route.fulfill({json:[{id:user.id,name:'Administrador de prueba'}]}));
  await page.route('**/rest/v1/public_reviews*',route=>route.fulfill({json:[]}));
  await page.route('**/rest/v1/rpc/musiclub_pool_action',async route=>{
    const data=route.request().postDataJSON();expect(data.p_action).toBe('winner');draws++;
    entries.find(e=>e.album_id===data.p_album_id).status='GANADOR';
    return route.fulfill({json:true});
  });
  await page.route('**/api/notifications/pool-winner',route=>{mail++;return route.fulfill({status:mailFailure?500:200,json:mailFailure?{success:false,error:'SMTP de prueba no disponible'}:{success:true,result:{provider:'smtp'}}});});
  await page.goto(`/pool?sala=${roomId}`);
  await expect(page.getByRole('heading',{name:'Pool de prueba',exact:true})).toBeVisible();
  if(openMachine)await page.getByRole('button',{name:'Máquina Musical del Pool',exact:true}).click();
  return {counts:()=>({draws,mail,reads})};
}
