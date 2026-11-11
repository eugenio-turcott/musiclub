import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import catalog from '../../src/utils/genreCatalog.cjs';

async function account(page,admin=true) {
  const user={id:'00000000-0000-4000-8000-000000000081',email:admin?'eugenioturcott@gmail.com':'member@example.test',user_metadata:{full_name:'Prueba de vinilos'},app_metadata:{provider:'google'},aud:'authenticated',created_at:'2026-10-01T00:00:00Z'};
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.addInitScript(user=>{const payload=btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600}));localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.fixture-only`,refresh_token:'fixture-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));},user);
  await page.route('**/auth/v1/user',route=>route.fulfill({json:user}));
  await page.route('**/rest/v1/profiles*',route=>route.fulfill({json:{...user,name:'Prueba de vinilos',role:admin?'admin':'user'}}));
}

test('admin can browse every vinyl, preview and download self-contained PNG/SVG without catalogue reads',async({page},testInfo)=>{
  await account(page);
  const dataReads=[];
  page.on('request',request=>{if(/\/rest\/v1\/(albums|reviews)(\?|$)/.test(request.url()))dataReads.push(request.url());});
  await page.goto('/admin/vinilos');
  await expect(page.getByRole('heading',{name:'Vinilos de géneros',exact:true})).toBeVisible();
  const grid=page.getByRole('list',{name:'Catálogo de vinilos de géneros'});
  await expect(grid.getByRole('listitem')).toHaveCount(48);
  await page.getByRole('combobox',{name:'Página de vinilos'}).selectOption(String(Math.ceil(catalog.GENRES.length/48)));
  await expect(grid.getByRole('listitem')).toHaveCount(catalog.GENRES.length%48||48);
  await expect(grid.getByRole('heading',{name:catalog.GENRES.at(-1).name,exact:true})).toBeVisible();
  await page.getByRole('searchbox',{name:'Buscar género de vinilo'}).fill('musica arabe');
  await expect(grid.getByRole('listitem')).toHaveCount(1);
  const trigger=page.getByRole('button',{name:'Ampliar vinilo de Música Árabe',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img',{name:'Vinilo de Música Árabe'})).toBeVisible();
  for(const format of ['PNG','SVG']) {
    const pending=page.waitForEvent('download');
    await dialog.getByRole('link',{name:`Descargar ${format} de Música Árabe`,exact:true}).click();
    const download=await pending;
    expect(download.suggestedFilename()).toBe(`musiclub-vinilo-arabic-music.${format.toLowerCase()}`);
    const bytes=await fs.readFile(await download.path());
    if(format==='PNG')expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
    else {expect(bytes.toString()).toContain('<svg');expect(bytes.toString()).not.toMatch(/<(?:image|script)\b|href=["']https?:/);}
  }
  await dialog.getByRole('button',{name:'Cerrar vista ampliada'}).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('searchbox',{name:'Buscar género de vinilo'}).fill('ningun-genero-de-prueba-123');
  await expect(page.getByRole('heading',{name:'No encontramos ese género'})).toBeVisible();
  await page.getByRole('button',{name:'Ver todos los vinilos',exact:true}).click();
  await expect(grid.getByRole('listitem')).toHaveCount(48);
  await page.getByRole('heading',{name:'Vinilos de géneros',exact:true}).scrollIntoViewIfNeeded();
  await expect.poll(()=>grid.getByRole('img').first().evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
  await page.screenshot({path:`outputs/v11-1-12-gallery-${testInfo.project.name}.png`});
  expect(dataReads).toEqual([]);
});

test('vinyl administration still requires an administrator',async({page})=>{
  await account(page,false);
  await page.goto('/admin/vinilos');
  await expect(page.getByText('No tienes permisos de administrador')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Vinilos de géneros',exact:true})).toHaveCount(0);
});
