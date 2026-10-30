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
  for(const icon of icons){expect(icon.width).toBe(20);expect(icon.height).toBe(20);expect(icon.color).toBe(icon.parentColor);}

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

test('previous Pools are closed archives and opening a room never downloads the full catalogue', async ({page}) => {
  const requests=[];
  page.on('request',request=>requests.push(new URL(request.url())));
  await page.goto('/pool');
  const closedCard=page.locator('[data-pool-card="closed"]').filter({has:page.getByRole('heading',{name:'El origen del club',exact:true})});
  await expect(page.locator('[data-pool-card="current"]')).toHaveCount(1);
  await expect(closedCard).toContainText('Cerrado');
  const previous=closedCard.getByRole('link',{name:'Ver historial',exact:true});
  await expect(previous).toBeVisible();
  await previous.click();
  const archive=page.getByRole('region',{name:'Pool cerrado',exact:true});
  await expect(archive.getByRole('heading',{name:'El origen del club',exact:true})).toBeVisible();
  await expect(archive).toContainText('Este Pool ya terminó.');
  await expect(page.getByRole('heading',{name:/Historial de Ganadores/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Depositar cápsula|Editar mi cápsula|Abrir propuestas|Ruleta del Pool/})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Azul',exact:true})).toBeVisible();
  expect(requests.some(url=>url.pathname==='/api/catalog')).toBe(false);
  for(const url of requests.filter(url=>url.pathname==='/rest/v1/albums')) expect(url.searchParams.get('id')).toMatch(/^in\.\(/);
  const selectedSeasonReads=requests.filter(url=>url.pathname==='/rest/v1/seasons' && url.searchParams.get('select')==='*');
  expect(selectedSeasonReads).toHaveLength(1);
  await page.getByRole('link',{name:'Pool actual',exact:true}).click();
  await expect(page.getByRole('region',{name:'Pool activo',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('inline labels center text with their icons instead of aligning on text baselines', async ({page}) => {
  await page.goto('/');
  const labels=page.locator('.interface-label').filter({visible:true});
  await expect(labels.first()).toBeVisible();
  const geometry=await labels.evaluateAll(items=>items.filter(el=>el.querySelector('svg') && el.querySelector('.interface-label-text')).map(el=>{
    const icon=el.querySelector('svg').getBoundingClientRect(),text=el.querySelector('.interface-label-text').getBoundingClientRect();
    return {delta:Math.abs((icon.top+icon.height/2)-(text.top+text.height/2))};
  }));
  expect(geometry.length).toBeGreaterThan(5);
  for(const item of geometry) expect(item.delta).toBeLessThan(1);
  await page.goto('/portadas');
  const photography=page.getByRole('button',{name:'Fotografía',exact:true});
  await expect(photography).toBeVisible();
  const delta=await photography.evaluate(el=>{
    const icon=el.querySelector('svg').getBoundingClientRect(),text=el.querySelector('.interface-label-text').getBoundingClientRect();
    return Math.abs((icon.top+icon.height/2)-(text.top+text.height/2));
  });
  expect(delta).toBeLessThan(1);
});


test('the release mood sits beside the final score and uses a face for thoughtful reviews',async({page})=>{
 await page.goto('/albumes/artista-de-prueba-azul');
 const mood=page.locator('[data-community-mood]');
 await expect(mood).toContainText('Intrigado / Reflexivo');
 await expect(mood.locator('[data-mood-icon="intrigado"]')).toBeVisible();
 const left=await page.getByRole('img',{name:/Calificación final:/}).boundingBox(),right=await mood.boundingBox();
 expect(right.x).toBeGreaterThan(left.x);expect(Math.abs(right.y-left.y)).toBeLessThan(70);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('both review surfaces show seven icon criteria and collapsed ratings ordered by score and original tracklist',async({page})=>{
 for(const path of ['/reviews','/albumes/artista-de-prueba-azul']){
  await page.goto(path);
  const criteria=page.locator('.review-criteria').first();
  await expect(criteria.locator('.review-criterion')).toHaveCount(7);
  await expect(criteria.locator('[data-ui-icon="sliders"]')).toBeVisible();
  await expect(criteria).not.toContainText('Prod.');
  const details=page.locator('details.review-track-ratings').first();
  await expect(details).not.toHaveAttribute('open');
  await details.locator('summary').click();
  await expect(details.locator('li')).toHaveCount(3);
  const rows=await details.locator('li').allTextContents();
  expect(rows[0]).toContain('Segunda canción');expect(rows[1]).toContain('Canción de prueba');expect(rows[2]).toContain('Tercera canción');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('a release with no reviews uses a question inside a circle for its unknown mood',async({page})=>{
 await page.goto('/albumes/artista-proximo-estreno-oficial');
 await expect(page.locator('[data-community-mood] [data-mood-icon="unknown"]')).toBeVisible();
 await expect(page.locator('[data-community-mood]')).toContainText('Aún sin opiniones');
});

test('expanding track ratings does not stretch or redistribute a neighboring community review',async({page})=>{
 await page.goto('/albumes/artista-de-prueba-azul');
 const neighbor=page.locator('.community-review-card').nth(1);
 await page.evaluate(()=>document.fonts.ready.then(()=>true));
 const layout=()=>neighbor.evaluate(el=>({height:el.getBoundingClientRect().height,criteriaOffset:el.querySelector('.review-criteria').getBoundingClientRect().y-el.getBoundingClientRect().y}));
 const before=await layout();
 await page.locator('.community-review-card').first().locator('details summary').click();
 const after=await layout();
 expect(Math.abs(after.height-before.height)).toBeLessThan(1);
 expect(Math.abs(after.criteriaOffset-before.criteriaOffset)).toBeLessThan(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('community reviews preserve written text and explicitly identify ratings without a written comment',async({page},testInfo)=>{
 await page.goto('/albumes/artista-de-prueba-azul');
 const cards=page.locator('.community-review-card');
 await expect(cards).toHaveCount(2);
 await expect(cards.locator('[data-review-comment="written"]')).toHaveCount(2);
 await expect(cards).toContainText(['Una reseña de prueba.','Reseña de la variante limpia.']);
 await page.goto('/albumes/artista-de-prueba-verde');
 await expect(page.locator('.community-review-card')).toHaveCount(1);
 await expect(page.locator('[data-review-comment="empty"]')).toHaveText('Este miembro no añadió un comentario escrito.');
 await expect(page.locator('.community-review-card .review-criteria')).toBeVisible();
});

test('catalogue Top del Club excludes a single perfect review and home mood badges contain only artwork',async({page})=>{
 await page.goto('/catalogo');
 const top=page.locator('[data-catalog-top]');
 await expect(top).toContainText('Azul');
 await expect(top).not.toContainText('Verde');
 await page.goto('/');
 const moods=page.locator('[data-community-mood-icon]');
 await expect(moods).toHaveCount(3);
 for(const badge of await moods.all()){
   await expect(badge.locator('[data-mood-icon]')).toBeVisible();
   expect((await badge.textContent()).trim()).toBe('');
   await expect(badge).toHaveAttribute('aria-label',/^Estado de ánimo:/);
 }
});

test('genre and information pages share the application navigation and adapt their layout',async({page})=>{
 for(const [path,title] of [['/generos/pop','Pop'],['/sobre-musiclub','Un club para escuchar y compartir'],['/contacto','Hablemos de Musiclub'],['/guias','Escucha, opina y descubre']]){
  await page.goto(path);await expect(page.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Pool Musical',exact:true}).filter({visible:true})).toHaveCount(page.viewportSize().width>=1280?1:0);
  const language=page.locator('footer').getByRole('button',{name:'Cambiar idioma: Español',exact:true});
  await expect(language.locator('[data-ui-icon="globe"]')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(path==='/generos/pop' && page.viewportSize().width>=640){
   const vinyl=await page.getByRole('button',{name:'Ampliar vinilo de Pop',exact:true}).boundingBox(),titleBox=await page.getByRole('heading',{level:1,name:'Pop',exact:true}).boundingBox();
   expect(vinyl.x+vinyl.width).toBeLessThan(titleBox.x);
  }
 }
});

test('social links use the larger logo, concise heading and complete repository and legal links',async({page})=>{
 await page.goto('/redes');await expect(page.getByRole('heading',{level:1,name:'Redes Sociales de Musiclub',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:/GitHub: repositorio público/})).toHaveAttribute('href','https://github.com/eugenio-turcott/musiclub');
 await expect(page.getByRole('link',{name:'¿Sugerencias? musiclub.org@gmail.com',exact:true})).toBeVisible();
 const legal=page.getByRole('navigation',{name:'Información legal',exact:true});await expect(legal.getByRole('link',{name:'Términos',exact:true})).toHaveAttribute('href','/terms');
 await expect(page.locator('body')).not.toContainText('RESEÑAS, DISCOS Y GENTE');
 await expect(page.locator('body')).not.toContainText('Hecho con música, para compartir música.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
