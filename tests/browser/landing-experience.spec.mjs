import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});

async function openLanding(page){
 // Hydration starts these two original reads after the document's load event.
 // Wait for their complete responses, rather than treating networkidle as
 // proof that React's initial effects have finished.
 const initial=Promise.all(['all','winner'].map(kind=>page.waitForResponse(response=>{
  const url=new URL(response.url());
  return url.pathname==='/rest/v1/public_pool_entries'&&(kind==='all'?url.searchParams.get('select')==='*':url.searchParams.get('status')==='eq.GANADOR');
 }).then(response=>response.finished())));
 await page.goto('/');await initial;
}

test('landing presents real releases, native genre vinyls and working catalogue search without navigation refreshes',async({page},info)=>{
 const hydrationErrors=[];page.on('console',message=>{if(message.type()==='error'&&/hydrated|hydration mismatch/i.test(message.text()))hydrationErrors.push(message.text());});
 await openLanding(page);
 await expect(page.getByRole('heading',{level:1})).toHaveText('En MUSICLUB, descubre, califica y debate cada release.');
 const queries=[];page.on('request',r=>{if(/\/api\/catalog|\/rest\/v1\//.test(r.url()))queries.push(r.url());});
 await expect(page.getByRole('link',{name:'Explorar Jazz',exact:true})).toHaveAttribute('href','/generos/jazz');
 await expect(page.locator('[aria-label="Tornamesa interactiva de Musiclub"] img[src*="/genres/colors/"]')).toHaveCount(1);
 await page.getByRole('button',{name:'Mostrar Azul en la tornamesa',exact:true}).click();
 await expect(page.getByRole('link',{name:'Ver release: Azul',exact:true})).toHaveAttribute('href','/albumes/artista-de-prueba-azul');
 await page.getByRole('button',{name:'Pausar animaciones',exact:true}).click();
 await expect(page.locator('[data-landing-experience]')).toHaveAttribute('data-motion-paused','true');
 expect(await page.locator('[data-turntable-record]').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 expect(queries).toHaveLength(0);
 expect(hydrationErrors).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`outputs/v11-landing-hero-${info.project.name}.png`,animations:'disabled'});
 await page.getByRole('textbox',{name:'Buscar álbum o artista',exact:true}).fill('Azul');await page.getByRole('button',{name:'Buscar',exact:true}).click();
 await expect(page).toHaveURL(/\/catalogo\?q=Azul#explorador-catalogo/);
});

test('landing simulations are local, use all seven criteria and retain a sticky chapter navigator',async({page},info)=>{
 await openLanding(page);await expect(page.locator('[data-review-demo]')).toBeAttached();
 const writes=[],reads=[];page.on('request',r=>{if(/\/rest\/v1\/|\/api\/catalog|\/api\/notifications/.test(r.url())){if(r.method()==='GET')reads.push(r.url());else writes.push(r.url());}});
 await page.getByRole('button',{name:'Pausar animaciones',exact:true}).click();
 const demo=page.locator('[data-review-demo]');await demo.getByRole('button',{name:'Ajustar General',exact:true}).click();
 await page.getByRole('button',{name:'Ejemplo para reseñar: Azul',exact:true}).click();
 await demo.getByRole('button',{name:'Ajustar General',exact:true}).click();
 const slider=demo.getByRole('slider',{name:'General de la demostración',exact:true});await slider.press('Home');await expect(slider).toHaveValue('1');
 await expect(demo.getByRole('button',{name:/^Ajustar/})).toHaveCount(7);
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Descubrir/}).click();
 const gashapon=page.locator('[data-gashapon-demo]');
 await gashapon.getByRole('button',{name:/^Abrir cápsula de /}).click();
 await expect(gashapon).toContainText('no guarda cambios');
 await expect(gashapon.locator('[data-vinyl-reveal]')).toHaveAttribute('data-stage','revealed');
 await gashapon.getByRole('button',{name:'Probar otra cápsula',exact:true}).click();
 await expect(gashapon.locator('[data-vinyl-reveal]')).toHaveAttribute('data-stage','ready');
 await gashapon.getByRole('button',{name:'Ejemplo para descubrir: Azul',exact:true}).click();
 await gashapon.getByRole('button',{name:/^Abrir cápsula de /}).click();
 await expect(gashapon.locator('[aria-live="polite"]')).toContainText('Azul');
 await expect(page.locator('#demo-descubrir').getByRole('link',{name:'Entrar al Gashapon',exact:true})).toHaveAttribute('href','/gashapon');
 const nav=page.getByRole('navigation',{name:'Demostraciones de Musiclub'});
 expect(await nav.evaluate(el=>getComputedStyle(el).position)).toBe('sticky');
 const bounds=await nav.boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeLessThan(220);
 await page.screenshot({path:`outputs/v11-landing-capsules-${info.project.name}.png`,animations:'disabled'});
 await nav.getByRole('link',{name:/Compartir/}).click();await page.getByRole('button',{name:'Horizontal',exact:true}).click();
 await page.getByRole('button',{name:'Ejemplo para compartir: Azul',exact:true}).click();
 await expect(page.locator('[data-share-preview]')).toContainText('Artista de Prueba');
 // An actual historical review may have no favorite or criterion scores. A
 // randomized example must preserve those omissions, rather than invent them.
 const favorite=page.locator('[data-share-preview] [class*="shareInfo"] > span');
 if(await favorite.count())await expect(favorite).toHaveText('Segunda canción');
 await expect(page.locator('[data-share-preview] [class*="miniCriteria"] > span')).toHaveCount(7);
 expect(await page.locator('#demo-compartir').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
 await expect(page.getByRole('link',{name:/Conoce Musiclub por dentro/})).toHaveAttribute('href','/guias');
 expect(writes).toHaveLength(0);expect(reads).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`outputs/v11-landing-share-${info.project.name}.png`,animations:'disabled'});
});

test('reduced motion keeps the complete landing readable and makes decorative scenes static',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 const art=page.locator('[data-turntable-record]');
 expect(await art.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Compartir/}).click();
 await expect(page.locator('[data-share-preview]')).toBeVisible();
 expect(await page.locator('[data-share-preview]').evaluate(el=>getComputedStyle(el.closest('article')).opacity)).toBe('1');
});

test('the integrated turntable has local needle controls, real metadata and optional effects without music requests',async({page},info)=>{
 await page.addInitScript(()=>{
   const Native=window.AudioContext||window.webkitAudioContext;window.__deckContexts=[];
   if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);window.__deckContexts.push(this);}};
 });
 await openLanding(page);
 const requests=[];page.on('request',request=>{if(/\/api\/|\/rest\/v1\/|itunes\.apple|api\.spotify|AudioPreview|\.mp3|\.m4a/.test(request.url()))requests.push(request.url());});
 const player=page.locator('[aria-label="Tornamesa interactiva de Musiclub"]'),deck=player.locator('[data-turntable-deck]');
 await expect(player.locator('audio,iframe')).toHaveCount(0);
 await expect(deck.locator('[data-turntable-display]')).toHaveCount(1);
 await expect(deck.locator('[data-turntable-console] [aria-label^="Calificación del club"]')).toHaveCount(1);
 await expect(deck.locator('[data-turntable-console] [role="img"]')).toHaveCount(1);
 await expect(player.getByRole('button',{name:/^Mostrar /})).toHaveCount(3);
 await expect(deck.getByRole('button',{name:/^Mostrar /})).toHaveCount(0);
 await expect(player).toHaveAttribute('data-needle-down','true');
 const record=deck.locator('[data-turntable-record]');await expect(record.locator('img')).toHaveCount(2);
 expect(await record.evaluate(el=>getComputedStyle(el).animationPlayState)).toBe('running');
 expect(await deck.locator('[data-turntable-display] strong').evaluate(el=>getComputedStyle(el).fontFamily)).toMatch(/Gabarito|gabarito/);
 const dimensions=await deck.boundingBox();expect(dimensions.width).toBeGreaterThan(dimensions.height);
 await page.getByRole('button',{name:'Mostrar Azul en la tornamesa',exact:true}).click();
 await expect(deck.getByRole('link',{name:'Ver release: Azul',exact:true})).toHaveAttribute('href','/albumes/artista-de-prueba-azul');
 await page.getByRole('button',{name:'Levantar aguja',exact:true}).click();await expect(player).toHaveAttribute('data-needle-down','false');
 await page.getByRole('button',{name:'Bajar aguja',exact:true}).press('Enter');await expect(player).toHaveAttribute('data-needle-down','true');
 await page.getByRole('button',{name:'Levantar aguja',exact:true}).press('Enter');await expect(player).toHaveAttribute('data-needle-down','false');
 const needle=page.getByRole('button',{name:'Bajar aguja',exact:true});await needle.scrollIntoViewIfNeeded();const bounds=await needle.boundingBox();
 const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-22,y+28);await page.mouse.up();
 await expect(player).toHaveAttribute('data-needle-down','true');
 await page.getByRole('button',{name:'Disco siguiente',exact:true}).click();await expect(player).toHaveAttribute('data-needle-down','true');
 expect(await page.evaluate(()=>window.__deckContexts.length)).toBe(0);
 await page.getByRole('button',{name:'Activar efectos de sonido',exact:true}).click();await expect(player).toHaveAttribute('data-effects-enabled','true');
 expect(await page.evaluate(()=>window.__deckContexts.length)).toBe(1);
 await page.getByRole('button',{name:'Silenciar efectos de sonido',exact:true}).click();await expect(player).toHaveAttribute('data-effects-enabled','false');
 await expect.poll(()=>page.evaluate(()=>window.__deckContexts[0].state)).toBe('closed');
 expect(requests).toHaveLength(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'outputs/v11-1-2-turntable-'+info.project.name+'.png',animations:'disabled'});
});

test('Gashapon opens real release examples locally and cancels an old reveal when another capsule is selected',async({page})=>{
 await openLanding(page);
 const demo=page.locator('[data-gashapon-demo]'),reveal=demo.locator('[data-vinyl-reveal]');
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Descubrir/}).click();
 await demo.getByRole('button',{name:/^Abrir cápsula de /}).press('Enter');await expect(reveal).toHaveAttribute('data-stage','opening');
 await demo.getByRole('button',{name:'Ejemplo para descubrir: Azul',exact:true}).click();
 await expect(reveal).toHaveAttribute('data-stage','ready');
 await demo.getByRole('button',{name:/^Abrir cápsula de /}).press('Enter');await expect(reveal).toHaveAttribute('data-stage','revealed');
 await expect(demo.locator('[data-vinyl-cover] img')).toHaveAttribute('alt','Azul');
 await expect(demo.locator('[aria-live="polite"]')).toContainText('Artista de Prueba');
});

test('genre links open the animated genre explorer and filters remain local',async({page})=>{
 await openLanding(page);await page.getByRole('link',{name:'Explorar Pop',exact:true}).click();
 await expect(page).toHaveURL(/\/generos\/pop$/);await expect(page.getByRole('heading',{name:'Releases de Pop',exact:true})).toBeVisible();
 const queries=[];page.on('request',r=>{if(/\/rest\/v1\/|\/api\/catalog/.test(r.url()))queries.push(r.url());});
 await page.getByRole('textbox',{name:'Buscar en este género',exact:true}).fill('no existe este release');
 await expect(page.getByText('No encontramos releases con estos filtros. Prueba otra búsqueda.',{exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'Buscar en este género',exact:true}).fill('Azul');
 await page.getByRole('button',{name:'Con reseñas',exact:true}).click();
 await expect(page.getByRole('region',{name:'Lanzamientos de Pop',exact:true})).toContainText('Azul');
 expect(queries).toHaveLength(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
