import {test, expect} from '@playwright/test';

const library = '**/acscdn.com/script/aclib.js';
async function mockAdvertising(page, mode='consent') {
  const requests = [];
  requests.adsterra=[];
  // No real third-party advertising is requested or clicked in automated tests.
  await page.route('**/bicea.org/22/*',route=>{requests.adsterra.push(route.request().url());return route.fulfill({contentType:'application/javascript',body:`
    'use strict';
    const options=window.atOptions;
    delete window.atOptions;
    // Reproduce the vendor writing into its own about:blank child frame.
    const child=document.createElement('iframe');child.style.cssText='border:0;width:100%;height:100%';document.body.append(child);
    const box=child.contentWindow.document.createElement('div');box.textContent='Banner Adsterra de prueba';
    box.style.cssText='box-sizing:border-box;width:'+options.width+'px;height:'+options.height+'px;background:#261b38;color:#f9a8d4;display:grid;place-items:center;font:14px sans-serif;border:1px solid #f093fb44';child.contentWindow.document.body.style.margin='0';child.contentWindow.document.body.append(box);
    try{window.parent.document.body.dataset.advertisingEscaped='true';throw new Error('Banner can access Musiclub');}catch(error){if(error.message==='Banner can access Musiclub')throw error;}`});});
  await page.route('**/pl31167703.profitableratecpmnetwork.com/**',route=>{requests.adsterra.push(route.request().url());return route.fulfill({contentType:'application/javascript',body:`
    document.getElementById('container-0b1f8e88620f4f682b83e40675c39376').innerHTML='<div style="padding:30px;background:#261b38;color:#f9a8d4;text-align:center">Anuncio nativo de prueba</div>';`});});
  await page.route('**/pl31167705.profitableratecpmnetwork.com/**',route=>{requests.adsterra.push(route.request().url());return route.fulfill({contentType:'application/javascript',body:`window.__socialBarLoads=(window.__socialBarLoads||0)+1;`});});
  await page.route('**/api/advertising/policy', route=>route.fulfill({json:{mode}}));
  await page.route(library, async route => {
    requests.push(route.request().url());
    await route.fulfill({contentType:'application/javascript',body:`
      window.__bannerCalls=[];
      window.aclib={runBanner(options){
        window.__bannerCalls.push(options);
        const target=document.querySelector(options.renderIn);
        if(target){const ad=document.createElement('div');ad.textContent='Anuncio de prueba';target.append(ad);}
      }};`});
  });
  return requests;
}

test('advertising never loads before consent or after rejection, and can be enabled from the footer', async ({page}, testInfo) => {
  const requests = await mockAdvertising(page);
  await page.goto('/');
  const ad = page.getByRole('region',{name:'Publicidad',exact:true});
  await expect(ad.getByRole('button',{name:'Permitir anuncios',exact:true})).toBeVisible();
  expect(requests).toHaveLength(0);
  await ad.screenshot({path:`outputs/adcash-choice-${testInfo.project.name}.png`});
  await ad.getByRole('button',{name:'Ahora no',exact:true}).click();
  await expect(ad.getByText('Un banner para apoyar al club')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button',{name:'Preferencias de publicidad',exact:true})).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByRole('button',{name:'Preferencias de publicidad',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Tu elección de publicidad',exact:true});
  await expect(dialog).toContainText('Rechazada');
  const bounds=await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  await page.screenshot({path:`outputs/adcash-preferences-${testInfo.project.name}.png`});
  await dialog.getByRole('button',{name:'Permitir anuncios',exact:true}).click();
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(await page.evaluate(()=>window.__bannerCalls)).toEqual([{zoneId:'12384990',renderIn:'#musiclub-display-adcash'}]);
});

test('Adsterra renders after consuming its configuration, uses fitting banners and excludes floating ads',async({page,context},testInfo)=>{
  const requests=await mockAdvertising(page,'automatic');
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('/catalogo');
  const topBanner=page.getByRole('region',{name:'Banner de Adsterra',exact:true});
  await expect(topBanner.locator('iframe')).toBeVisible();
  const topBounds=await topBanner.boundingBox();
  expect(topBounds.y).toBeGreaterThan(0);
  expect(topBounds.y+topBounds.height).toBeLessThan(page.viewportSize().height);
  const ad=page.getByRole('region',{name:'Publicidad de Adsterra',exact:true});
  await ad.scrollIntoViewIfNeeded();
  await expect(ad.getByText('Anuncio nativo de prueba',{exact:true})).toBeVisible();
  for(const frame of [...await topBanner.locator('iframe').all(),...await ad.locator('iframe').all()]) {
    await frame.scrollIntoViewIfNeeded();
    await expect(frame.contentFrame().frameLocator('iframe').getByText('Banner Adsterra de prueba',{exact:true})).toBeVisible();
    expect(await frame.getAttribute('sandbox')).not.toContain('allow-top-navigation');
    expect(new URL(await frame.getAttribute('src')).origin).not.toBe(new URL(page.url()).origin);
    const bounds=await frame.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  }
  const original=page.viewportSize();
  const zones=page.locator('[data-adsterra-zone]');
  const selected=await zones.evaluateAll(items=>items.map(item=>item.dataset.adsterraZone));
  expect(new Set(selected).size).toBe(selected.length);
  const before=requests.adsterra.length;
  await page.setViewportSize({width:320,height:800});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize(original);
  await expect(ad.getByText('Anuncio nativo de prueba',{exact:true})).toBeVisible();
  expect(await zones.evaluateAll(items=>items.map(item=>item.dataset.adsterraZone))).toEqual(selected);
  expect(requests.adsterra.length).toBe(before);
  await ad.screenshot({path:`outputs/adsterra-responsive-${testInfo.project.name}.png`});
  expect(pageErrors.filter(message=>message.includes('atOptions'))).toEqual([]);
  await expect(page.locator('body[data-advertising-escaped]')).toHaveCount(0);
  expect(requests.adsterra.some(url=>url.includes('pl31167705'))).toBe(false);
  await expect(page.locator('#musiclub-adsterra-social')).toHaveCount(0);
  expect(context.pages()).toHaveLength(1);
  expect(selected).not.toContain('31067203');
  expect(selected).not.toContain('31067205');
  await page.getByRole('contentinfo').getByRole('link',{name:'Privacidad',exact:true}).last().click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator('#musiclub-adsterra-social, #musiclub-adsterra-native')).toHaveCount(0);
  await expect(page.getByRole('region',{name:'Publicidad de Adsterra',exact:true})).toHaveCount(0);
});

test('home and catalog show one compact banner in the first screen, outside the sticky navigation',async({page},testInfo)=>{
  await mockAdvertising(page,'automatic');
  for(const path of ['/','/catalogo']) {
    await page.goto(path);
    const banner=page.getByRole('region',{name:'Banner de Adsterra',exact:true});
    await expect(banner.locator('iframe')).toBeVisible();
    await expect(page.getByRole('region',{name:'Publicidad de Adsterra',exact:true})).toHaveCount(1);
    await expect(banner.locator('iframe').contentFrame().frameLocator('iframe').getByText('Banner Adsterra de prueba',{exact:true})).toBeVisible();
    const adBounds=await banner.boundingBox();
    const navBounds=await page.locator('header').first().boundingBox();
    expect(adBounds.y).toBeGreaterThanOrEqual(navBounds.y+navBounds.height);
    expect(adBounds.y+adBounds.height).toBeLessThan(page.viewportSize().height);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`outputs/banner-first-screen-${path==='/'?'home':'catalog'}-${testInfo.project.name}.png`});
  }
});

test('Adsterra remains off before permission and after rejection',async({page})=>{
  const requests=await mockAdvertising(page);
  await page.goto('/');
  await page.getByRole('region',{name:'Publicidad',exact:true}).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Ahora no',exact:true})).toBeVisible();
  expect(requests.adsterra).toHaveLength(0);
  await page.getByRole('button',{name:'Ahora no',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Preferencias de publicidad',exact:true})).toBeVisible();
  await expect(page.locator('[data-adsterra-zone],#musiclub-adsterra-social')).toHaveCount(0);
  expect(requests.adsterra).toHaveLength(0);
});

test('banner documents expose only fixed public placements and reject arbitrary code',async({request})=>{
  const valid=await request.get('/api/advertising/banner/32010329');
  expect(valid.status()).toBe(200);
  expect(valid.headers()['content-type']).toContain('text/html');
  expect(valid.headers()['cache-control']).toContain('no-store');
  expect(valid.headers()['x-robots-tag']).toContain('noindex');
  expect(await valid.text()).toContain('https://bicea.org/22/6dee051ac3e169e1b746a4c2e8cc927f');
  expect((await request.get('/api/advertising/banner/31067203')).status()).toBe(404);
  expect((await request.get('/api/advertising/banner/arbitrary')).status()).toBe(404);
  if(process.env.PLAYWRIGHT_CLOUDFLARE==='1') {
    const headers={host:'ads.localhost:3101'};
    const isolated=await request.get('/api/advertising/banner/32010329',{headers});
    expect(isolated.status()).toBe(200);
    expect(isolated.headers()['content-security-policy']).toContain('http://127.0.0.1:3101');
    for(const path of ['/','/profile','/api/advertising/policy']) {
      expect((await request.get(path,{headers})).status()).toBe(404);
    }
  }
});

test('withdrawing advertising consent stops the loaded library after reloading and keeps private pages free of ads', async ({page}) => {
  const requests=await mockAdvertising(page);
  await page.goto('/');
  await page.getByRole('region',{name:'Publicidad',exact:true}).getByRole('button',{name:'Permitir anuncios',exact:true}).click();
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Preferencias de publicidad',exact:true}).click();
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('dialog').getByRole('button',{name:'Rechazar anuncios',exact:true}).click(),
  ]);
  await expect(page.locator('#musiclub-adcash-library')).toHaveCount(0);
  expect(requests).toHaveLength(1);
  await page.goto('/settings');
  await expect(page.locator('#musiclub-display-adcash')).toHaveCount(0);
  await expect(page.locator('#musiclub-adcash-library')).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test('a stale advertising permission requires a fresh choice', async ({page}) => {
  const requests=await mockAdvertising(page);
  await page.addInitScript(()=>localStorage.setItem('musiclub_advertising_v1',JSON.stringify({choice:'accepted',savedAt:Date.now()-181*86400000})));
  await page.goto('/');
  await expect(page.getByRole('region',{name:'Publicidad',exact:true}).getByRole('button',{name:'Permitir anuncios',exact:true})).toBeVisible();
  expect(requests).toHaveLength(0);
});

test('a banner fits narrow screens without resizing ads or repeating an impression on resize', async ({page}) => {
  const requests=await mockAdvertising(page);
  await page.goto('/');
  await page.getByRole('region',{name:'Publicidad',exact:true}).getByRole('button',{name:'Permitir anuncios',exact:true}).click();
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  const original=page.viewportSize();
  await page.setViewportSize({width:320,height:800});
  await expect(page.locator('#musiclub-display-adcash')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize(original);
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(await page.evaluate(()=>window.__bannerCalls.length)).toBe(1);
});

test('regional automatic delivery shows a banner without an acceptance step and survives client navigation', async({page},testInfo)=>{
  const requests=await mockAdvertising(page,'automatic');
  await page.goto('/');
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  await expect(page.getByText('Un banner para apoyar al club',{exact:true})).toHaveCount(0);
  await page.getByRole('region',{name:'Publicidad',exact:true}).screenshot({path:`outputs/adcash-automatic-${testInfo.project.name}.png`});
  await page.locator('a[href="/catalogo"]').filter({visible:true}).first().click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(await page.evaluate(()=>window.__bannerCalls.length)).toBe(2);
  await expect(page.locator('#musiclub-display-adcash')).toHaveCount(1);
});

test('public catalog, release, artist, genre and review pages each have one display placement', async({page})=>{
  const requests=await mockAdvertising(page,'automatic');
  for(const path of ['/catalogo','/albumes/artista-de-prueba-azul','/artista/artista-de-prueba','/generos/pop','/reviews','/leaderboard','/portadas']) {
    await page.goto(path);
    await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
    await expect(page.locator('#musiclub-display-adcash')).toHaveCount(1);
    expect(await page.evaluate(()=>window.__bannerCalls.length)).toBe(1);
  }
  expect(requests).toHaveLength(7);
});

test('automatic delivery respects an earlier rejection without requesting advertising', async({page})=>{
  const requests=await mockAdvertising(page,'automatic');
  await page.addInitScript(()=>localStorage.setItem('musiclub_advertising_v1',JSON.stringify({choice:'rejected',savedAt:Date.now()})));
  await page.goto('/');
  await page.getByRole('button',{name:'Preferencias de publicidad',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Rechazada');
  await expect(page.locator('#musiclub-adcash-library')).toHaveCount(0);
  expect(requests).toHaveLength(0);
});

test('a browser privacy signal overrides automatic delivery and a previous acceptance', async({page})=>{
  const requests=await mockAdvertising(page,'automatic');
  await page.addInitScript(()=>{
    localStorage.setItem('musiclub_advertising_v1',JSON.stringify({choice:'accepted',savedAt:Date.now()}));
    Object.defineProperty(navigator,'globalPrivacyControl',{value:true,configurable:true});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Preferencias de publicidad',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Desactivada por el navegador');
  await expect(page.getByRole('dialog').getByRole('button',{name:'Permitir anuncios',exact:true})).toBeDisabled();
  await expect(page.locator('#musiclub-adcash-library')).toHaveCount(0);
  expect(requests).toHaveLength(0);
});

test('private, legal and error pages do not add an advertising placement', async({page})=>{
  const requests=await mockAdvertising(page,'automatic');
  for(const path of ['/settings','/profile','/privacy','/terms','/contacto','/this-page-does-not-exist']) {
    await page.goto(path);
    if(path === '/profile') await expect(page.getByRole('heading',{name:'Acceso a Perfil',exact:true})).toBeVisible();
    else await expect(page.getByRole('button',{name:'Preferencias de publicidad',exact:true})).toBeVisible();
    await expect(page.getByRole('region',{name:'Publicidad',exact:true})).toHaveCount(0);
  }
  expect(requests).toHaveLength(0);
});

test('client navigation to an ad-free page removes a previously loaded advertising library', async({page})=>{
  const requests=await mockAdvertising(page,'automatic');
  await page.goto('/');
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('contentinfo').getByRole('link',{name:'Privacidad',exact:true}).click(),
  ]);
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('button',{name:'Preferencias de publicidad',exact:true})).toBeVisible();
  await expect(page.locator('#musiclub-adcash-library')).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test('regional policy is private, uncached and cannot be set through a country header or URL', async({request})=>{
  const response=await request.get('/api/advertising/policy');
  expect(response.ok()).toBe(true);
  expect(response.headers()['cache-control']).toContain('no-store');
  const value=await response.json();
  expect(['automatic','consent']).toContain(value.mode);
  expect(Object.keys(value)).toEqual(['mode']);
  const spoof=await request.get('/api/advertising/policy?country=MX',{headers:{'cf-ipcountry':'MX'}});
  expect(await spoof.json()).toEqual(value);
});
