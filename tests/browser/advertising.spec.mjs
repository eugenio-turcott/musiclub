import {test, expect} from '@playwright/test';

const library = '**/acscdn.com/script/aclib.js';
async function mockAdvertising(page) {
  const requests = [];
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
  expect(await page.evaluate(()=>window.__bannerCalls)).toEqual([{zoneId:'12384990',renderIn:'#musiclub-home-adcash'}]);
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
  await expect(page.locator('#musiclub-home-adcash')).toHaveCount(0);
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
  await expect(page.locator('#musiclub-home-adcash')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize(original);
  await expect(page.getByText('Anuncio de prueba',{exact:true})).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(await page.evaluate(()=>window.__bannerCalls.length)).toBe(1);
});
