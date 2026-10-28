import { test, expect } from '@playwright/test';

test('release details show score gauge, tall general criterion and a separate genre column without overflow', async ({page}) => {
  await page.goto('/albumes/artista-de-prueba-azul');
  await expect(page.getByRole('img',{name:/Calificación final: .* de 10/})).toBeVisible();
  const criteria=page.locator('.criteria-grid'),general=criteria.locator('.criteria-general');
  await expect(criteria.locator(':scope > div')).toHaveCount(7);
  const section=page.getByRole('complementary',{name:'Géneros del release'});
  await expect(section.getByRole('link',{name:'Pop',exact:true})).toHaveAttribute('href','/generos/pop');
  if(page.viewportSize().width>=1024){
    const g=await general.boundingBox(),other=await criteria.locator(':scope > div').first().boundingBox();
    expect(g.x).toBeGreaterThan(other.x+other.width);expect(g.height).toBeGreaterThan(other.height*1.5);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('catalogue cards split viewing and queue into equally sized vector controls', async ({page}) => {
  await page.goto('/catalogo?q=Azul');
  const actions=page.locator('[data-catalog-release] .release-card-actions');
  await expect(actions).toHaveCount(1);
  await expect(actions.getByText('A la cola',{exact:true})).toBeVisible();
  const bounds=await actions.locator(':scope > *').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top};}));
  expect(Math.abs(bounds[0].width-bounds[1].width)).toBeLessThan(2);
  expect(Math.abs(bounds[0].top-bounds[1].top)).toBeLessThan(2);
  await expect(actions.locator('svg')).toHaveCount(2);
  const icons=await actions.locator('[data-ui-icon]').evaluateAll(items=>items.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,color:getComputedStyle(el).color,parentColor:getComputedStyle(el.closest('button,a')).color})));
  expect(icons).toHaveLength(2);
  for(const icon of icons){expect(icon.width).toBe(24);expect(icon.height).toBe(24);expect(icon.color).toBe(icon.parentColor);}

  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('the release hero stacks top song and tracks, and places the queue directly after reviewing', async ({page}) => {
  await page.goto('/albumes/artista-de-prueba-azul');
  await expect(page.locator('.release-meta-stack > div')).toHaveCount(2);
  const boxes=await page.locator('.release-meta-stack > div').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};}));
  expect(Math.abs(boxes[0].x-boxes[1].x)).toBeLessThan(1);
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y);
  const row=page.locator('.release-detail-actions');
  await expect(row.getByRole('button',{name:'Reseñar',exact:true})).toBeVisible();
  const queue=row.getByRole('button',{name:'Escuchar más tarde: Azul',exact:true});
  await expect(queue).toBeVisible();
  const fontSizes=await row.locator('button').evaluateAll(items=>items.slice(0,2).map(el=>getComputedStyle(el).fontSize));
  expect(fontSizes[0]).toBe(fontSizes[1]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('home describes public and private pools, uses consistent contextual icons and a circular quick selector', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Pools públicos y privados',exact:true})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Temporada 1');
  await expect(page.locator('body')).not.toContainText('Recepción de Propuestas: Cerrada');
  const plates=page.locator('.home-feature-icon');
  await expect(plates).toHaveCount(6);
  const geometry=await plates.evaluateAll(items=>items.map(el=>{const icon=el.querySelector('[data-ui-icon]'),rect=icon.getBoundingClientRect();return {width:rect.width,height:rect.height,color:getComputedStyle(icon).color,plateColor:getComputedStyle(el).color};}));
  for(const item of geometry){expect(item.width).toBe(24);expect(item.height).toBe(24);expect(item.color).toBe(item.plateColor);}
  const quick=page.getByRole('button',{name:'Girar Selector Rápido',exact:true});
  await expect(quick.locator('[data-ui-icon="cycle"]')).toBeVisible();
  const color=await quick.evaluate(el=>({text:getComputedStyle(el).color,icon:getComputedStyle(el.querySelector('[data-ui-icon]')).color}));
  expect(color.icon).toBe(color.text);
  await quick.click();
  await expect(page.getByText('Sugerencia Aleatoria',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('plain action buttons have visible hover feedback', async ({page}) => {
  await page.goto('/');
  test.skip(!await page.evaluate(()=>matchMedia('(hover: hover)').matches),'Touch screens use pressed and keyboard-focus feedback.');
  const button=page.getByRole('button',{name:'Buscar',exact:true});
  const original=await button.evaluate(el=>getComputedStyle(el).filter);
  await button.hover();
  await expect.poll(()=>button.evaluate(el=>getComputedStyle(el).filter)).not.toBe(original);
});
