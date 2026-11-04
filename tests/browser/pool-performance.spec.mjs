import {test,expect} from '@playwright/test';

import {openFixturePool} from './pool-fixture.mjs';

test('the lever makes one draw, saves once and distinguishes a failed email from a failed winner',async({page},testInfo)=>{
  const fixture=await openFixturePool(page,{mailFailure:true});
  const machine=page.getByRole('region',{name:'Máquina Musical del Pool'});
  await expect(machine).toBeVisible();
  await machine.screenshot({animations:'disabled',path:`outputs/roulette-v1060-${testInfo.project.name}.png`});
  await page.getByRole('button',{name:'Tirar palanca',exact:true}).first().click();
  await expect(page.locator('[data-draw-confirmed]')).toBeVisible();
  await expect(page.getByRole('alert').filter({hasText:'Ganador guardado.'})).toContainText('Ganador guardado. Correo pendiente:');
  expect(fixture.counts().draws).toBe(1);expect(fixture.counts().mail).toBe(1);
  await expect(page.getByRole('button',{name:'Tirar palanca',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('an idle Pool performs no periodic reads and repeated focus events reuse its snapshot',async({page})=>{
  const fixture=await openFixturePool(page);
  await page.clock.install();const start=fixture.counts().reads;
  await page.clock.fastForward(45000);
  for(let i=0;i<3;i++)await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  expect(fixture.counts().reads).toBe(start);
  await page.clock.fastForward(45000);
  expect(fixture.counts().reads).toBe(start);
});

test('a server-rendered release does not fetch the same catalogue again for an anonymous visitor',async({page})=>{
  const requests=[];page.on('request',request=>{if(request.url().includes('/api/catalog?slug='))requests.push(request.url());});
  await page.goto('/albumes/artista-de-prueba-azul');
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
  expect(requests).toEqual([]);
});
