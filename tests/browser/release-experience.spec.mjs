import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {albums} from './fixtures.mjs';

test.beforeEach(async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});

test('disc boundaries and the stored palette reach the release without client image analysis',async({page},info)=>{
 await page.goto('/albumes/artista-de-prueba-azul');
 const discs=page.locator('[data-track-discs="2"]');
 await expect(discs.getByRole('heading',{name:/Disco 1/})).toBeVisible();
 await expect(discs.getByRole('heading',{name:/Disco 2/})).toBeVisible();
 await expect(discs.getByRole('region',{name:'Disco 2'})).toContainText('Tercera canción');
 const background=page.locator('[class*="atmosphere"]');
 await expect(background).toHaveCSS('--art-0','#2878c0');
 expect(await background.evaluate(el=>getComputedStyle(el).animationName)).not.toBe('none');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(background).toHaveCSS('animation-name','none');
 await page.screenshot({path:`outputs/v1230/release-${info.project.name}.png`,fullPage:false});
});

test('reusing matched track scores preserves a new edit and leaves all criteria unanswered',async({page},info)=>{
 await communityAccount(page);
 await page.route('**/rest/v1/reviews*',route=>route.fulfill({json:null}));
 await page.route('**/rest/v1/public_reviews*',route=>route.fulfill({json:[]}));
 await page.route('**/api/reviews/continuations*',route=>route.fulfill({json:{continuations:[{albumId:albums[0].id,matchedTracks:2,sourceTitle:'Azul (Sencillo)',trackRatings:{'track-0':9,'qa-second':8}}]}}));
 await page.goto('/albumes/artista-de-prueba-azul');
 await page.getByRole('button',{name:'Reseñar',exact:true}).click();
 const form=page.getByRole('group',{name:'Formulario de reseña',exact:true});
 await expect(form.getByRole('heading',{name:/Disco 2/})).toBeVisible();
 await form.getByRole('button',{name:'6',exact:true}).click();
 await form.getByRole('button',{name:/Usar mis calificaciones/}).click();
 const draftKey=`musiclub_draft_${albums[0].id}_00000000-0000-4000-8000-000000000081`;
 await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key))?.trackRatings,draftKey)).toEqual({'track-0':6,'qa-second':8});
 await form.getByRole('button',{name:'2. Criterios',exact:true}).click();
 await expect(form.getByRole('button',{name:/^Ir a .*sin calificar$/})).toHaveCount(7);
 await expect(form.getByRole('button',{name:/Siguiente/})).toBeDisabled();
 await form.screenshot({path:`outputs/v1230/review-${info.project.name}.png`});
});

test('the compact catalogue exposes covers in the first viewport and separates discovery sections',async({page},info)=>{
 await page.route('**/api/trending?type=weekly*',route=>route.fulfill({json:{success:true,monthLabel:'Tendencias de prueba',releases:[{...albums[0],slug:'artista-de-prueba-azul',trending_rank:1}]}}));
 await page.goto('/catalogo');
 await expect(page.getByRole('heading',{name:'Catálogo Musical',exact:true})).toBeVisible();
 const cover=page.getByRole('img',{name:'Azul',exact:true}).first();
 await expect(cover).toBeVisible();
 const box=await cover.boundingBox();
 expect(box.y).toBeLessThan(page.viewportSize().height-100);
 await expect(page.getByRole('heading',{name:'Explorador de Catálogo y Colección',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Todo el catálogo',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Explorador de Catálogo y Colección',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`outputs/v1230/catalogue-${info.project.name}.png`});
});

test('patch notes show a complete major version and its sections on one page',async({page})=>{
 await page.goto('/patch-notes');
 await expect(page.locator('.patch-version-page')).toHaveCount(1);
 await expect(page.locator('.patch-version-page')).toContainText('V.12.0.0');
 await expect(page.locator('.patch-version-details section')).not.toHaveCount(0);
 await page.getByRole('button',{name:'V11.x',exact:true}).click();
 await expect(page.locator('.patch-version-page')).toHaveCount(1);
 await expect(page.locator('.patch-version-page')).toContainText('V.11.0.0');
});

test('private continuation data requires an authenticated account',async({request})=>{
 const response=await request.get('/api/reviews/continuations?reviewer_email=someone@example.test');
 expect(response.status()).toBe(401);
 expect(await response.text()).not.toContain('trackRatings');
});
