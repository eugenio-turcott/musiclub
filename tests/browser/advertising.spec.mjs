import {test, expect} from '@playwright/test';

const library = '**/acscdn.com/script/aclib.js';
async function mockAdvertising(page, mode='consent') {
  const requests = [];
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
