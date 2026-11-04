import {test,expect} from '@playwright/test';
import {openFixturePool} from './pool-fixture.mjs';

test('loading shows a large existing vinyl and context text without rendering the page template',async({page},testInfo)=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/rest/v1/pool_rooms*',async route=>{await gate;return route.fulfill({json:[]});});
  await page.goto('/pool');
  const loading=page.locator('[data-vinyl-loading]');
  await expect(loading).toContainText('Cargando salas');
  await expect(loading.locator('svg')).toBeVisible();
  expect((await loading.locator('svg').boundingBox()).width).toBeGreaterThan(200);
  expect((await loading.boundingBox()).height).toBeGreaterThanOrEqual(page.viewportSize().height);
  await expect(page.getByRole('heading',{name:/Cada sala/})).toHaveCount(0);
  await page.screenshot({path:`outputs/loading-v1070-${testInfo.project.name}.png`});
  release();await expect(page.getByRole('heading',{name:/Cada sala/})).toBeVisible();
});

test('leaving a Pool cannot flash the directory while another page is still opening',async({page},testInfo)=>{
  await openFixturePool(page,{openMachine:false});
  let release,intercepted=false;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/catalogo?*',async route=>{intercepted=true;await gate;return route.continue();});
  if(testInfo.project.name==='mobile')await page.getByRole('button',{name:'Abrir menú de navegación',exact:true}).click();
  await page.getByRole('link',{name:testInfo.project.name==='mobile'?'Catálogo Todos los releases':'Catálogo',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:/Cada sala/})).toHaveCount(0);
  if(intercepted)await expect(page.getByRole('region',{name:'Pool activo',exact:true})).toBeVisible();
  release();await expect(page.getByRole('heading',{name:'Catálogo Musical',exact:true})).toBeVisible();
});

test('the cover has streaming below it, hero and winner share the selected vinyl, and invitation controls use only icons',async({page},testInfo)=>{
  await openFixturePool(page,{openMachine:false,initialWinner:true});
  const hero=page.getByRole('region',{name:'Pool activo',exact:true});
  await expect(hero).toContainText('Sala pública');
  await expect(hero.getByRole('button',{name:'Crear invitación',exact:true})).toBeVisible();
  await expect(hero.getByRole('button',{name:'Crear invitación',exact:true})).toHaveText('');
  await expect(page.getByRole('heading',{name:'Sala de prueba',exact:true})).toHaveCount(0);
  const vinyls=page.locator('[data-pool-vinyl]');
  const identities=await vinyls.evaluateAll(items=>items.map(el=>el.getAttribute('data-pool-vinyl')));
  expect(identities.filter(id=>id==='Jazz').length).toBeGreaterThanOrEqual(2);
  const streaming=page.locator('[data-winner-streaming]');
  await expect(streaming.getByRole('link',{name:'Apple Music',exact:true})).toBeVisible();
  const bounds=await streaming.boundingBox(),image=await streaming.locator('..').getByRole('img',{name:'Azul',exact:true}).boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(image.y+image.height);
  await expect(page.getByText('EN FOCO SEMANAL',{exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await hero.screenshot({path:`outputs/pool-hero-v1070-${testInfo.project.name}.png`,animations:'disabled'});
});

test('capsule inspection loops in CSS, opens without queries, and Escape restores focus',async({page},testInfo)=>{
  await openFixturePool(page,{openMachine:false});
  await page.waitForLoadState('networkidle');
  const requests=[];page.on('request',r=>{if(r.url().includes('/rest/v1/'))requests.push(r.url());});
  const trigger=page.getByRole('button',{name:'Ver cápsula de Azul',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Cápsula de Azul',exact:true});
  await expect(dialog).toBeVisible();
  const animation=await dialog.locator('[data-capsule-loop] img').last().evaluate(el=>({duration:getComputedStyle(el).animationDuration,count:getComputedStyle(el).animationIterationCount}));
  expect(animation.duration).toBe('7s');expect(animation.count).toBe('infinite');
  await dialog.screenshot({path:`outputs/capsule-v1070-${testInfo.project.name}.png`});
  await page.getByRole('button',{name:'Cerrar cápsula',exact:true}).press('Escape');
  await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
  expect(requests).toEqual([]);
});

test('an administrator generates one stable code and the current Pool opens by its own URL',async({page})=>{
  await openFixturePool(page,{openMachine:false});
  await page.getByText('Administrar Pool · control manual',{exact:true}).click();
  await page.getByRole('button',{name:'Generar código del Pool',exact:true}).click();
  await expect(page).toHaveURL(/\/pool\/AB12CD34EF56$/);
  await expect(page.getByRole('region',{name:'Pool activo',exact:true})).toContainText('Pool de prueba');
  await expect(page.getByText('Este Pool no está disponible',{exact:true})).toHaveCount(0);
});

test('Pool navigation includes every public active and inactive season, and empty archive proposals stay hidden',async({page})=>{
  const room='00000000-0000-4000-8000-000000000000',other='00000000-0000-4000-8000-000000000082';
  const seasons=[{id:'current-a',room_id:room,name:'Actual A',is_active:true,season_number:2},{id:'past-a',room_id:room,name:'Histórico A',is_active:false,season_number:1},{id:'current-b',room_id:other,name:'Actual B',is_active:true,season_number:2},{id:'future-b',room_id:other,name:'Cerrado B',is_active:false,season_number:3}];
  await page.route('**/rest/v1/pool_rooms*',route=>route.fulfill({json:[{id:room,name:'Sala A',visibility:'public'},{id:other,name:'Sala B',visibility:'public'}]}));
  await page.route('**/rest/v1/seasons*',route=>{const filter=new URL(route.request().url()).searchParams.get('room_id');return route.fulfill({json:filter?.startsWith('eq.')?seasons.filter(s=>s.room_id===filter.slice(3)):seasons});});
  await page.route('**/rest/v1/public_pool_entries*',route=>route.fulfill({json:[]}));
  await page.goto(`/pool?sala=${room}&temporada=past-a`);
  await expect(page.getByRole('region',{name:'Pool cerrado',exact:true})).toContainText('Histórico A');
  const nav=page.getByRole('navigation',{name:'Pools públicos',exact:true});
  await expect(nav.getByRole('link')).toHaveCount(4);
  await expect(nav.getByRole('link',{name:'Actual B',exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:/Cerrado B/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Propuestas de este Pool/})).toHaveCount(0);
  await expect(page.getByPlaceholder('Filtrar por disco, artista o quién propuso...')).toHaveCount(0);
});
