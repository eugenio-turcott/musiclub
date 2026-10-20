import { test, expect } from '@playwright/test';

test.beforeEach(async ({page})=>{
  // External links/data must not send tests to production, telemetry or mail providers.
  await page.route('**/*',route=>{
    const host=new URL(route.request().url()).hostname;
    return ['127.0.0.1','localhost'].includes(host)?route.continue():route.abort();
  });
});

test('Portadas stays on the selected release through scoring, tags, museum and navigation',async({page})=>{
  await page.goto('/portadas');
  const title=page.locator('h2');
  await expect(title).toHaveText(/Azul|Rojo|Verde/);
  const original=await title.innerText();
  for(const score of ['7','9','6','8']) {
    await page.getByRole('button',{name:score,exact:true}).click();
    await expect(title).toHaveText(original);
    await page.waitForTimeout(300);
    await expect(title).toHaveText(original);
  }
  await page.getByRole('button',{name:'📷 Fotografía',exact:true}).click();
  await expect(title).toHaveText(original);
  await page.getByRole('button',{name:'🔍 Modo Museo',exact:true}).click();
  await expect(page.getByRole('button',{name:'Cerrar Modo Museo'})).toBeVisible();
  await expect(title).toHaveText(original);
  await page.getByRole('button',{name:'Cerrar Modo Museo'}).click();
  await page.getByRole('button',{name:'Siguiente →',exact:true}).click();
  await expect(title).not.toHaveText(original);
  await page.getByRole('button',{name:'← Anterior',exact:true}).click();
  await expect(title).toHaveText(original);
  await expect(page.getByRole('link',{name:'Ver en Musiclub →'})).toHaveAttribute('href',/\/albumes\/artista-de-prueba-/);
});

test('direct release links select the requested cover and search remains stable',async({page})=>{
  await page.goto('/portadas?id=00000000-0000-4000-8000-000000000002');
  await expect(page.locator('h2')).toHaveText('Rojo');
  await page.locator('input[type="text"]').fill('Rojo');
  await page.getByRole('button',{name:'9',exact:true}).click();
  await expect(page.locator('h2')).toHaveText('Rojo');
  await page.locator('input[type="text"]').fill('no existe');
  await expect(page.getByRole('heading',{name:'¡No hay portadas en este filtro!'})).toBeVisible();
});

test('catalogue search returns club releases with genre icons and an accessible release link',async({page})=>{
  await page.goto('/catalogo?q=Azul&tab=releases');
  await expect(page.getByRole('textbox',{name:'Buscar álbum, artista o curador en el catálogo'})).toHaveValue('Azul');
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
  await expect(page.locator('[data-release-genres]').filter({has:page.locator('[title="Pop"]')}).first()).toBeVisible();
  await expect(page.getByRole('link',{name:'Azul',exact:true}).first()).toHaveAttribute('href','/albumes/artista-de-prueba-azul');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('anonymous ratings ask for a session without publishing a community vote',async({page})=>{
  const writes=[];
  page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/rest/v1/cover_ratings'))writes.push(request.url());});
  await page.goto('/portadas');
  await expect(page.locator('h2')).toHaveText(/Azul|Rojo|Verde/);
  await page.getByRole('button',{name:'✨ Guardar Calificación de Portada'}).click();
  await expect(page.getByRole('button',{name:/Google/})).toBeVisible();
  expect(writes).toHaveLength(0);
});

test('Gashapon genre selection updates the capsules and genre-page link together',async({page})=>{
  await page.goto('/gashapon');
  await page.getByRole('button',{name:'Filtrar Gashapon por Rock',exact:true}).click();
  await expect(page.getByRole('button',{name:'Filtrar Gashapon por Rock',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('link',{name:'Ver la página de Rock →',exact:true})).toHaveAttribute('href','/generos/rock');
  await expect(page.locator('[data-capsule-genre="rock"]').first()).toBeVisible();
  await expect(page.locator('[data-capsule-genre]:not([data-capsule-genre="rock"])')).toHaveCount(0);
});

test('artist pages preserve club discography and review badges',async({page})=>{
  await page.goto('/artista/artista-de-prueba');
  await expect(page.getByRole('heading',{name:'Artista de Prueba',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Discografía Completa',exact:false})).toBeVisible();
  await expect(page.getByText('EN MUSICLUB',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
});

test('a closed Pool keeps proposals disabled without creating entries',async({page})=>{
  await page.goto('/pool');
  await expect(page.getByRole('heading',{name:'Pool Musical Comunitario',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Proponer al Pool \(Cerrado\)/})).toBeDisabled();
});

test('unavailable cover votes produce a visible error instead of a fake saved total',async({page})=>{
  await page.route('**/rest/v1/public_cover_ratings*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Fixture unavailable'})}));
  await page.goto('/portadas');
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar las calificaciones de portadas');
});
