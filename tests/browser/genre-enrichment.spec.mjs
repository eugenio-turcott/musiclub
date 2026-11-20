import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

test('pending genres notify the administrator, retry safely and disappear after verification',async({page},info)=>{
 await communityAccount(page,{admin:true});
 const album={id:'00000000-0000-4000-8000-000000000001',album_name:'Release pendiente',artist_name:'Artista del club',release_type:'ALBUM',image_url:'/musiclub_logo.png',genre_retry_count:2,genre_retry_at:'2026-11-21T10:00:00Z'};
 let pending=true;const writes=[];
 await page.route('**/api/genres/pending*',route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{total:pending?1:0,albums:pending?[album]:[],offset:0}});
  const body=route.request().postDataJSON();writes.push(body);
  if(body.action==='assign')pending=false;
  return route.fulfill({json:body.action==='assign'?{success:true}:{checked:1,resolved:0,pending:1}});
 });
 await page.goto('/admin');
 await page.getByRole('link',{name:/1 release necesita verificación de género/}).click();
 await expect(page).toHaveURL(/\/admin\/generos/);
 const panel=page.getByRole('region',{name:'Géneros pendientes'});
 await expect(panel.getByRole('heading',{name:'Release pendiente',exact:true})).toBeVisible();
 await expect(panel).toContainText('2 comprobaciones automáticas');
 await panel.getByRole('button',{name:'Volver a buscar',exact:true}).click();
 await expect(panel.getByRole('status')).toContainText('El release sigue disponible');
 await panel.getByRole('button',{name:'Verificar género',exact:true}).click();
 await panel.getByRole('textbox',{name:'Buscar género para Release pendiente'}).fill('Rock');
 await panel.getByRole('button',{name:'Rock',exact:true}).click();
 await panel.getByRole('button',{name:'Guardar géneros',exact:true}).click();
 await expect(panel.getByRole('heading',{name:'Todo el catálogo tiene género.',exact:true})).toBeVisible();
 expect(writes).toEqual([{action:'retry',albumId:album.id},{action:'assign',albumId:album.id,genres:['Rock']}]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await panel.screenshot({path:`outputs/genre-enrichment-admin-${info.project.name}.png`});
});

test('genre maintenance API rejects anonymous callers and ordinary members',async({request})=>{
 expect((await request.get('/api/genres/pending')).status()).toBe(401);
 expect((await request.get('/api/genres/pending',{headers:{Authorization:'Bearer annual-fixture-member'}})).status()).toBe(403);
 expect((await request.post('/api/genres/pending',{headers:{Authorization:'Bearer annual-fixture-member'},data:{action:'assign',albumId:'00000000-0000-4000-8000-000000000001',genres:['Rock']}})).status()).toBe(403);
});
