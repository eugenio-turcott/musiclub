import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const artwork=await readFile(new URL('../../public/musiclub_logo_3.png',import.meta.url));
import {communityAccount} from './community-session.mjs';
import {GRAMMY_CATEGORIES} from '../../src/data/grammys2027.mjs';
import {normalizeGrammyNominee} from '../../src/utils/grammyBallot.mjs';

async function setup(page,{admin=true,failedSave=false}={}){
 await communityAccount(page,{admin,expiresAt:Date.parse('2099-01-01')/1000});
 await page.route('https://images.example.test/**',route=>route.fulfill({contentType:'image/png',body:artwork}));
 const nominee={id:'20000000-0000-4000-8000-000000000001',event_id:'grammys-2027',category_id:'album-of-the-year',title:'The club release',artist:'An artist',image_url:'https://images.example.test/original.jpg',album_id:null,spotify_url:'https://open.spotify.com/search/club',apple_music_url:null,youtube_url:null,deezer_url:null};
 const release={id:'30000000-0000-4000-8000-000000000001',album_name:'The catalog release',artist_name:'An artist',image_url:'https://images.example.test/album.jpg',spotify_link:'https://open.spotify.com/album/catalog',apple_music_link:'https://music.apple.com/album/catalog',youtube_link:'https://www.youtube.com/watch?v=catalog',other_link:'https://www.deezer.com/album/catalog'};
 const state={event:{id:'grammys-2027',status:'open',published_at:'2026-11-16T14:00:00Z',source_url:'https://www.grammy.com/awards/',nominations_at:'2026-11-16T12:45:00Z',closes_at:'2027-02-07T20:00:00Z'},nominees:[nominee],categories:GRAMMY_CATEGORIES.map(c=>({id:c.id,name:c.name,field_id:c.field}))};
 const writes=[],catalogReads=[];page.on('request',r=>{if(/\/rest\/v1\/(albums|reviews)(\?|$)/.test(r.url()))catalogReads.push(r.url());});
 await page.route('**/api/grammys/admin*',route=>{
  const request=route.request();
  if(request.method()==='GET')return route.fulfill({json:new URL(request.url()).searchParams.has('releaseQuery')?{releases:[release]}:state});
  const body=request.postDataJSON();writes.push(body);
  if(failedSave)return route.fulfill({status:400,json:{error:'No se pudo guardar el cambio de prueba'}});
  if(body.action==='save-nominee'){const row=normalizeGrammyNominee(body.nominee),id=body.nominee.id||'20000000-0000-4000-8000-000000000099';const index=state.nominees.findIndex(n=>n.id===id);const next={...row,id};if(index<0)state.nominees.push(next);else state.nominees[index]=next;}
  if(body.action==='save-category')state.categories.find(c=>c.id===body.category.id).name=body.category.name;
  return route.fulfill({json:{success:true}});
 });
 return {writes,catalogReads,state,nominee,release};
}
test('admin edits the actual nominee by UUID, previews artwork, associates a release and exports the saved data',async({page},info)=>{
 const {writes,catalogReads,nominee,release}=await setup(page);
 await page.goto('/admin/grammys');await expect(page.getByRole('heading',{name:'Grammys 2027',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Grammys',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('searchbox',{name:'Buscar nominado',exact:true}).fill('club');await page.getByRole('button',{name:'Editar The club release',exact:true}).click();
 await page.getByRole('textbox',{name:'Título / nombre',exact:true}).fill('Corrected release');await page.getByRole('textbox',{name:'Artista / créditos',exact:true}).fill('Corrected artist');await page.getByRole('textbox',{name:'Imagen (URL HTTPS)',exact:true}).fill('https://images.example.test/correct.jpg');
 await expect(page.getByRole('img',{name:'Vista previa del nominado'})).toHaveAttribute('src','https://images.example.test/correct.jpg');
 await page.getByRole('textbox',{name:'YouTube (URL)',exact:true}).fill('https://www.youtube.com/watch?v=correct');await page.getByRole('searchbox',{name:'Buscar release por título',exact:true}).fill('catalog');await page.getByRole('button',{name:'Buscar en el catálogo',exact:true}).click();await page.getByRole('button',{name:'Asociar release',exact:true}).click();await expect(page.getByRole('textbox',{name:'ID del release',exact:true})).toHaveValue(release.id);
 await page.getByRole('button',{name:'Guardar nominado',exact:true}).click();await expect(page.getByRole('status')).toContainText('Nominado guardado');expect(writes[0].nominee.id).toBe(nominee.id);expect(writes[0].nominee.albumId).toBe(release.id);expect(writes[0].nominee.youtubeUrl).toBe('https://www.youtube.com/watch?v=correct');
 await page.getByRole('searchbox',{name:'Buscar nominado',exact:true}).fill('');await expect(page.getByRole('list',{name:'Nominados Grammy'})).toContainText('Corrected release');await expect(page.getByRole('list',{name:'Nominados Grammy'})).toContainText('Corrected artist');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar JSON',exact:true}).click();expect((await download).suggestedFilename()).toBe('musiclub-grammys-2027.json');
 expect(catalogReads).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`outputs/grammy-admin-${info.project.name}.png`,animations:'disabled'});
});
test('failed saves keep the form, and leaving a dirty editor requires a deliberate discard',async({page})=>{
 await setup(page,{failedSave:true});await page.goto('/admin/grammys');await page.getByRole('button',{name:'Editar The club release',exact:true}).click();await page.getByRole('textbox',{name:'Título / nombre',exact:true}).fill('Unsaved correction');await page.getByRole('button',{name:'Guardar nominado',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'No se pudo guardar el cambio de prueba'})).toBeVisible();await expect(page.getByRole('textbox',{name:'Título / nombre',exact:true})).toHaveValue('Unsaved correction');
 page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Volver a la lista',exact:true}).click();await expect(page.getByRole('textbox',{name:'Título / nombre',exact:true})).toHaveValue('Unsaved correction');
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Volver a la lista',exact:true}).click();await expect(page.getByRole('textbox',{name:'Título / nombre',exact:true})).toHaveCount(0);
});
test('category names can be edited from the administration panel',async({page})=>{
 const {writes}=await setup(page);await page.goto('/admin/grammys');await page.getByText('Nombres de las categorías',{exact:true}).click();await page.getByRole('combobox',{name:'Categoría a modificar',exact:true}).selectOption('album-of-the-year');await page.getByRole('textbox',{name:'Nombre visible de la categoría',exact:true}).fill('Álbum del año corregido');await page.getByRole('button',{name:'Guardar categoría',exact:true}).click();await expect(page.getByRole('status')).toContainText('Nombre de la categoría guardado');expect(writes.at(-1)).toEqual({action:'save-category',category:{id:'album-of-the-year',name:'Álbum del año corregido'}});
});
test('ordinary members cannot open the Grammy editor',async({page})=>{
 const {writes}=await setup(page,{admin:false});await page.goto('/admin/grammys');await expect(page.getByText('No tienes permisos de administrador')).toBeVisible();await expect(page.getByRole('heading',{name:'Grammys 2027',exact:true})).toHaveCount(0);expect(writes).toEqual([]);
});
