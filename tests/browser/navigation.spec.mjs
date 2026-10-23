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

test('editorial selections change banners and retain real release links without overflowing',async({page})=>{
  await page.goto('/');
  const section=page.locator('section').filter({has:page.getByRole('heading',{name:'En el radar.',exact:true})});
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('link',{name:'Descubrir Popstar de Tinashe'})).toHaveAttribute('href','/albumes/tinashe-popstar');
  await section.getByRole('button',{name:'Mostrar Próximo Estreno'}).click();
  await expect(section.getByRole('link',{name:'Descubrir wor$t man in america de Slayyyter'})).toHaveAttribute('href',/slayyyter/);
  await section.getByRole('button',{name:'Mostrar Release Underground'}).click();
  await expect(section.getByRole('link',{name:'Descubrir House of LION BABE de LION BABE'})).toHaveAttribute('href','/albumes/lion-babe-house-of-lion-babe');
  await expect(section.locator('img')).toHaveJSProperty('naturalWidth',1600);
  await expect(section.locator('img')).toHaveAttribute('src',/lion-babe-house-canva-v2/);
  await expect(section.getByRole('tab')).toHaveCount(0);
  await expect(section).not.toContainText('SELECCIÓN DE LOS ADMINS');
  await expect(section).not.toContainText('Tres miradas');
  await expect(section).not.toContainText('MunRis');
  await section.getByRole('button',{name:'Release siguiente'}).click();
  await expect(section.getByRole('link',{name:'Descubrir Popstar de Tinashe'})).toBeVisible();
  await section.getByRole('button',{name:'Release anterior'}).click();
  await expect(section.getByRole('button',{name:'Mostrar Release Underground'})).toHaveAttribute('aria-current','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('catalogue searches Musiclub first and renders Spotify-only fallback without creating albums',async({page})=>{
  let searches=0,inserts=0;
  await page.route('**/api/spotify?*',route=>{
    const path=new URL(route.request().url()).searchParams.get('path') || '';
    if(!path.startsWith('/v1/search'))return route.fulfill({status:503,json:{error:'No detail fixture'}});
    const query = new URL(path,'https://api.spotify.com').searchParams.get('q');
    if (!['Azul','Órbita lejana'].includes(query)) return route.fulfill({json:{albums:{items:[],next:null},artists:{items:[]},tracks:{items:[]}}});
    searches++;
    return route.fulfill({json:{albums:{items:[{id:'1234567890123456789012',name:'Órbita lejana',artists:[{name:'Nuevo Artista'}],images:[{url:'/musiclub_logo.png'}],release_date:'2026-10-01',total_tracks:11,album_type:'album',external_urls:{spotify:'https://open.spotify.com/album/1234567890123456789012'}}],next:null}}});
  });
  page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/rest/v1/albums'))inserts++;});
  await page.goto('/catalogo?q=Azul&tab=releases');
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
  await page.waitForTimeout(650);expect(searches).toBe(0);
  await page.getByRole('textbox',{name:'Buscar álbum, artista o curador en el catálogo'}).fill('Órbita lejana');
  await expect(page.getByRole('status').filter({hasText:'Resultados de Spotify'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Órbita lejana',exact:true})).toBeVisible();
  expect(searches).toBeGreaterThan(0);
  await expect(page.getByRole('link',{name:'Abrir Órbita lejana en Spotify',exact:true})).toHaveAttribute('href','https://open.spotify.com/album/1234567890123456789012');
  await page.locator('button').filter({hasText:'Ver Álbum en Musiclub'}).click();
  await expect(page.getByRole('button',{name:/Google/})).toBeVisible();
  expect(inserts).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('Spotify search failures offer retry and never silently switch providers',async({page})=>{
  await page.route('**/api/spotify?*',route=>route.fulfill({status:503,json:{error:'Unavailable'}}));
  await page.goto('/catalogo?q=Release%20desconocido&tab=releases');
  await expect(page.getByRole('alert').filter({hasText:'No pudimos consultar Spotify'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Reintentar búsqueda',exact:true})).toBeVisible();
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

test('genre viewer keeps its center fixed, resumes rotation and controls speed', async ({page},testInfo) => {
  await page.goto('/generos/pop');
  const trigger=page.getByRole('button',{name:'Ampliar vinilo de Pop',exact:true});
  await trigger.click();
  const viewer=page.getByRole('dialog',{name:'Pop',exact:true});
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole('button',{name:'Cerrar vinilo ampliado'})).toBeFocused();
  await viewer.getByRole('button',{name:'Restablecer',exact:true}).click();
  const record=viewer.locator('[data-interactive-vinyl]');
  const surface=viewer.getByRole('group',{name:'Vinilo interactivo de Pop',exact:true});
  const artwork=record.locator('svg');
  const bounds=await artwork.boundingBox(),stageBounds=await surface.boundingBox();
  expect(bounds.width).toBeLessThan(stageBounds.width);
  expect(bounds.height).toBeLessThan(stageBounds.height);
  const label=artwork.locator('image').nth(1),centerBefore=await label.boundingBox();
  await expect(label).toHaveCSS('transform','none');
  await expect(record).toHaveCSS('transform','none');
  await expect(surface).not.toHaveAttribute('aria-keyshortcuts',/Arrow/);
  await expect(viewer.getByRole('slider',{name:'Zoom del vinilo'})).toHaveCount(0);
  await expect(viewer.getByRole('button',{name:/Pausar giro|Girar solo/})).toHaveCount(0);
  await viewer.getByRole('button',{name:'Aumentar velocidad',exact:true}).click();
  await expect(viewer.getByLabel('Velocidad de giro',{exact:true})).toHaveText('1.25×');
  await viewer.getByRole('slider',{name:'Velocidad del vinilo',exact:true}).press('End');
  await expect(viewer.getByLabel('Velocidad de giro',{exact:true})).toHaveText('3×');
  await viewer.getByRole('button',{name:'Restablecer',exact:true}).click();
  await expect(viewer.getByLabel('Velocidad de giro',{exact:true})).toHaveText('1×');
  if(testInfo.project.name==='desktop') {
    const box=await surface.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2,r=Math.min(box.width,box.height)*.3;
    await page.mouse.move(x,y-r);await page.mouse.down();await page.mouse.move(x+r,y,{steps:10});await page.mouse.up();
    // Let the release inertia settle, then verify the automatic rotation continues.
    await page.waitForTimeout(3500);
  }
  const initial=await record.getAttribute('style');
  await expect.poll(()=>record.getAttribute('style')).not.toBe(initial);
  await expect(artwork.locator('image').first()).not.toHaveCSS('transform','none');
  const centerAfter=await label.boundingBox();
  for(const key of ['x','y','width','height'])expect(centerAfter[key]).toBeCloseTo(centerBefore[key],1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('genre-vinyl-viewer.png')});
  await surface.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(viewer).toBeVisible();
  await viewer.getByRole('button',{name:'Cerrar vinilo ampliado'}).click();
  await expect(trigger).toBeFocused();
});

test('genre viewer uses a gentle initial speed with reduced motion and never stops automatically', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/generos/metal');
  await page.getByRole('button',{name:'Ampliar vinilo de Metal',exact:true}).click();
  const viewer=page.getByRole('dialog',{name:'Metal',exact:true});
  await expect(viewer.getByRole('slider',{name:'Velocidad del vinilo',exact:true})).toHaveValue('25');
  const record=viewer.locator('[data-interactive-vinyl]'),initial=await record.getAttribute('style');
  await expect.poll(()=>record.getAttribute('style')).not.toBe(initial);
  await viewer.getByRole('button',{name:'Cerrar vinilo ampliado'}).click();
});


test('home shows the newest reviews from three distinct people while the full feed retains every review',async({page})=>{
  await page.goto('/');
  const section=page.locator('section').filter({has:page.getByRole('heading',{name:'La Voz de la Comunidad',exact:true})});
  const releaseLinks=section.getByRole('link',{name:'Ver lanzamiento →',exact:true});
  await expect(releaseLinks).toHaveCount(3);
  const expected=['/albumes/artista-de-prueba-verde','/albumes/artista-de-prueba-rojo','/albumes/artista-de-prueba-azul'];
  for(let i=0;i<3;i++)await expect(releaseLinks.nth(i)).toHaveAttribute('href',expected[i]);
  await expect(section.getByText('Miembro de Prueba',{exact:true})).toHaveCount(1);
  await expect(section.getByText('Otra persona actual',{exact:true})).toHaveCount(1);
  await expect(section.getByText('Otra persona',{exact:true})).toHaveCount(1);
  await expect(section).toContainText('Calificó y puntuó este lanzamiento en la comunidad.');
  await page.goto('/reviews');
  // The review list uses the same canonical release links and preserves descending dates.
  await expect(page.locator('h4').nth(0)).toHaveText('Verde');
  await expect(page.locator('h4').nth(1)).toHaveText('Rojo');
  await expect(page.locator('h4').nth(2)).toHaveText('Azul');
});

test('an artist discovered through a lower-case URL keeps official capitalization',async({page})=>{
  await page.goto('/artista/the-weeknd');
  await expect(page.getByRole('heading',{name:'The Weeknd',exact:true})).toBeVisible();
  await expect(page).toHaveTitle(/^The Weeknd/);
});


test('a member edits their existing Pool capsule at full capacity and sees current profile names', async ({page}) => {
 const member={id:'00000000-0000-4000-8000-000000000099',name:'Nombre actual',email:'member@example.test',role:'user'};
 const entry={id:'00000000-0000-4000-8000-000000000088',season_id:'current',album_id:'00000000-0000-4000-8000-000000000001',user_id:member.id,nominated_by:'Old Google name',note:'Original note',status:'ACTIVO',reviews_enabled:false,created_at:'2025-01-01T00:00:00Z'};
 // This is a synthetic local-only Auth session; no real credential or production service is used.
 const expiresAt=Math.floor(Date.now()/1000)+3600;
 const authUser={id:member.id,email:member.email,role:'authenticated',app_metadata:{provider:'google'},user_metadata:{name:member.name}};
 const token=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:member.id,exp:expiresAt,role:'authenticated'})).toString('base64url'),'fixture'].join('.');
 await page.addInitScript(({user,session})=>{
  localStorage.setItem('maquina_musical_user',JSON.stringify(user));
  localStorage.setItem('sb-127-auth-token',JSON.stringify(session));
 },{user:member,session:{access_token:token,refresh_token:'local-fixture',expires_at:expiresAt,expires_in:3600,token_type:'bearer',user:authUser}});
 await page.route('**/rest/v1/profiles*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...member,avatar_url:null})}));
 await page.route('**/rest/v1/seasons*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{id:'current',name:'Fixture Pool',season_number:2,is_active:true,is_open:true,max_releases:1,start_date:'2025-01-01'}])}));
 await page.route('**/rest/v1/public_pool_entries*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([entry])}));
 await page.route('**/rest/v1/public_profiles*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{id:member.id,name:member.name,avatar_url:null}])}));
 let edited=null,nominations=0;
 await page.route('**/rest/v1/rpc/musiclub_nominate_pool_release',route=>{nominations++;return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Unexpected new nomination'})});});
 await page.route('**/rest/v1/rpc/musiclub_edit_pool_release',route=>{
  edited=route.request().postDataJSON(); entry.note=edited.p_note;
  return route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,entryId:entry.id,albumId:entry.album_id})});
 });
 await page.goto('/pool');
 const hero=page.getByRole('region',{name:'Pool activo',exact:true});
 await expect(hero).toContainText('Cupo completo');
 await expect(page.getByText('Por: Nombre actual',{exact:true})).toBeVisible();
 await expect(page.getByText('Por: Old Google name',{exact:true})).toHaveCount(0);
 await hero.getByRole('button',{name:'✎ Editar mi cápsula',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'📥 Editar mi cápsula',exact:true});
 await expect(dialog.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
 await expect(dialog.locator('textarea')).toHaveValue('Original note');
 await dialog.locator('textarea').fill('Updated note');
 await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await expect(dialog.getByRole('button',{name:'Volver al Pool',exact:true})).toBeVisible();
 expect(edited.p_entry_id).toBe(entry.id); expect(edited.p_note).toBe('Updated note'); expect(nominations).toBe(0);
 await dialog.getByRole('button',{name:'Volver al Pool',exact:true}).click();
 await hero.getByRole('button',{name:'✎ Editar mi cápsula',exact:true}).click();
 await expect(page.getByRole('dialog').locator('textarea')).toHaveValue('Updated note');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('a cached admin profile cannot keep an expired or missing session signed in', async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem('maquina_musical_user',JSON.stringify({id:'stale',email:'stale@example.test',name:'Stale admin',role:'admin'})));
 await page.goto('/admin');
 await expect(page.getByText('⛔ Acceso denegado',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('maquina_musical_user'))).toBeNull();
});


test('help pages separate practical questions from listening guides and preserve footer navigation',async({page})=>{
 await page.goto('/faq');
 const question=page.getByRole('button',{name:/¿Dónde puedo consultar la fórmula de las notas/});
 await question.click();
 await expect(question).toHaveAttribute('aria-expanded','true');
 await page.getByRole('link',{name:'Consultar la metodología de calificación →',exact:true}).click();
 await expect(page).toHaveURL(/\/guias\/como-calificamos$/);
 await expect(page.getByRole('heading',{name:'Cómo se calcula una calificación en Musiclub',exact:true})).toBeVisible();
 await expect(page.locator('footer').getByRole('link',{name:'❓ Preguntas frecuentes',exact:true})).toHaveAttribute('href','/faq');
 await expect(page.locator('footer').getByRole('link',{name:'Guías de escucha y reseña',exact:true})).toHaveAttribute('href','/guias');
 await page.goto('/guias');
 await expect(page.getByRole('link',{name:'Ayuda para usar Musiclub →',exact:true})).toHaveAttribute('href','/faq');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('the sign-in dialog uses the Musiclub note artwork', async ({page}) => {
 await page.goto('/');
 await page.getByRole('button',{name:'👤 Iniciar sesión',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('img',{name:'Nota musical de Musiclub',exact:true})).toHaveAttribute('src','/musiclub_logo_corchea.png');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
});
