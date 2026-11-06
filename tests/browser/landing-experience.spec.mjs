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
 await expect(page.getByRole('heading',{level:1})).toHaveText('Descubre música.Compártela en Musiclub.');
 const hero=page.getByRole('region',{name:'Descubre música.Compártela en Musiclub.'});
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
 await page.getByRole('button',{name:'Probar palanca de demostración',exact:true}).click();
 await expect(page.locator('[data-capsule-demo]')).toContainText('no cambia ningún Pool');
 expect(await page.locator('[data-capsule-demo] [aria-live="polite"]').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
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

test('the needle controls one lazy audio preview, pauses on release changes and leaves the complete deck unobstructed',async({page})=>{
 const samples=[];
 const wav=Buffer.alloc(44+8000*30*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
 await page.route('**/sample.wav',route=>route.fulfill({contentType:'audio/wav',body:wav}));
 await page.route('**/api/listening-preview?*',route=>{samples.push(route.request().url());return route.fulfill({json:{preview:{url:'http://127.0.0.1:3101/sample.wav',storeUrl:'https://music.apple.com/mx/album/fixture/123?i=456',name:'Segunda canción',reason:'Favorita del club'}}});});
 await openLanding(page);expect(samples).toHaveLength(0);
 await page.getByRole('button',{name:'Mostrar Azul en la tornamesa',exact:true}).click();
 const player=page.locator('[aria-label="Tornamesa interactiva de Musiclub"] [data-playing]');
 const deck=await player.locator('[class*="deckArea"]').boundingBox(),panel=await player.locator('[class*="releasePanel"]').boundingBox();
 expect(deck.y+deck.height).toBeLessThanOrEqual(panel.y+1);
 await page.getByRole('button',{name:'Bajar aguja y escuchar muestra',exact:true}).click();
 await expect(player).toHaveAttribute('data-playing','true');
 await expect(player).toHaveAttribute('data-needle-down','true');
 await expect(player).toContainText('Segunda canción');expect(samples).toHaveLength(1);
 await page.getByRole('button',{name:'Levantar aguja y pausar',exact:true}).click();
 await expect(player).toHaveAttribute('data-playing','false');
 expect(await player.locator('audio').evaluate(audio=>audio.paused)).toBe(true);
 await page.getByRole('button',{name:'Bajar aguja y escuchar muestra',exact:true}).press('Enter');
 await expect(player).toHaveAttribute('data-playing','true');expect(samples).toHaveLength(1);
 await page.getByRole('button',{name:'Mostrar Rojo en la tornamesa',exact:true}).click();
 await expect(player).toHaveAttribute('data-playing','false');await expect(player).toHaveAttribute('data-needle-down','false');
 expect(await player.locator('audio').evaluate(audio=>audio.paused)).toBe(true);expect(samples).toHaveLength(1);
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
