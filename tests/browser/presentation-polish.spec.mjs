import {test,expect} from '@playwright/test';
import {albums} from './fixtures.mjs';
test.beforeEach(async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});
test('a new release gets its palette on the first visit without blocking its content',async({page})=>{
 let reads=0;
 await page.route('**/api/artwork-palette?*',route=>{reads++;return route.fulfill({json:{colors:['#ce4f75','#428ac1'],image_url:albums[1].image_url}});});
 await page.goto('/albumes/artista-de-prueba-rojo');
 await expect(page.getByRole('heading',{name:'Rojo',exact:true})).toBeVisible();
 await expect(page.locator('[class*="atmosphere"]')).toHaveCSS('--art-0','#ce4f75');
 expect(reads).toBe(1);
 await page.goto('/artista/artista-color');
 await expect(page.getByRole('heading',{name:'Artista Color',exact:true})).toBeVisible();
 await expect(page.locator('[class*="atmosphere"]')).toHaveCSS('--art-0','#ce4f75');
 expect(reads).toBe(2);
});
test('the release magnifier opens a contained image and restores focus on Escape',async({page},info)=>{
 await page.goto('/albumes/artista-de-prueba-azul');
 const trigger=page.getByRole('button',{name:'Ampliar portada de Azul'});await trigger.click();
 const dialog=page.getByRole('dialog',{name:'Portada de Azul'});await expect(dialog).toBeVisible();
 const image=await dialog.getByRole('img',{name:'Azul',exact:true}).boundingBox();
 expect(image.x).toBeGreaterThanOrEqual(0);expect(image.width).toBeLessThanOrEqual(page.viewportSize().width);expect(image.y+image.height).toBeLessThan(page.viewportSize().height);
 await page.screenshot({path:`outputs/v1231/cover-lightbox-${info.project.name}.png`});
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
});
test('community headers are compact and the artwork gallery gives the cover the largest column',async({page},info)=>{
 for(const path of ['/reviews','/leaderboard','/portadas']){
  await page.goto(path);const header=page.locator('[data-section-header]');await expect(header).toBeVisible();
  expect((await header.boundingBox()).height).toBeLessThan(250);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`outputs/v1231/${path.slice(1)}-${info.project.name}.png`});
 }
 const art=await page.locator('.cover-art-stage').boundingBox(),panel=await page.locator('.cover-rating-panel').boundingBox();
 if(info.project.name==='desktop')expect(art.width).toBeGreaterThan(panel.width*1.5);
});
test('queue actions have a warm yellow focus and hover across release and catalogue views',async({page},info)=>{
 for(const path of ['/albumes/artista-de-prueba-azul','/catalogo?q=Azul']){
  await page.goto(path);const button=page.locator('.musiclub-queue-button').first();await expect(button).toBeEnabled();
  await button.focus();await expect(button).toHaveCSS('color','rgb(38, 29, 8)');
  if(info.project.name==='desktop'){await button.hover();await expect(button).toHaveCSS('color','rgb(38, 29, 8)');}
  expect(await button.evaluate(el=>getComputedStyle(el,'::before').backgroundImage)).toContain('rgb(255, 199, 67)');
 }
});
test('artist artwork is square and source diagnostics stay outside the public page',async({page},info)=>{
 await page.goto('/artista/artista-de-prueba');
 const portrait=await page.locator('[class*="portrait"]').boundingBox();expect(Math.abs(portrait.width-portrait.height)).toBeLessThan(2);
 await expect(page.getByText('Coincidencias verificadas entre',{exact:false})).toHaveCount(0);
 await expect(page.getByText('Sólo Apple sin verificar',{exact:true})).toHaveCount(0);
 await page.screenshot({path:`outputs/v1231/artist-${info.project.name}.png`});
});
test('turntable score stays beside its star with a visible gap at every responsive width',async({page},info)=>{
 await page.goto('/');
 const deck=page.locator('[data-turntable-deck]'),score=deck.locator('[aria-label^="Calificación del club"]');
 await expect(score).toBeVisible();
 for(const width of [320,360,376,390,600,768,1280]){
  await page.setViewportSize({width,height:1000});
  const measurement=()=>score.evaluate(el=>{const star=el.querySelector(':scope > svg')?.getBoundingClientRect(),number=el.querySelector('strong')?.getBoundingClientRect();return star&&number?{gap:number.x-star.right,line:Math.abs(number.y-star.y)}:null;});
  await expect.poll(async()=>(await measurement())?.gap??-1,{message:`gap at ${width}px`}).toBeGreaterThanOrEqual(6);
  expect((await measurement()).line,`same line at ${width}px`).toBeLessThan(13);
  const cover=await deck.locator('[data-turntable-display]').boundingBox(),mood=await deck.locator('[role="img"]').boundingBox();
  expect(mood.x+mood.width,`mood inside artwork margin at ${width}px`).toBeLessThanOrEqual(cover.x+cover.width+1);
 }
 await page.setViewportSize({width:376,height:858});await page.screenshot({path:`outputs/v1231/turntable-${info.project.name}.png`,fullPage:false});
});

test('native image decoding retains the background when the palette service is temporarily unavailable',async({page})=>{
 await page.route('**/api/artwork-palette?*',route=>route.fulfill({status:503,json:{error:'Temporarily unavailable'}}));
 await page.goto('/albumes/artista-de-prueba-rojo');
 await expect(page.locator('[class*="atmosphere"]')).toHaveCount(1);
 expect(await page.locator('[class*="atmosphere"]').evaluate(el=>getComputedStyle(el).getPropertyValue('--art-0'))).toMatch(/^#[a-f0-9]{6}$/);
 await expect(page.getByRole('heading',{name:'Rojo',exact:true})).toBeVisible();
});

test('cover atmosphere fills the page while the gold banner keeps an opaque backing',async({page})=>{
 for(const path of ['/albumes/artista-de-prueba-azul','/artista/artista-de-prueba']){
  await page.goto(path);const layer=page.locator('[data-artwork-boundary]');await expect(layer).toBeAttached();
  await expect(layer).toHaveCSS('clip-path','none');
  const rect=await layer.boundingBox();expect(rect.y).toBe(0);expect(rect.height).toBeGreaterThanOrEqual(page.viewportSize().height);
  await expect(page.locator('.grammy-announcement')).toHaveCSS('background-color','rgb(0, 0, 0)');
  await expect(page.locator('.musiclub-site-header')).toHaveCSS('background-color','rgb(12, 12, 24)');
  await page.evaluate(()=>window.scrollBy(0,250));await expect(layer).toHaveCSS('clip-path','none');
 }
});
