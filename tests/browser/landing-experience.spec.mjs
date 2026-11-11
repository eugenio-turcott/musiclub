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
 await expect(page.locator('[data-turntable-display]')).toHaveAttribute('href',/\/albumes\/artista-de-prueba-/);
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
 await expect(gashapon.locator('[data-vinyl-reveal]')).toHaveCount(3);
 for(const vinyl of await gashapon.locator('[data-vinyl-reveal]').all())await expect(vinyl).toHaveAttribute('data-stage','revealed');
 expect((await gashapon.boundingBox()).height).toBeLessThanOrEqual(300);
 await expect(gashapon.getByText('Demostración · no guarda cambios',{exact:true})).toHaveCount(0);
 await expect(gashapon.getByRole('button',{name:/Ejemplo para descubrir|Probar otra|Género/})).toHaveCount(0);
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
 await expect(page.locator('[aria-label="Tornamesa interactiva de Musiclub"]')).toHaveAttribute('data-turntable-cycling','false');
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Compartir/}).click();
 await expect(page.locator('[data-share-preview]')).toBeVisible();
 expect(await page.locator('[data-share-preview]').evaluate(el=>getComputedStyle(el.closest('article')).opacity)).toBe('1');
});

test('the integrated turntable has local needle controls, full artwork and natural gesture sounds without music requests',async({page},info)=>{
 await page.addInitScript(()=>{
   const Native=window.AudioContext||window.webkitAudioContext;window.__deckContexts=[];
   if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);window.__deckContexts.push(this);}};
 });
 await openLanding(page);
 const requests=[];page.on('request',request=>{if(/\/api\/|\/rest\/v1\/|itunes\.apple|api\.spotify|AudioPreview|\.mp3|\.m4a/.test(request.url()))requests.push(request.url());});
 const player=page.locator('[aria-label="Tornamesa interactiva de Musiclub"]'),deck=player.locator('[data-turntable-deck]');
 await expect(player.locator('audio,iframe')).toHaveCount(0);
 await expect(deck.locator('[data-turntable-display]')).toHaveCount(1);
 expect(await deck.locator('[data-turntable-display] img').count()).toBeLessThanOrEqual(3);
 await expect(deck.locator('[data-turntable-console] [aria-label^="Calificación del club"]')).toHaveCount(1);
 await expect(deck.locator('header [role="img"]')).toHaveCount(0);
 await expect(deck.locator('[data-turntable-console] [role="img"]')).toHaveCount(1);
 await expect(player.getByRole('button',{name:/efectos de sonido|Disco anterior|Disco siguiente/})).toHaveCount(0);
 await expect(player.getByText('Vinilo girando · Aguja sobre el disco',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>window.__deckContexts.length)).toBe(0);
 await expect(player.getByRole('button',{name:/^Mostrar /})).toHaveCount(0);
 await expect(player.getByText('DISCOS DEL CLUB',{exact:true})).toHaveCount(0);
 await expect(deck.locator('header')).toContainText('33⅓ · ESTÉREO');
 const shortcuts=player.getByRole('navigation',{name:'Explorar Musiclub'});
 await expect(shortcuts.getByRole('link',{name:'Explorar Pools',exact:true})).toHaveAttribute('href','/pool');
 await expect(shortcuts.getByRole('link',{name:'Gashapon Arcade',exact:true})).toHaveAttribute('href','/gashapon');
 await expect(shortcuts.getByRole('link',{name:'Ver cómo funciona',exact:true})).toHaveAttribute('href','#musiclub-en-accion');
 expect((await shortcuts.boundingBox()).y).toBeGreaterThan((await deck.boundingBox()).y+(await deck.boundingBox()).height);
 await expect(deck.getByRole('button',{name:/^Mostrar /})).toHaveCount(0);
 await expect(player).toHaveAttribute('data-needle-down','true');
 const record=deck.locator('[data-turntable-record]');await expect(record.locator('img')).toHaveCount(2);
 expect(await record.evaluate(el=>getComputedStyle(el).animationPlayState)).toBe('running');
 expect(await deck.locator('[data-turntable-display] strong').evaluate(el=>getComputedStyle(el).fontFamily)).toMatch(/Gabarito|gabarito/);
 const dimensions=await deck.boundingBox();expect(dimensions.width).toBeGreaterThan(dimensions.height);
 expect(await deck.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
 await expect(player.getByText(/MUEVE.*LA AGUJA/)).toHaveCount(0);
 await expect(deck.locator('[data-turntable-display]')).toHaveAttribute('href',/\/albumes\/artista-de-prueba-/);
 await page.getByRole('button',{name:'Levantar aguja',exact:true}).click();await expect(player).toHaveAttribute('data-needle-down','false');
 await page.getByRole('button',{name:'Bajar aguja',exact:true}).press('Enter');await expect(player).toHaveAttribute('data-needle-down','true');
 await page.getByRole('button',{name:'Levantar aguja',exact:true}).press('Enter');await expect(player).toHaveAttribute('data-needle-down','false');
 const needle=page.getByRole('button',{name:'Bajar aguja',exact:true});await needle.scrollIntoViewIfNeeded();const bounds=await needle.boundingBox();
 const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-22,y+28);await page.mouse.up();
 await expect(player).toHaveAttribute('data-needle-down','true');
 await expect(player).toHaveAttribute('data-needle-down','true');
 expect(await page.evaluate(()=>window.__deckContexts.length)).toBe(1);
 await expect.poll(()=>page.evaluate(()=>window.__deckContexts[0].state)).toBe('running');
 expect(requests).toHaveLength(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const score=await deck.locator('[aria-label^="Calificación del club"]').boundingBox(),wave=await deck.locator('[data-turntable-waveform]').boundingBox(),mood=await deck.locator('[role="img"]').boundingBox(),genre=await deck.locator('[class*="genre"]').boundingBox(),cover=await deck.locator('[data-turntable-display]').boundingBox();
 expect(wave.y).toBeGreaterThanOrEqual(score.y+score.height);expect(wave.width).toBeGreaterThan(score.width);expect(mood.x).toBeGreaterThanOrEqual(score.x+score.width-1);expect(genre.y).toBeGreaterThan(cover.y+cover.height);expect(genre.y+genre.height).toBeLessThanOrEqual(score.y);
 await page.screenshot({path:'outputs/v11-1-10-turntable-'+info.project.name+'.png',animations:'disabled'});
 if(info.project.name==='mobile'){
  await page.setViewportSize({width:320,height:740});
  const s=await deck.locator('[aria-label^="Calificación del club"]').boundingBox(),m=await deck.locator('[role="img"]').boundingBox(),g=await deck.locator('[class*="genre"]').boundingBox();
  expect(s.x+s.width).toBeLessThanOrEqual(m.x);expect(g.y+g.height).toBeLessThanOrEqual(s.y);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('turntable crossfades all sampled covers locally, reveals metadata and respects motion pause',async({page},info)=>{
 await openLanding(page);
 const player=page.locator('[aria-label="Tornamesa interactiva de Musiclub"]'),display=player.locator('[data-turntable-display]');
 await display.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
 await expect(player).toHaveAttribute('data-turntable-cycling','true');
 const requests=[];page.on('request',r=>{if(/\/rest\/v1\/|\/api\/catalog/.test(r.url()))requests.push(r.url());});
 const active=display.locator('[data-active="true"]');
 const image=await active.locator('img').boundingBox(),tile=await display.boundingBox();
 expect(Math.abs(image.width-(tile.width-2))).toBeLessThan(2);expect(Math.abs(image.height-(tile.height-2))).toBeLessThan(2);
 expect(await active.evaluate(el=>getComputedStyle(el).transitionProperty)).toBe('opacity');
 expect(parseFloat(await active.evaluate(el=>getComputedStyle(el).transitionDuration))).toBeGreaterThan(.5);
 await page.clock.install();const first=await display.getAttribute('href'),seen=new Set([first]);
 for(let i=0;i<3;i++){await page.clock.fastForward(6500);await expect(display).not.toHaveAttribute('href',[...seen].at(-1));seen.add(await display.getAttribute('href'));}
 expect(seen.size).toBe(3);await expect(display).toHaveAttribute('href',first);
 const title=await active.locator('img').getAttribute('alt');
 await expect(display).toContainText(/Pop|Rock|Jazz/);
 const metadata=display.locator('[class*="displayText"]');
 if(info.project.name==='desktop'){
  expect(await metadata.evaluate(el=>getComputedStyle(el).opacity)).toBe('0');
  await display.hover();await expect(player).toHaveAttribute('data-turntable-cycling','false');
  await page.clock.fastForward(400);await expect(metadata).toHaveCSS('opacity','1');
 }else await expect(metadata).toHaveCSS('opacity','1');
 await expect(metadata).toContainText(title);await expect(metadata).toContainText('Artista de Prueba');
 await page.getByRole('button',{name:'Pausar animaciones',exact:true}).click();
 await expect(player).toHaveAttribute('data-turntable-cycling','false');const stopped=await display.getAttribute('href');
 await page.clock.fastForward(14000);await expect(display).toHaveAttribute('href',stopped);
 await page.getByRole('button',{name:'Activar animaciones',exact:true}).click();
 await page.locator('#demo-compartir').scrollIntoViewIfNeeded();
 await expect(player).toHaveAttribute('data-turntable-cycling','false');
 await page.clock.fastForward(14000);await expect(display).toHaveAttribute('href',stopped);
 expect(requests).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('the compact Gashapon cycles real releases only while visible without new data requests',async({page})=>{
 await openLanding(page);
 const demo=page.locator('[data-gashapon-demo]'),reveal=demo.locator('[data-vinyl-reveal]').first(),requests=[];
 page.on('request',r=>{if(/\/rest\/v1\/|\/api\/catalog/.test(r.url()))requests.push(r.url());});
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Descubrir/}).click();
 await expect(reveal).toHaveAttribute('data-compact','true');
 await expect.poll(()=>reveal.getAttribute('data-stage')).toBe('revealed');
 await expect(demo.locator('[data-vinyl-reveal]')).toHaveCount(3);
 const identities=await demo.locator('[data-vinyl-reveal]').evaluateAll(items=>items.map(el=>el.getAttribute('data-vinyl-edition')));
 expect(new Set(identities).size).toBe(3);
 const covers=demo.locator('[data-vinyl-cover] img');
 const cover=covers.first(),first=await cover.getAttribute('alt');
 expect(new Set(await covers.evaluateAll(items=>items.map(el=>el.alt))).size).toBe(3);
 await expect.poll(async()=>{const title=await cover.getAttribute('alt');return Boolean(title&&title!==first);},{timeout:8000}).toBe(true);
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Compartir/}).click();
 await expect(page.locator('#demo-compartir')).toBeInViewport();
 await page.locator('[data-share-preview]').scrollIntoViewIfNeeded();
 await expect(demo).not.toBeInViewport();await expect(demo).toHaveAttribute('data-gashapon-active','false');
 const stopped=await cover.getAttribute('alt');await page.waitForTimeout(3500);expect(await cover.getAttribute('alt')).toBe(stopped);
 expect(requests).toHaveLength(0);
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

test('the offscreen badge carousels defer their duplicated artwork until the section approaches',async({page})=>{
 await openLanding(page);
 const rails=page.locator('[data-badge-ready]');
 await expect(rails).toHaveAttribute('data-badge-ready','false');
 await expect(rails.locator('.achievement-badge')).toHaveCount(9);
 const reads=[];page.on('request',r=>{if(/\/rest\/v1\/|\/api\/catalog/.test(r.url()))reads.push(r.url());});
 await rails.scrollIntoViewIfNeeded();await expect(rails).toHaveAttribute('data-badge-ready','true');
 expect(await rails.locator('.achievement-badge').count()).toBeGreaterThan(9);expect(reads).toHaveLength(0);
});

test('sharing formats crossfade stable layouts and smoothly reverse without stretching or extra reads',async({page},info)=>{
 await openLanding(page);
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Compartir/}).click();
 const stage=page.locator('[data-share-stage]');await stage.scrollIntoViewIfNeeded();
 const story=stage.locator('[class*="shareCanvas"]').first(),landscape=stage.locator('[class*="shareCanvas"]').nth(1);
 const storySize=await story.evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));
 const landscapeSize=await landscape.evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));
 const initial=await stage.evaluate(el=>el.getBoundingClientRect().height),requests=[];
 page.on('request',r=>{if(/\/rest\/v1\/|\/api\/catalog/.test(r.url()))requests.push(r.url());});
 await page.getByRole('button',{name:'Horizontal',exact:true}).click();
 await page.waitForTimeout(150);
 const intermediate=await stage.evaluate(el=>el.getBoundingClientRect().height);
 expect(intermediate).toBeLessThan(initial-1);expect(intermediate).toBeGreaterThan(landscapeSize.height+40+1);
 expect(await story.evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}))).toEqual(storySize);
 expect(await landscape.evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}))).toEqual(landscapeSize);
 await expect.poll(()=>stage.evaluate(el=>Math.abs(el.getBoundingClientRect().height-(el.querySelector('[data-share-preview]').offsetHeight+40)))).toBeLessThan(1);
 await page.getByRole('button',{name:'Story',exact:true}).click();await page.waitForTimeout(120);
 await page.getByRole('button',{name:'Horizontal',exact:true}).click();await page.waitForTimeout(120);
 await page.getByRole('button',{name:'Story',exact:true}).click();
 await expect.poll(()=>stage.evaluate(el=>Math.abs(el.getBoundingClientRect().height-(el.querySelector('[data-share-preview]').offsetHeight+40)))).toBeLessThan(1);
 await expect(stage.locator('[data-share-preview]')).toHaveCount(1);
 await expect(stage.locator('[data-share-preview]')).toContainText('Artista de Prueba');
 expect(requests).toHaveLength(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await stage.screenshot({path:`outputs/v11-1-10-share-${info.project.name}.png`,animations:'disabled'});
});
