import {test,expect} from '@playwright/test';
import {albums} from './fixtures.mjs';

const roomId='00000000-0000-4000-8000-000000000000';
async function openFixturePool(page,{mailFailure=false}={}) {
  const user={id:'00000000-0000-4000-8000-000000000081',email:'eugenioturcott@gmail.com',user_metadata:{full_name:'Administrador de prueba'},app_metadata:{provider:'google'},aud:'authenticated'};
  let draws=0,mail=0,reads=0;
  const entries=albums.slice(0,3).map((album,i)=>({id:`entry-${i}`,season_id:'spin-fixture',album_id:album.id,status:'ACTIVO',user_id:user.id,created_at:`2026-01-0${i+1}T00:00:00Z`}));
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.addInitScript(user=>{
    const payload=btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600}));
    localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.fixture-only`,refresh_token:'fixture-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
  },user);
  await page.route('**/auth/v1/user',route=>route.fulfill({json:user}));
  await page.route('**/rest/v1/profiles*',route=>route.fulfill({json:{...user,name:'Administrador de prueba'}}));
  await page.route('**/rest/v1/pool_rooms*',route=>route.fulfill({json:[{id:roomId,name:'Sala de prueba',visibility:'public',owner_id:user.id}]}));
  await page.route('**/rest/v1/pool_room_members*',route=>route.fulfill({json:[{room_id:roomId}]}));
  await page.route('**/rest/v1/seasons*',route=>{reads++;return route.fulfill({json:[{id:'spin-fixture',room_id:roomId,name:'Pool de prueba',is_active:true,is_open:false,season_number:1}]});});
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
  await page.getByRole('button',{name:'Ruleta del Pool',exact:true}).click();
  return {counts:()=>({draws,mail,reads})};
}

test('the lever makes one draw, saves once and distinguishes a failed email from a failed winner',async({page},testInfo)=>{
  const fixture=await openFixturePool(page,{mailFailure:true});
  const machine=page.getByRole('region',{name:'Ruleta musical del Pool'});
  await expect(machine).toBeVisible();
  await machine.screenshot({animations:'disabled',path:`outputs/roulette-v1060-${testInfo.project.name}.png`});
  await page.getByRole('button',{name:'Tirar palanca',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'Ganador confirmado',exact:true})).toBeVisible();
  await expect(page.getByRole('alert').filter({hasText:'Ganador guardado.'})).toContainText('Ganador guardado. Correo pendiente:');
  expect(fixture.counts().draws).toBe(1);expect(fixture.counts().mail).toBe(1);
  await expect(page.getByRole('button',{name:'Ganador confirmado',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('an idle Pool performs no periodic reads and repeated focus events reuse its snapshot',async({page})=>{
  const fixture=await openFixturePool(page);
  await page.clock.install();const start=fixture.counts().reads;
  await page.clock.fastForward(45000);
  for(let i=0;i<3;i++)await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  expect(fixture.counts().reads).toBe(start);
  await page.clock.fastForward(45000);
  expect(fixture.counts().reads).toBe(start);
});

test('a server-rendered release does not fetch the same catalogue again for an anonymous visitor',async({page})=>{
  const requests=[];page.on('request',request=>{if(request.url().includes('/api/catalog?slug='))requests.push(request.url());});
  await page.goto('/albumes/artista-de-prueba-azul');
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
  expect(requests).toEqual([]);
});
