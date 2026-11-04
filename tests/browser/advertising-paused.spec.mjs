import {test,expect} from '@playwright/test';
import policy from '../../src/utils/advertisingPolicy.cjs';
import placements from '../../src/utils/adsterraPlacements.cjs';

test.skip(policy.ADVERTISING_ENABLED,'Pause checks apply only while site advertising is disabled.');

test('the global pause overrides saved acceptance and regional defaults without leaving ad spaces',async({page},testInfo)=>{
  const requests=[];
  await page.addInitScript(()=>localStorage.setItem('musiclub_advertising_v1',JSON.stringify({choice:'accepted',savedAt:Date.now()})));
  await page.route('**/api/advertising/policy',route=>{requests.push('policy');return route.fulfill({json:{mode:'automatic'}});});
  await page.route(/https:\/\/[^/]*(?:bicea\.org|profitableratecpmnetwork\.com|acscdn\.com)\//,route=>{requests.push(route.request().url());return route.abort();});
  for(const path of ['/','/catalogo','/albumes/artista-de-prueba-azul','/reviews','/leaderboard','/portadas','/generos/pop','/privacy']) {
    await page.goto(path);
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.locator('[data-advertising-slot], [data-advertising-rail], [data-adsterra-zone]')).toHaveCount(0);
    await expect(page.getByRole('region',{name:'Publicidad',exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Preferencias de publicidad',exact:true})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await expect(page.getByText('La publicidad está temporalmente desactivada en todo Musiclub.',{exact:false}).first()).toBeVisible();
  await page.goto('/catalogo');
  await page.reload();
  await expect(page.getByRole('heading',{name:'Catálogo Musical',exact:true})).toBeVisible();
  await expect(page.locator('[data-adsterra-zone]')).toHaveCount(0);
  expect(requests).toEqual([]);
  await page.screenshot({path:`outputs/advertising-paused-${testInfo.project.name}.png`});
});

test('paused banner endpoints cannot serve advertising code on either host',async({request})=>{
  const policyResponse=await request.get('/api/advertising/policy?country=MX',{headers:{'cf-ipcountry':'MX'}});
  expect(await policyResponse.json()).toEqual({mode:'disabled'});
  expect(policyResponse.headers()['cache-control']).toContain('no-store');
  for(const banner of Object.values(placements.BANNERS)) {
    for(const host of ['127.0.0.1:3101','ads.localhost:3101']) {
      // Node's request client does not resolve *.localhost like the browser.
      const response=await request.get(`/api/advertising/banner/${banner.id}`,{headers:{host}});
      expect(response.status()).toBe(404);
      expect(await response.text()).not.toMatch(/script|iframe|atOptions/i);
    }
  }
});
