import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {ANNUAL_SELECTION,ANNUAL_SOURCES} from '../../src/server/annual2026Selection.mjs';
import covers from '../../src/server/annual2026Covers.json' with {type:'json'};
import {buildPersonalAnnual,buildClubAnnual} from '../../src/utils/annualRecap.mjs';
import fs from 'node:fs/promises';
import {contrastRatio} from '../../src/utils/annualIconContrast.mjs';

async function expectReadableIcons(scope){
  const pairs=await scope.locator('.ui-icon[data-ui-icon]').evaluateAll(icons=>icons.map(icon=>{
    const hex=value=>'#'+value.match(/[\d.]+/g).slice(0,3).map(v=>Math.round(Number(v)).toString(16).padStart(2,'0')).join('');
    let parent=icon.parentElement,background='#ffffff';
    while(parent){const bg=getComputedStyle(parent).backgroundColor,n=bg.match(/[\d.]+/g)?.map(Number);if(n&&(n.length===3||n[3]>.99)){background=hex(bg);break;}parent=parent.parentElement;}
    return{name:icon.dataset.uiIcon,ink:hex(getComputedStyle(icon).color),background};
  }));
  expect(pairs.length).toBeGreaterThan(0);
  for(const {name,ink,background} of pairs)expect(contrastRatio(ink,background),`${name}: ${ink} on ${background}`).toBeGreaterThanOrEqual(3);
}

async function revealSoon(page){
  await page.getByRole('link',{name:'Continuar al adelanto',exact:true}).press('Enter');
  await expect(page.locator('[data-opening-content]')).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('[data-opening-content]')).toHaveCSS('opacity','1');
}

async function setup(page,{admin=true,empty=false,error=false}={}){
  const {profile,own}=await communityAccount(page,{admin});let reads=0;
  const selection=ANNUAL_SELECTION.map((r,i)=>({...r,rank:i+1,...covers[r.id],stats:{reviewCount:3,meanScore:8.75,trackCount:30,commentCount:2,favoriteTrack:{name:'Canción real del club',count:2}}}));
  const rows=own.map(r=>({...r,created_at:'2026-06-03T12:00:00Z'}));
  const data={viewerId:profile.id,researchDate:'2026-11-18',selection,sources:ANNUAL_SOURCES,club:buildClubAnnual({albums:own.map(r=>r.albums),reviews:rows}),personal:buildPersonalAnnual(empty?[]:rows,own.map(r=>r.albums),{now:Date.parse('2026-11-18T12:00:00Z'),name:profile.name}),errors:[]};
  await page.route('**/api/annual/2026',route=>{reads++;expect(route.request().method()).toBe('GET');return route.fulfill({status:error?503:200,json:error?{error:'No se pudo abrir el resumen de prueba.'}:data});});
  return {profile,data,reads:()=>reads};
}
test('visitors see only the coming-soon presentation and never request the private collection',async({page},info)=>{
  await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());let reads=0;
  await page.route('**/api/annual/2026',r=>{reads++;return r.fulfill({status:403,json:{error:'private'}});});
  const response=await page.goto('/2026?preview=true');expect(await response.text()).not.toContain(ANNUAL_SOURCES[0].note);
  await expect(page.getByRole('heading',{level:1})).toContainText('Musiclub');
  await expect(page.locator('[data-opening-content]')).toHaveCSS('opacity','0');
  await expect(page.getByRole('navigation',{name:'Capítulos del año'})).toHaveCount(0);expect(reads).toBe(0);
  await expect(page.getByRole('link',{name:'Volver al club',exact:true})).toHaveAttribute('href','/catalogo');
  await expect(page.getByRole('link',{name:'Pool Musical',exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`outputs/annual-coming-soon-${info.project.name}.png`,fullPage:true,animations:'disabled'});
});

test('both public panels stay over the same mural and contain no foreground releases',async({page},info)=>{
  await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
  await page.goto('/2026');
  const main=page.getByRole('main',{name:'Recorrido de Musiclub 2026'});
  await expect(main).toHaveCSS('scroll-snap-type','none');
  await expect(main).toHaveAttribute('data-opening-story','true');
  await revealSoon(page);
  await expect.poll(()=>page.locator('#adelanto').evaluate(el=>Math.abs(el.getBoundingClientRect().top-el.closest('main').getBoundingClientRect().top))).toBeLessThan(3);
  await expect(page.getByRole('region',{name:'Musiclub 2026 · Próximamente'})).toBeVisible();
  await expect(page.locator('[data-opening-content] img')).toHaveCount(2);
  expect(await page.locator('[data-opening-content] img').evaluateAll(images=>images.every(img=>img.getAttribute('src')==='/musiclub_logo_corchea.png'))).toBe(true);
  await expect(page.getByRole('button',{name:/Sacar vinilo/})).toHaveCount(0);
  await page.screenshot({path:`outputs/annual-cubist-coming-soon-${info.project.name}.png`,animations:'disabled'});
  await page.getByRole('link',{name:'Y tu propio 2026'}).click();
  await expect.poll(()=>page.locator('#tu-2026').evaluate(el=>Math.abs(el.getBoundingClientRect().top-el.closest('main').getBoundingClientRect().top))).toBeLessThan(3);
  await page.getByRole('button',{name:'Hip-Hop',exact:true}).click();await expect(page.getByRole('button',{name:'Hip-Hop',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('region',{name:'Tu resumen personal de 2026 · Próximamente'})).toHaveAttribute('aria-hidden','false');
  expect(await page.locator('#inicio > div').first().evaluate(el=>Math.abs(el.getBoundingClientRect().top))).toBeLessThan(3);
  await page.screenshot({path:`outputs/annual-cubist-personal-soon-${info.project.name}.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Pausar movimiento',exact:true}).click();await expect(page.getByRole('button',{name:'Activar movimiento',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2)).toBe(true);
  if(info.project.name==='mobile'){
    await page.getByRole('button',{name:'Abrir capítulos',exact:true}).click();await page.getByRole('link',{name:/01\s*Inicio/}).click();
    await expect(page.getByRole('button',{name:'Abrir capítulos',exact:true})).toHaveAttribute('aria-expanded','false');
    await expect.poll(()=>page.locator('#inicio').evaluate(el=>Math.abs(el.getBoundingClientRect().top-el.closest('main').getBoundingClientRect().top))).toBeLessThan(3);
  }
  await page.getByRole('link',{name:'Volver al club',exact:true}).click();await expect(page).toHaveURL(/\/catalogo/);await expect(page.getByRole('complementary',{name:'Grammy 2027 en Musiclub'})).toBeVisible();
});

test('the opening is an illustrated mural without visible copy, with an accessible original-art gallery',async({page},info)=>{
  await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
  await page.goto('/2026');
  const mural=page.getByRole('region',{name:'Mural artístico de Musiclub 2026'});
  await expect(mural.getByRole('heading',{level:1})).toHaveCSS('width','1px');
  await expect(mural.locator('[data-release-id] img').first()).toHaveAttribute('src','/annual/2026/cubist-collage/charli.webp');
  expect(await mural.locator('[data-release-id] img').evaluateAll(images=>new Set(images.map(img=>img.getAttribute('src'))).size)).toBe(20);
  expect(await mural.locator('[data-release-id]').evaluateAll(tiles=>tiles.length)).toBe(40);
  expect(await mural.locator('[data-release-id] img').evaluateAll(images=>images.every(img=>Math.abs(img.getBoundingClientRect().width-img.getBoundingClientRect().height)<1))).toBe(true);
  await expect(page.getByRole('link',{name:/02\s*El adelanto/})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Abrir capítulos',exact:true})).toBeVisible();
  await expect(page.getByText('MUSICLUB / 2026',{exact:true})).not.toBeVisible();
  await page.screenshot({path:`outputs/annual-art-mural-${info.project.name}.png`,animations:'disabled'});
  const print=mural.getByRole('button',{name:'Ver ilustración: Wuthering Heights',exact:true}).first();await print.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Ilustraciones de Musiclub 2026'});await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link',{name:'Descargar ilustración PNG',exact:true})).toHaveAttribute('href','/annual/2026/cubist-collage/charli.png');
  await expect(dialog.getByText('Charli xcx',{exact:true})).toBeVisible();
  await expect(dialog.getByRole('img')).toHaveAttribute('width','1200');await expect(dialog.getByRole('img')).toHaveAttribute('height','1200');
  await dialog.getByRole('button',{name:'Ilustración anterior',exact:true}).click();await expect(dialog.getByText('Haute & Freddy',{exact:true})).toBeVisible();
  await dialog.getByRole('button',{name:'Siguiente ilustración',exact:true}).click();
  await dialog.getByRole('button',{name:'Siguiente ilustración',exact:true}).click();await expect(dialog.getByRole('img')).toHaveAttribute('src','/annual/2026/cubist-collage/mitski-detail.webp');await expect(dialog.getByText('Mitski',{exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
  await mural.getByRole('button',{name:'Ver ilustración: U',exact:true}).first().press('Enter');
  await expect(dialog.getByRole('img')).toHaveAttribute('src','/annual/2026/cubist-collage/underscores-u-detail.webp');
  await expect(dialog.getByRole('link',{name:'Descargar ilustración PNG',exact:true})).toHaveAttribute('href','/annual/2026/cubist-collage/underscores-u.png');
  await page.screenshot({path:`outputs/annual-underscores-u-${info.project.name}.png`,animations:'disabled'});
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
});
test('ordinary members also see only coming soon, regardless of preview parameters',async({page})=>{
  const state=await setup(page,{admin:false});await page.goto('/2026?admin=true&user_id=someone-else');
  await revealSoon(page);await expect(page.getByText('PRÓXIMAMENTE',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Para volver a escuchar.',exact:true})).toHaveCount(0);expect(state.reads()).toBe(0);
});

test('scrolling reveals coming soon over the same pinned moving mural without new private reads',async({page},info)=>{
  let privateReads=0;await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
  await page.route('**/api/annual/2026',r=>{privateReads++;return r.fulfill({status:403,json:{error:'private'}});});
  await page.goto('/2026');
  const main=page.getByRole('main',{name:'Recorrido de Musiclub 2026'}),viewport=page.locator('#inicio > div').first(),content=page.locator('[data-opening-content]');
  const top=await viewport.evaluate(el=>el.getBoundingClientRect().top);
  await main.evaluate(el=>el.scrollTo({top:el.clientHeight*.55,behavior:'instant'}));
  await expect.poll(()=>content.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeGreaterThan(.4);
  expect(await content.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(1);
  expect(await viewport.evaluate(el=>Math.abs(el.getBoundingClientRect().top))).toBeLessThan(Math.abs(top)+2);
  await expect(page.locator('[data-opening-bands]')).toHaveAttribute('inert','');
  await expect(page.locator('#inicio')).toHaveAttribute('data-visible','true');expect(privateReads).toBe(0);
  await page.screenshot({path:`outputs/annual-facets-scroll-${info.project.name}.png`,animations:'disabled'});
  await page.getByRole('link',{name:'Continuar al adelanto',exact:true}).click();
  await expect(content).toHaveCSS('opacity','1');await expect(page.getByText('PRÓXIMAMENTE',{exact:true})).toBeVisible();
  await page.screenshot({path:`outputs/annual-facets-reveal-${info.project.name}.png`,animations:'disabled'});
  await main.evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));await expect(content).toHaveCSS('opacity','0');await expect(page.locator('[data-opening-bands]')).not.toHaveAttribute('inert','');expect(privateReads).toBe(0);
});
test('the server rejects unauthenticated and ordinary sessions, including editable admin claims',async({request})=>{
  expect((await request.get('/api/annual/2026')).status()).toBe(401);
  const member=await request.get('/api/annual/2026?user_id=00000000-0000-4000-8000-000000000081',{headers:{Authorization:'Bearer annual-fixture-member'}});expect(member.status()).toBe(403);expect(await member.text()).not.toContain('Lost Weekend');
  const admin=await request.get('/api/annual/2026',{headers:{Authorization:'Bearer annual-fixture-admin'}});expect(admin.status()).toBe(200);expect(admin.headers()['cache-control']).toContain('private');const payload=await admin.json();expect(payload.selection).toHaveLength(20);expect(payload.sources).toBeUndefined();expect(payload.selection.every(r=>r.refs===undefined&&r.nomination===undefined&&r.rank>0&&r.stats)).toBe(true);
});
test('administrators scroll the ranking horizontally from 20 to 1 with statistics and no references',async({page},info)=>{
  const state=await setup(page);await page.goto('/2026');
  const main=page.getByRole('main',{name:'Recorrido de Musiclub 2026'}),rail=page.locator('#seleccion');
  await expect(rail.locator('article')).toHaveCount(20);
  expect(await rail.locator('article').evaluateAll(cards=>cards.map(c=>Number(c.dataset.rank)))).toEqual(Array.from({length:20},(_,i)=>20-i));
  await expect(page.locator('#fuentes')).toHaveCount(0);await expect(page.getByRole('link',{name:/Referencias/})).toHaveCount(0);await expect(rail.getByRole('button',{name:/Ver referencias/})).toHaveCount(0);
  await page.getByRole('link',{name:'Continuar a los releases',exact:true}).press('Enter');
  const first=page.locator('#release-haute');await expect(first.getByRole('heading',{name:'Big Disgrace',exact:true})).toBeVisible();
  await expect(first).toContainText('8.75');await expect(first).toContainText('Canción real del club');
  const firstX=await first.evaluate(el=>el.getBoundingClientRect().left);
  await rail.getByRole('button',{name:'Siguiente puesto del ranking',exact:true}).click();
  await expect.poll(()=>first.evaluate(el=>el.getBoundingClientRect().left)).toBeLessThan(firstX-200);
  await expect(rail.getByRole('heading',{name:'Ö',exact:true})).toBeVisible();
  expect(await rail.getByRole('button',{name:'Siguiente puesto del ranking',exact:true}).evaluate(el=>el.getBoundingClientRect().top-document.querySelector('[aria-label="Controles de vista previa anual"]').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  await page.screenshot({path:'outputs/annual-ranking-middle-'+info.project.name+'.png',animations:'disabled'});
  await main.evaluate(el=>{const r=el.querySelector('#seleccion');el.scrollTo({top:el.scrollTop+r.getBoundingClientRect().top-el.getBoundingClientRect().top+r.offsetHeight-el.clientHeight,behavior:'instant'});});
  const winner=page.locator('#release-phoebe');await expect(winner.getByRole('heading',{name:'Lost Weekend',exact:true})).toBeVisible();await expect(rail.getByRole('button',{name:'Siguiente puesto del ranking',exact:true})).toBeDisabled();
  await expect(winner.getByRole('link',{name:'Escuchar y reseñar'})).toHaveAttribute('href',/catalogo\?/);
  await winner.getByRole('button',{name:'Ver portada original de Lost Weekend',exact:true}).click();await expect(winner.getByAltText('Portada de Lost Weekend')).toBeVisible();
  await page.screenshot({path:'outputs/annual-ranking-winner-'+info.project.name+'.png',animations:'disabled'});
  await page.locator('#club').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
  await expect(page.getByRole('region',{name:'Actividad del club por mes',exact:true})).toBeVisible();await expect(page.getByRole('region',{name:'Distribución de notas del club',exact:true})).toBeVisible();
  await page.getByRole('region',{name:'Actividad del club por mes',exact:true}).evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
  await page.screenshot({path:'outputs/annual-club-stats-'+info.project.name+'.png',animations:'disabled'});
  await page.locator('#mi-2026').getByRole('button',{name:/02\s*Tus releases/}).click();await expect(page.getByRole('heading',{name:'Los discos que destacaste.',exact:true})).toBeVisible();
  await page.locator('#mi-2026').getByRole('button',{name:/03\s*Tus géneros/}).click();await expect(page.getByRole('heading',{name:'Sonaron en tus reseñas.',exact:true})).toBeVisible();
  await page.locator('#mi-2026').getByRole('button',{name:/04\s*Mes a mes/}).click();await expect(page.getByRole('heading',{name:'Así fue tu año.',exact:true})).toBeVisible();
  await page.locator('#mi-2026').getByRole('button',{name:/05\s*Tus artistas/}).click();await expect(page.getByRole('heading',{name:'Los nombres de tu año.',exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'Mi XP de actividad',exact:true})).toBeVisible();
  await page.getByRole('region',{name:'Mi XP de actividad',exact:true}).evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));
  await page.screenshot({path:'outputs/annual-personal-stats-'+info.project.name+'.png',animations:'disabled'});
  await page.getByRole('button',{name:'Ver Próximamente',exact:true}).click();await revealSoon(page);await expect(page.getByText('PRÓXIMAMENTE',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Mostrar edición de administrador',exact:true}).click();await expect(rail.locator('article')).toHaveCount(20);expect(state.reads()).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('the personal year has empty and failed states without invented figures',async({page})=>{
  await setup(page,{empty:true});await page.goto('/2026');await expect(page.getByRole('heading',{name:'Tu primer disco empieza este resumen.',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Compartir mi 2026',exact:true})).toHaveCount(0);
});

test('native icons stay readable across release scenes, personal themes and the public ticket',async({page})=>{
  await setup(page);await page.goto('/2026');await expect(page.locator('#seleccion article')).toHaveCount(20);
  await expectReadableIcons(page.locator('#seleccion'));
  for(const [name,theme,bg] of [['Noche del club','night','rgb(36, 32, 46)'],['En papel','paper','rgb(245, 236, 216)'],['Menta','mint','rgb(159, 217, 203)']]){
    await page.locator('#mi-2026').getByRole('button',{name,exact:true}).click();
    await expect(page.locator(`#mi-2026 [aria-live="polite"][data-theme="${theme}"]`)).toHaveCSS('background-color',bg);
    await expectReadableIcons(page.locator(`#mi-2026 [aria-live="polite"][data-theme="${theme}"]`));
  }
  await page.getByRole('button',{name:'Ver Próximamente',exact:true}).click();await revealSoon(page);
  await expectReadableIcons(page.locator('[aria-label="Edición anual de Musiclub"]'));
});
test('own annual cards export every format and keep the correct image proportions',async({page},info)=>{
  await setup(page);await page.goto('/2026');await page.getByRole('button',{name:'Compartir mi 2026',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Compartir mi 2026',exact:true});
  for(const [name,w,h] of [['Historia',1080,1920],['Publicación',1080,1350],['Cuadrada',1080,1080],['Horizontal',1600,900],['Compacta',720,960]]){
    await dialog.getByRole('button',{name:new RegExp('^'+name)}).click();await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
    const image=dialog.getByAltText('Vista previa de mi resumen de 2026');await expect(image).toHaveAttribute('width',String(w));await expect(image).toHaveAttribute('height',String(h));
    if(info.project.name==='desktop'){const url=await image.getAttribute('src');await fs.writeFile(`outputs/annual-share-${name.toLowerCase()}.png`,Buffer.from(url.split(',')[1],'base64'));}
  }
  await dialog.getByRole('button',{name:'En papel',exact:true}).click();await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
  if(info.project.name==='desktop'){const url=await dialog.getByAltText('Vista previa de mi resumen de 2026').getAttribute('src');await fs.writeFile('outputs/annual-share-paper.png',Buffer.from(url.split(',')[1],'base64'));}
  const downloaded=page.waitForEvent('download');await dialog.getByRole('button',{name:'Descargar PNG',exact:true}).click();expect((await downloaded).suggestedFilename()).toContain('musiclub-mi-2026-compact');
  await dialog.screenshot({path:`outputs/annual-share-dialog-${info.project.name}.png`,animations:'disabled'});
  await dialog.getByRole('button',{name:'Cerrar compartir',exact:true}).click();await expect(dialog).toHaveCount(0);
});
