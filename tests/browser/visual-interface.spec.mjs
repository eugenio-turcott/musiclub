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
  const actions=page.locator('#explorador-catalogo .release-card-actions');
  await expect(actions).toHaveCount(1);
  await expect(actions.getByText('A la cola',{exact:true})).toBeVisible();
  const bounds=await actions.locator(':scope > *').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top};}));
  expect(Math.abs(bounds[0].width-bounds[1].width)).toBeLessThan(2);
  expect(Math.abs(bounds[0].top-bounds[1].top)).toBeLessThan(2);
  await expect(actions.locator('svg')).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
