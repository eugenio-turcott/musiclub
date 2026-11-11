import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

test('navigation keeps one frame across routes, independent of their content containers',async({page},info)=>{
  test.setTimeout(120000);
  await communityAccount(page);
  const mobile=info.project.name==='mobile';
  await page.setViewportSize({width:mobile?390:1440,height:900});
  let reference;
  for(const path of ['/','/catalogo','/pool','/profile','/settings','/faq','/redes']){
    await page.goto(path);
    const header=page.locator('[data-site-navigation]');
    await expect(header).toHaveCount(1);
    await expect(header).toBeVisible();
    const geometry=await header.locator('.musiclub-navbar-frame').evaluate(el=>{const b=el.getBoundingClientRect();return{x:b.x,width:b.width,height:b.height};});
    if(reference)expect(geometry).toEqual(reference);else reference=geometry;
    await page.evaluate(()=>window.scrollTo(0,250));
    await expect.poll(()=>header.evaluate(el=>el.getBoundingClientRect().top)).toBe(0);
    await page.evaluate(()=>window.scrollTo(0,0));
    await expect(header.locator('[data-musiclub-vinyl]')).toHaveCount(0);
    if(!mobile)expect(await header.locator('[data-primary-navigation]').evaluate(el=>el.getBoundingClientRect().width)).toBe(640);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  const retained=await page.locator('[data-site-navigation]').elementHandle();
  if(mobile)await page.getByRole('button',{name:'Abrir menú de navegación',exact:true}).click();
  await page.locator('[data-site-navigation]').getByRole('link',{name:mobile?'Catálogo Todos los releases':'Catálogo',exact:true}).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  expect(await retained.evaluate(element=>element.isConnected)).toBe(true);
  for(const width of mobile?[320,375,768]:[1024,1280,1920]){
    await page.setViewportSize({width,height:900});
    const frame=page.locator('.musiclub-navbar-frame');
    expect(await frame.evaluate(el=>el.getBoundingClientRect().width)).toBe(Math.min(width,1280));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width<1280){
      await page.getByRole('button',{name:'Abrir menú de navegación',exact:true}).click();
      await expect(page.getByRole('button',{name:'Cerrar menú de navegación',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Cerrar menú de navegación',exact:true}).press('Escape');
    }
  }
  await page.screenshot({path:`outputs/v11-1-14-navigation-${info.project.name}.png`});
});
