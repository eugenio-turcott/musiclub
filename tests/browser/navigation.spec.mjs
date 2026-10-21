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
  await expect(page.getByRole('heading',{name:'Discografía',exact:false})).toBeVisible();
  await expect(page.getByText('Edición exclusiva oficial',{exact:true})).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Catálogo guardado en Musiclub'})).toBeVisible();
  await expect(page.getByText('EN MUSICLUB',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
});

test('a closed Pool keeps proposals disabled without creating entries',async({page})=>{
  await page.goto('/pool');
  const hero = page.getByRole('region',{name:'Pool activo',exact:true});
  await expect(hero.getByRole('heading',{level:1})).toBeVisible();
  await expect(hero.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(hero.getByRole('button',{name:'🔒 Propuestas cerradas',exact:true})).toBeDisabled();
});

test('unavailable cover votes produce a visible error instead of a fake saved total',async({page})=>{
  await page.route('**/rest/v1/public_cover_ratings*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Fixture unavailable'})}));
  await page.goto('/portadas');
  await expect(page.getByRole('alert').filter({hasText:'No pudimos cargar las calificaciones de portadas'})).toBeVisible();
});


test('global search opens an existing release through its artist-qualified URL',async({page})=>{
  await page.goto('/portadas');
  await page.getByRole('button',{name:'Buscar álbum',exact:true}).click();
  await page.getByPlaceholder(/Escribe el.*álbum o artista/).fill('Azul');
  // Wait for the actual search result, not Portadas' underlying album title.
  await page.locator('p.music-title').filter({hasText:/^Azul$/}).click();
  await expect(page).toHaveURL(/\/albumes\/artista-de-prueba-azul$/);
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
});


test('opening a remote release without a session requests login before any album insert',async({page})=>{
  let inserts=0;
  page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/rest/v1/albums'))inserts++;});
  await page.route('https://api.deezer.com/**',route=>{
    const url=new URL(route.request().url());
    const callback=url.searchParams.get('callback');
    const data={data:[{id:987654,title:'Azul (Deluxe)',artist:{name:'Artista de Prueba'},nb_tracks:12,record_type:'album'}]};
    return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify(data)})`});
  });
  await page.goto('/portadas');
  await page.getByRole('button',{name:'Buscar álbum',exact:true}).click();
  await page.getByPlaceholder(/Escribe el.*álbum o artista/).fill('Azul');
  await page.getByText('Azul (Deluxe)',{exact:true}).click();
  await expect(page.getByRole('button',{name:/Google/})).toBeVisible();
  expect(inserts).toBe(0);
});


test('a release added after the public catalogue cache was warmed opens immediately',async({page})=>{
  await page.goto('/catalogo');
  const response=await page.request.post('http://127.0.0.1:54329/__fixture/add-release');
  expect(response.ok()).toBe(true);
  await page.goto('/albumes/artista-de-prueba-violeta-deluxe');
  await expect(page.getByRole('heading',{name:'Violeta (Deluxe)',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Pista Fuera de Órbita'})).toHaveCount(0);
});


test('artists with only an upcoming release open immediately from local metadata',async({page})=>{
  await page.goto('/artista/artista-proximo');
  await expect(page.getByRole('heading',{name:'Artista Próximo',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Estreno oficial',exact:true})).toBeVisible();
});


test('compact mobile pages keep navigation, filters and primary content within the viewport',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='mobile','Mobile layout audit');
 await page.setViewportSize({width:360,height:800});
 for(const [path,name] of [['/catalogo','catalogue'],['/artista/artista-de-prueba','artist'],['/gashapon','gashapon'],['/pool','pool']]) {
  await page.goto(path);
  await expect(page.locator('h1').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Abrir menú de navegación',exact:true}).click();
  await expect(page.getByRole('link',{name:/Catálogo/}).filter({visible:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'Cerrar menú de navegación',exact:true}).click();
  await page.screenshot({path:testInfo.outputPath(`${name}-mobile.png`),fullPage:true});
 }
});


test('historical listening-variant links open one canonical release without losing their reviews',async({page})=>{
 const response=await page.request.get('/api/catalog?slug=artista-de-prueba-azul-clean');
 const album=await response.json();
 expect(album.review_count).toBe(2);
 expect(album.reviews.map(review=>review.id)).toContain('clean-variant-review');
 await page.goto('/albumes/artista-de-prueba-azul-clean');
 await expect(page).toHaveURL(/\/albumes\/artista-de-prueba-azul$/);
 await expect(page.getByRole('heading',{name:'Azul',exact:true}).first()).toBeVisible();
 await expect(page.getByText('"Reseña de la variante limpia."',{exact:true})).toBeVisible();
 await page.goto('/artista/artista-de-prueba');
 await expect(page.getByRole('heading',{name:'Azul',exact:true})).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'Azul (Clean)',exact:true})).toHaveCount(0);
});


test('Pool discovery keeps genre filters inside the selected season and accepts original edition IDs', async ({page}) => {
  await page.route('**/rest/v1/public_pool_entries*', route => route.fulfill({contentType:'application/json',body:JSON.stringify([
    {album_id:'clean-variant-fixture',status:'GRADUADO'},
    {album_id:'00000000-0000-4000-8000-000000000002',status:'ACTIVO'},
  ])}));
  await page.goto('/gashapon?pool=temporada-1');
  await expect(page.getByText('🎰 Releases del Pool',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'🎲 Todos los Releases (2)',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Filtrar Gashapon por Jazz',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Filtrar Gashapon por Pop',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'1 lanzamientos disponibles'})).toBeVisible();
  await page.getByRole('link',{name:'Explorar catálogo completo',exact:true}).click();
  await expect(page).toHaveURL(/\/gashapon$/);
  await expect(page.getByText('🎰 Releases del Pool',{exact:true})).toHaveCount(0);
});


test('publisher verification and contact pages are public while pending releases stay out of search', async ({page}) => {
  const ads = await page.request.get('/ads.txt');
  expect(ads.ok()).toBe(true);
  expect((await ads.text()).trim()).toBe('google.com, pub-3995824345173266, DIRECT, f08c47fec0942fa0');
  await page.goto('/contacto');
  await expect(page.getByRole('heading',{name:'Hablemos de Musiclub',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'musiclub.org@gmail.com',exact:true})).toHaveAttribute('href','mailto:musiclub.org@gmail.com');
  const pending = await page.request.get('/albumes/artista-proximo-estreno-oficial');
  const html = await pending.text();
  expect(html).toMatch(/name="robots" content="noindex, follow"/);
  expect(html).toContain('name="google-adsense-account" content="ca-pub-3995824345173266"');
  expect(html).not.toMatch(/src="https:\/\/pagead2\.googlesyndication\.com/);
});
