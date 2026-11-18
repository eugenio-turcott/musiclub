import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {ANNUAL_SELECTION,ANNUAL_SOURCES} from '../../src/server/annual2026Selection.mjs';
import covers from '../../src/server/annual2026Covers.json' with {type:'json'};
import {buildPersonalAnnual,buildClubAnnual} from '../../src/utils/annualRecap.mjs';
import fs from 'node:fs/promises';

async function setup(page,{admin=true,empty=false,error=false}={}){
  const {profile,own}=await communityAccount(page,{admin});let reads=0;
  const selection=ANNUAL_SELECTION.map(r=>({...r,...covers[r.id]}));
  const rows=own.map(r=>({...r,created_at:'2026-06-03T12:00:00Z'}));
  const data={viewerId:profile.id,researchDate:'2026-11-18',selection,sources:ANNUAL_SOURCES,club:buildClubAnnual({albums:own.map(r=>r.albums),reviews:rows}),personal:buildPersonalAnnual(empty?[]:rows,own.map(r=>r.albums),{now:Date.parse('2026-11-18T12:00:00Z'),name:profile.name}),errors:[]};
  await page.route('**/api/annual/2026',route=>{reads++;expect(route.request().method()).toBe('GET');return route.fulfill({status:error?503:200,json:error?{error:'No se pudo abrir el resumen de prueba.'}:data});});
  return {profile,data,reads:()=>reads};
}
test('visitors see only the coming-soon presentation and never request the private collection',async({page},info)=>{
  await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());let reads=0;
  await page.route('**/api/annual/2026',r=>{reads++;return r.fulfill({status:403,json:{error:'private'}});});
  const response=await page.goto('/2026?preview=true');expect(await response.text()).not.toContain('Lost Weekend');
  await expect(page.getByRole('heading',{level:1})).toContainText('Musiclub');await expect(page.getByText('PRÓXIMAMENTE',{exact:true})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Capítulos del año'})).toHaveCount(0);expect(reads).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`outputs/annual-coming-soon-${info.project.name}.png`,fullPage:true,animations:'disabled'});
});
test('ordinary members also see only coming soon, regardless of preview parameters',async({page})=>{
  const state=await setup(page,{admin:false});await page.goto('/2026?admin=true&user_id=someone-else');
  await expect(page.getByText('PRÓXIMAMENTE',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Para volver a escuchar.',exact:true})).toHaveCount(0);expect(state.reads()).toBe(0);
});
test('the server rejects unauthenticated and ordinary sessions, including editable admin claims',async({request})=>{
  expect((await request.get('/api/annual/2026')).status()).toBe(401);
  const member=await request.get('/api/annual/2026?user_id=00000000-0000-4000-8000-000000000081',{headers:{Authorization:'Bearer annual-fixture-member'}});expect(member.status()).toBe(403);expect(await member.text()).not.toContain('Lost Weekend');
  const admin=await request.get('/api/annual/2026',{headers:{Authorization:'Bearer annual-fixture-admin'}});expect(admin.status()).toBe(200);expect(admin.headers()['cache-control']).toContain('private');expect((await admin.json()).selection).toHaveLength(16);
});
test('administrators can explore external releases, references, personal chapters and the public preview with one read',async({page},info)=>{
  const state=await setup(page);await page.goto('/2026');
  await expect(page.getByRole('heading',{name:'Para volver a escuchar.',exact:true})).toBeVisible();
  await expect(page.locator('#seleccion article')).toHaveCount(16);
  await page.getByRole('button',{name:'Nominaciones',exact:true}).click();await expect(page.locator('#seleccion article')).toHaveCount(5);
  await page.getByRole('button',{name:'Todos',exact:true}).click();
  const card=page.locator('#release-phoebe');await card.getByRole('button',{name:'Ver referencias de Lost Weekend',exact:true}).click();await expect(card).toContainText('Recording Academy');
  await expect(card.getByRole('link',{name:'Escuchar y reseñar'})).toHaveAttribute('href',/catalogo\?/);
  await card.getByRole('button',{name:'Ver portada original de Lost Weekend',exact:true}).click();await expect(card.getByAltText('Portada de Lost Weekend')).toBeVisible();
  await page.getByRole('button',{name:'Pausar movimiento',exact:true}).click();
  await page.getByRole('button',{name:/02\s*Tus releases/}).click();await expect(page.getByRole('heading',{name:'Los discos que destacaste.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/03\s*Tus géneros/}).click();await expect(page.getByRole('heading',{name:'Sonaron en tus reseñas.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/04\s*Mes a mes/}).click();await expect(page.getByRole('heading',{name:'Así fue tu año.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/05\s*Tus artistas/}).click();await expect(page.getByRole('heading',{name:'Los nombres de tu año.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ver Próximamente',exact:true}).click();await expect(page.getByText('PRÓXIMAMENTE',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Volver a la vista previa',exact:true}).click();await expect(page.locator('#seleccion article')).toHaveCount(16);expect(state.reads()).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`outputs/annual-preview-${info.project.name}.png`,fullPage:true,animations:'disabled'});
});
test('the personal year has empty and failed states without invented figures',async({page})=>{
  await setup(page,{empty:true});await page.goto('/2026');await expect(page.getByRole('heading',{name:'Tu primer disco empieza este resumen.',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Compartir mi 2026',exact:true})).toHaveCount(0);
});
test('own annual cards export every format and keep the correct image proportions',async({page},info)=>{
  await setup(page);await page.goto('/2026');await page.getByRole('button',{name:'Compartir mi 2026',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Compartir mi 2026',exact:true});
  for(const [name,w,h] of [['Historia',1080,1920],['Publicación',1080,1350],['Cuadrada',1080,1080],['Horizontal',1600,900],['Compacta',720,960]]){
    await dialog.getByRole('button',{name:new RegExp('^'+name)}).click();await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
    const image=dialog.getByAltText('Vista previa de mi resumen de 2026');await expect(image).toHaveAttribute('width',String(w));await expect(image).toHaveAttribute('height',String(h));
    if(info.project.name==='desktop'){const url=await image.getAttribute('src');await fs.writeFile(`outputs/annual-share-${name.toLowerCase()}.png`,Buffer.from(url.split(',')[1],'base64'));}
  }
  await dialog.getByRole('button',{name:'En papel',exact:true}).click();await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
  if(info.project.name==='desktop'){const url=await dialog.getByAltText('Vista previa de mi resumen de 2026').getAttribute('src');await fs.writeFile('outputs/annual-share-paper.png',Buffer.from(url.split(',')[1],'base64'));}
  const downloaded=page.waitForEvent('download');await dialog.getByRole('button',{name:'Descargar PNG',exact:true}).click();expect((await downloaded).suggestedFilename()).toContain('musiclub-mi-2026-compact');
  await dialog.screenshot({path:`outputs/annual-share-dialog-${info.project.name}.png`,animations:'disabled'});
  await dialog.getByRole('button',{name:'Cerrar compartir',exact:true}).click();await expect(dialog).toHaveCount(0);
});
