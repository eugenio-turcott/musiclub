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
 await expect(page.getByRole('img',{name:'Azul',exact:true}).first()).toBeVisible();
 const queries=[];page.on('request',r=>{if(/\/api\/catalog|\/rest\/v1\//.test(r.url()))queries.push(r.url());});
 await page.getByRole('button',{name:'Ver vinilo de Jazz',exact:true}).click();
 await expect(page.getByRole('button',{name:'Ver vinilo de Jazz',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('[aria-label="Tornamesa interactiva de Musiclub"] img[src*="/genres/colors/"]')).toHaveCount(1);
 await page.getByRole('button',{name:'Mostrar Azul en la tornamesa',exact:true}).click();
 await expect(page.getByRole('link',{name:'Ver release: Azul',exact:true})).toHaveAttribute('href','/albumes/artista-de-prueba-azul');
 await page.getByRole('button',{name:'Pausar animaciones',exact:true}).click();
 await expect(page.locator('[data-landing-experience]')).toHaveAttribute('data-motion-paused','true');
 expect(await page.locator('[aria-label="Tornamesa interactiva de Musiclub"] [class*="pressing"]').evaluate(el=>getComputedStyle(el).animationPlayState)).toBe('paused');
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
 const demo=page.locator('[data-review-demo]');await demo.getByRole('button',{name:'Ajustar General',exact:true}).click();
 const slider=demo.getByRole('slider',{name:'General de la demostración',exact:true});await slider.press('Home');await expect(slider).toHaveValue('1');
 await expect(demo.getByRole('button',{name:/^Ajustar/})).toHaveCount(7);
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Descubrir/}).click();
 await page.getByRole('button',{name:'Probar palanca de demostración',exact:true}).click();
 await expect(page.locator('[data-capsule-demo]')).toContainText('no cambia ningún Pool');
 const nav=page.getByRole('navigation',{name:'Demostraciones de Musiclub'});
 expect(await nav.evaluate(el=>getComputedStyle(el).position)).toBe('sticky');
 const bounds=await nav.boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeLessThan(220);
 await page.screenshot({path:`outputs/v11-landing-capsules-${info.project.name}.png`,animations:'disabled'});
 await nav.getByRole('link',{name:/Compartir/}).click();await page.getByRole('button',{name:'Horizontal',exact:true}).click();
 await expect(page.locator('[data-share-preview]')).toContainText('Artista de Prueba');
 await expect(page.locator('[data-share-preview]')).toContainText('Segunda canción');
 await expect(page.getByRole('link',{name:/Conoce Musiclub por dentro/})).toHaveAttribute('href','/guias');
 expect(writes).toHaveLength(0);expect(reads).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`outputs/v11-landing-share-${info.project.name}.png`,animations:'disabled'});
});

test('reduced motion keeps the complete landing readable and makes decorative scenes static',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 const art=page.locator('[aria-label="Tornamesa interactiva de Musiclub"] [class*="pressing"]');
 expect(await art.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.getByRole('navigation',{name:'Demostraciones de Musiclub'}).getByRole('link',{name:/Compartir/}).click();
 await expect(page.locator('[data-share-preview]')).toBeVisible();
 expect(await page.locator('[data-share-preview]').evaluate(el=>getComputedStyle(el.closest('article')).opacity)).toBe('1');
});
