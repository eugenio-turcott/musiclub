import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {ANNUAL_SELECTION,ANNUAL_SOURCES} from '../../src/server/annual2026Selection.mjs';
import covers from '../../src/server/annual2026Covers.json' with {type:'json'};
import {buildPersonalAnnual,buildClubAnnual} from '../../src/utils/annualRecap.mjs';
import fs from 'node:fs/promises';
import {contrastRatio} from '../../src/utils/annualIconContrast.mjs';
import {buildAnnualYearbook} from '../../src/utils/annualYearbook.mjs';
import globalSnapshot from '../../src/server/annual2026Global.json' with {type:'json'};

async function expectReadableIcons(scope){
  await expect.poll(async()=>{
  const pairs=await scope.locator('.ui-icon[data-ui-icon]').evaluateAll(icons=>icons.map(icon=>{
    const hex=value=>'#'+value.match(/[\d.]+/g).slice(0,3).map(v=>Math.round(Number(v)).toString(16).padStart(2,'0')).join('');
    let parent=icon.parentElement,background='#ffffff';
    while(parent){const bg=getComputedStyle(parent).backgroundColor,n=bg.match(/[\d.]+/g)?.map(Number);if(n&&(n.length===3||n[3]>.99)){background=hex(bg);break;}parent=parent.parentElement;}
    return{name:icon.dataset.uiIcon,ink:hex(getComputedStyle(icon).color),background};
  }));
  expect(pairs.length).toBeGreaterThan(0);
  return Math.min(...pairs.map(({ink,background})=>contrastRatio(ink,background)));
  },{message:'Los íconos deben conservar contraste al terminar la transición de fondo.'}).toBeGreaterThanOrEqual(3);
}

async function revealSoon(page){
  await page.getByRole('link',{name:'Continuar al adelanto',exact:true}).press('Enter');
  await expect(page.locator('[data-opening-content]')).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('[data-opening-content]')).toHaveCSS('opacity','1');
}

async function setup(page,{admin=true,empty=false,error=false}={}){
  const {profile,own}=await communityAccount(page,{admin});let reads=0;
  const rows=own.map(r=>({...r,created_at:'2026-06-03T12:00:00Z',albums:{...r.albums,release_year:2026}}));
  const extra=Array.from({length:20},(_,i)=>{const album={...rows[0].albums,id:'club-'+i,album_name:'Disco del club '+String(i+1).padStart(2,'0'),artist_name:'Artista '+i,genres:[i===0?'Russian Orthodox Liturgical Music':i===1?'Contemporary R&b':'Pop']};return {...rows[0],id:'club-review-'+i,album_id:album.id,reviewer_name:'Persona '+i,rating_general:5+i*.2,comment:i===0?'Esta es una reseña completa del club. '.repeat(20):'Una opinión diferente de la comunidad.',albums:album};});
  const catalog={albums:[...rows,...extra].map(r=>r.albums),reviews:[...rows,...extra]},yearbook=buildAnnualYearbook(catalog,globalSnapshot,{now:Date.parse('2026-11-19T18:00:00Z')});
  const data={viewerId:profile.id,researchDate:'2026-11-19',selection:yearbook.clubRanking,yearbook,playlists:[],club:buildClubAnnual(catalog),personal:buildPersonalAnnual(empty?[]:rows,rows.map(r=>r.albums),{now:Date.parse('2026-11-19T18:00:00Z'),name:profile.name}),errors:[]};
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
  const admin=await request.get('/api/annual/2026',{headers:{Authorization:'Bearer annual-fixture-admin'}});expect(admin.status()).toBe(200);expect(admin.headers()['cache-control']).toContain('private');const payload=await admin.json();expect(payload.selection.length).toBeLessThanOrEqual(20);expect(payload.yearbook.albums).toHaveLength(20);expect(payload.yearbook.albums.every(r=>!r.sourceUrl&&!r.imageSource)).toBe(true);expect(payload.sources).toBeUndefined();expect(payload.selection.every(r=>r.refs===undefined&&r.nomination===undefined&&r.rank>0&&r.stats)).toBe(true);
});
test('administrators scroll the ranking horizontally from 20 to 1 with statistics and no references',async({page},info)=>{
  const state=await setup(page);await page.goto('/2026');
  const main=page.getByRole('main',{name:'Recorrido de Musiclub 2026'}),rail=page.locator('#seleccion');
  await expect(rail.locator('article')).toHaveCount(20);
  expect(await rail.locator('article').evaluateAll(cards=>cards.map(c=>Number(c.dataset.rank)))).toEqual(Array.from({length:20},(_,i)=>20-i));
  await expect(page.locator('#fuentes')).toHaveCount(0);await expect(page.getByRole('link',{name:/Referencias/})).toHaveCount(0);await expect(rail.getByRole('button',{name:/Ver referencias/})).toHaveCount(0);
  await page.getByRole('link',{name:'Antes de comenzar',exact:true}).press('Enter');
  await expect(page.locator('#bienvenida').getByRole('heading',{name:'2026 en Musiclub.',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Vamos a los discos',exact:true}).click();
  await expect(page.locator('[data-private=true]')).toHaveAttribute('data-opening','false');
  const first=rail.locator('article').first();await expect(first.getByRole('heading',{name:state.data.selection.at(-1).title,exact:true})).toBeVisible();
  await expect(first).toContainText(state.data.selection.at(-1).stats.meanScore.toFixed(2));
  const firstX=await first.evaluate(el=>el.getBoundingClientRect().left);
  await rail.getByRole('button',{name:'Siguiente puesto del ranking',exact:true}).click();
  await expect.poll(()=>first.evaluate(el=>el.getBoundingClientRect().left)).toBeLessThan(firstX-200);
  await expect(rail.getByRole('heading',{name:state.data.selection.at(-2).title,exact:true})).toBeVisible();
  expect(await rail.getByRole('button',{name:'Siguiente puesto del ranking',exact:true}).evaluate(el=>el.getBoundingClientRect().top-document.querySelector('[aria-label="Controles de vista previa anual"]').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  await page.screenshot({path:'outputs/annual-ranking-middle-'+info.project.name+'.png',animations:'disabled'});
  await main.evaluate(el=>{const r=el.querySelector('#seleccion');el.scrollTo({top:el.scrollTop+r.getBoundingClientRect().top-el.getBoundingClientRect().top+r.offsetHeight-el.clientHeight,behavior:'instant'});});
  await expect(page.locator('[data-private=true]')).toHaveAttribute('data-opening','false');
  const winner=rail.locator('article').last();await expect(winner.getByRole('heading',{name:state.data.selection[0].title,exact:true})).toBeVisible();await expect(rail.getByRole('button',{name:'Siguiente puesto del ranking',exact:true})).toBeDisabled();
  await expect(winner.getByRole('link',{name:'Escuchar y reseñar'})).toHaveAttribute('href',/albumes\//);
  await winner.getByRole('button',{name:'Ver portada original de '+state.data.selection[0].title,exact:true}).click();await expect(winner.getByAltText('Portada de '+state.data.selection[0].title)).toBeVisible();
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
  for(const id of ['eps','sencillos','voces','listas','categorias','proximo-2027'])await expectReadableIcons(page.locator('#'+id));
  await page.locator('#categorias').getByRole('button',{name:'Bandas sonoras',exact:true}).click();
  await expectReadableIcons(page.locator('#categorias'));
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


test('the global sections follow the annual sequence and every reviewer appears on a distinct release card',async({page},info)=>{
 const state=await setup(page);await page.goto('/2026');await expect(page.locator('#seleccion article')).toHaveCount(20);
 const ids=['bienvenida','seleccion','club','panorama','eps','sencillos','meses','voces','listas','generos','categorias','proximo-2027','mi-2026'];
 expect(await page.locator('main').evaluate((main,ids)=>ids.map(id=>main.querySelector('#'+id)).every((el,i,all)=>el&&(!i||(all[i-1].compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING))),ids)).toBe(true);
 const voices=page.locator('#voces');await expect(voices.locator('[data-voice-author]')).toHaveCount(state.data.yearbook.voices.contributorCount);
 expect(await voices.locator('[data-voice-author]').evaluateAll(nodes=>new Set(nodes.map(e=>e.dataset.voiceAuthor)).size)).toBe(state.data.yearbook.voices.contributorCount);
 expect(await voices.locator('[data-voice-release]').evaluateAll(nodes=>new Set(nodes.map(e=>e.dataset.voiceRelease)).size===nodes.length)).toBe(true);
 await voices.locator('[data-voice-release]').first().evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));await page.screenshot({path:'outputs/annual-yearbook-voices-'+info.project.name+'.png',animations:'disabled'});
 const more=voices.getByRole('button',{name:'Leer completa',exact:true}).first();await more.click();await expect(more).toHaveCount(0);await voices.getByRole('button',{name:'Ver menos',exact:true}).click();
 await page.locator('#meses').getByRole('button',{name:'Marzo',exact:true}).click();await expect(page.locator('#meses [data-global-release]')).toHaveCount(1);await expect(page.locator('#meses')).toContainText('AOTY');await expect(page.locator('#meses')).toContainText('Musiclub');
 await page.locator('#meses').getByRole('button',{name:'Diciembre',exact:true}).click();await expect(page.locator('#meses')).toContainText('No hay un release de este mes en el corte consultado.');
 await page.locator('#categorias').getByRole('button',{name:'Bandas sonoras',exact:true}).click();await expect(page.locator('#categorias [data-global-release]')).toHaveCount(8);
 await page.locator('#categorias').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));await page.screenshot({path:'outputs/annual-yearbook-categories-'+info.project.name+'.png',animations:'disabled'});
 expect(state.reads()).toBe(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('the welcome precedes the ranking, long genre names fit and real covers link directly to releases',async({page},info)=>{
 await setup(page);await page.goto('/2026');await expect(page.locator('#seleccion article')).toHaveCount(20);
 await page.getByRole('link',{name:'Antes de comenzar',exact:true}).press('Enter');
 await expect(page.locator('#bienvenida').getByRole('heading',{name:'2026 en Musiclub.',exact:true})).toBeVisible();
 await expectReadableIcons(page.locator('#bienvenida'));
 const vinyl=page.locator('#bienvenida [data-vinyl-edition]').first();
 await expect.poll(()=>vinyl.locator('image').first().evaluate(e=>getComputedStyle(e).animationPlayState)).toBe('running');
 await page.screenshot({path:'outputs/yearbook-welcome-'+info.project.name+'.png',animations:'disabled'});
 await page.getByRole('button',{name:'Pausar movimiento',exact:true}).click();
 await expect.poll(()=>vinyl.locator('image').first().evaluate(e=>getComputedStyle(e).animationPlayState)).toBe('paused');
 await page.getByRole('link',{name:'Vamos a los discos',exact:true}).click();
 expect(await page.locator('[data-genre-backdrop]').evaluateAll(labels=>labels.every(el=>el.scrollWidth<=el.clientWidth+1&&parseFloat(getComputedStyle(el).letterSpacing)>=0))).toBe(true);
 await expect(page.locator('#seleccion')).not.toContainText('R&b');
 await page.locator('[aria-label="Explorar el panorama global"]').getByRole('link',{name:'EPs',exact:true}).click();
 await expect(page.locator('#eps [data-global-release]')).toHaveCount(10);
 const cover=page.locator('#eps [data-global-release]').first().locator('img');
 await expect.poll(()=>cover.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 expect(await page.locator('#eps [data-global-release]>a,#sencillos [data-global-release]>a').evaluateAll(links=>links.every(a=>/^\/(albumes|eps|sencillos|compilaciones)\//.test(a.getAttribute('href'))))).toBe(true);
 await page.screenshot({path:'outputs/yearbook-eps-'+info.project.name+'.png',animations:'disabled'});
});
