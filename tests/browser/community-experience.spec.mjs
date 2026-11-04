import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {communityAccount} from './community-session.mjs';
import {REVIEW_CRITERIA} from '../../src/utils/reviewCriteria.mjs';

test('criterion colors remain the same in community reviews and the shared member/personal profile design',async({page},info)=>{
 await communityAccount(page);
 await page.goto('/profile');
 await expect(page.getByRole('heading',{level:1,name:'Camila de Prueba'})).toBeVisible();
 const criterion=page.locator('.review-criteria').first();
 await expect(criterion.locator('svg')).toHaveCount(7);
 const expected=REVIEW_CRITERIA.map(([,label,icon,max,color])=>color);
 const rgb=hex=>`rgb(${hex.slice(1).match(/../g).map(v=>parseInt(v,16)).join(', ')})`;
 expect(await criterion.locator('svg').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).color))).toEqual(expected.map(rgb));
 await page.goto('/leaderboard');
 await expect(page.locator('[data-leaderboard-member]')).toHaveCount(3);
 await page.locator('[data-leaderboard-member="00000000-0000-4000-8000-000000000082"]').press('Enter');
 const dialog=page.getByRole('dialog',{name:'Perfil de Mateo del Club',exact:true});
 await expect(dialog.locator('.profile-identity')).toBeVisible();
 await expect(dialog.getByRole('navigation',{name:'Secciones del miembro'}).getByRole('button')).toHaveCount(3);
 await expect(dialog.getByRole('button',{name:'Recomendar Canción',exact:true})).toBeVisible();
 await expect(dialog.getByRole('button',{name:'Editar',exact:true})).toHaveCount(0);
 await expect(dialog.getByRole('button',{name:'Compartir',exact:true})).toHaveCount(0);
 await expect(dialog.getByRole('button',{name:'Compartir perfil',exact:true})).toHaveCount(0);
 await expect(dialog.getByRole('link',{name:'Editar perfil',exact:true})).toHaveCount(0);
 await expect(dialog.getByText('private-member@example.test',{exact:true})).toHaveCount(0);
 expect(await dialog.locator('.review-criteria').first().locator('svg').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).color))).toEqual(expected.map(rgb));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await dialog.screenshot({path:`outputs/v108-member-${info.project.name}.png`,animations:'disabled'});
 await dialog.getByRole('button',{name:'Estadísticas Detalladas',exact:true}).click();await expect(dialog.getByRole('heading',{name:'Tu forma de escuchar',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Cerrar perfil de miembro',exact:true}).press('Escape');await expect(dialog).toHaveCount(0);
});

test('an open review panel loads once and reuses its release/account snapshot on focus and reopening',async({page})=>{
 await communityAccount(page);
 await page.goto('/albumes/artista-de-prueba-azul');
 const reads=[];page.on('request',r=>{if(/\/rest\/v1\/(?:public_reviews|reviews)\?/.test(r.url()))reads.push(r.url());});
 await page.getByRole('button',{name:'Editar reseña',exact:true}).click();
 await expect(page.locator('.compact-review-grid')).toBeVisible();
 await page.waitForLoadState('networkidle');const count=reads.length;expect(count).toBeGreaterThan(0);
 for(let i=0;i<4;i++){await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});}
 await page.waitForLoadState('networkidle');expect(reads.length).toBe(count);
 await expect(page.getByText('Cargando reviews…',{exact:true})).toHaveCount(0);
 await expect(page.locator('.compact-review-card')).toHaveCount(2);
 expect((await page.locator('.compact-review-card header>img').first().boundingBox()).width).toBeLessThanOrEqual(54);
});

test('review sharing exports five aspect ratios, bounds long titles and never draws a private email',async({page},info)=>{
 test.setTimeout(90000);await communityAccount(page);
 await page.addInitScript(()=>{window.exportText=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){const w=this.measureText(String(text)).width;const left=this.textAlign==='center'?x-w/2:this.textAlign==='right'?x-w:x;window.exportText.push({text:String(text),left,right:left+w,y,width:this.canvas.width,height:this.canvas.height});return original.call(this,text,x,y,...rest);};});
 await page.goto('/profile');
 const card=page.locator('.profile-panel').getByText(/Una historia interminable/).first().locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
 // The review list's second card carries an intentionally long album and artist name.
 await page.getByRole('button',{name:'Compartir',exact:true}).nth(1).click();
 const dialog=page.getByRole('dialog',{name:'Compartir mi reseña',exact:true});
 await expect(dialog).toBeVisible();
 for(const [name,width,height,id] of [['Historia',1080,1920,'story'],['Publicación',1080,1350,'portrait'],['Cuadrada',1080,1080,'square'],['Horizontal',1600,900,'landscape'],['Compacta',720,960,'compact']]){
   await dialog.getByRole('button',{name:new RegExp(`^${name}`)}).click();
   await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
   const preview=dialog.getByRole('img',{name:'Tarjeta de tu reseña',exact:true});
   await expect(preview).toHaveAttribute('width',String(width));await expect(preview).toHaveAttribute('height',String(height));
   await expect.poll(()=>preview.evaluate(el=>[el.naturalWidth,el.naturalHeight])).toEqual([width,height]);
   const data=await preview.getAttribute('src');await mkdir('outputs',{recursive:true});await writeFile(`outputs/v108-review-${id}-${info.project.name}.png`,Buffer.from(data.split(',')[1],'base64'));
 }
 for(const [theme,id] of [['Edición en papel','paper'],['Hora azul','blue']]){
  await dialog.getByRole('button',{name:theme,exact:true}).click();
  await dialog.getByRole('checkbox',{name:'Mostrar una frase en lugar de los criterios',exact:true}).check();
  await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
  const data=await dialog.getByRole('img',{name:'Tarjeta de tu reseña',exact:true}).getAttribute('src');await writeFile(`outputs/v108-review-quote-${id}-${info.project.name}.png`,Buffer.from(data.split(',')[1],'base64'));
 }
 const texts=await page.evaluate(()=>window.exportText);
 expect(texts.some(row=>row.text.includes('@example.test'))).toBe(false);
 expect(texts.filter(row=>row.left< -1||row.right>row.width+1||row.y>row.height||row.y<0)).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await dialog.screenshot({path:`outputs/v108-share-studio-${info.project.name}.png`});
});

test('the settings preview exports a public musical card and member share links open the correct profile',async({page},info)=>{
 const {profile}=await communityAccount(page);
 await page.goto('/settings');await page.getByLabel('Acerca de ti',{exact:true}).fill('La música también es una forma de encontrarnos.');
 await page.getByRole('button',{name:'Compartir vista previa',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Compartir mi perfil musical',exact:true});
 await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
 const image=dialog.getByRole('img',{name:'Tarjeta de tu identidad musical',exact:true});
 for(const [name,width,height,id] of [['Historia',1080,1920,'story'],['Publicación',1080,1350,'portrait'],['Cuadrada',1080,1080,'square'],['Horizontal',1600,900,'landscape'],['Compacta',720,960,'compact']]){
  await dialog.getByRole('button',{name:new RegExp(`^${name}`)}).click();await expect(dialog.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();
  await expect.poll(()=>image.evaluate(el=>[el.naturalWidth,el.naturalHeight])).toEqual([width,height]);
  const data=await image.getAttribute('src');await writeFile(`outputs/v108-profile-${id}-${info.project.name}.png`,Buffer.from(data.split(',')[1],'base64'));
 }

 await dialog.getByRole('button',{name:'Cerrar compartir',exact:true}).click();
 await page.goto(`/leaderboard?miembro=${profile.id}`);
 await expect(page.getByRole('dialog',{name:'Perfil de Camila de Prueba',exact:true})).toBeVisible();
});

test('the complete guide offers local simulations, chapters, reduced-motion support and direct FAQ references',async({page},info)=>{
 test.setTimeout(90000);const writes=[];
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 page.on('request',request=>{if(request.method()==='POST'&&(/\/rest\/v1\/|\/api\/notifications/.test(request.url())))writes.push(request.url());});
 await page.goto('/guias');await expect(page.getByRole('heading',{level:1})).toContainText('Guía de');
 await expect(page.locator('[data-tour-chapter]')).toHaveCount(20);
 await expect(page.locator('[data-tour-demo]')).toHaveCount(20);
 await expect(page.getByRole('banner')).toHaveCount(1);
 await page.screenshot({path:`outputs/v108-guide-${info.project.name}.png`,animations:'disabled'});
 const review=page.locator('#resenas');const score=await review.locator('output').first().innerText();
 await review.getByRole('slider',{name:'Producción de ejemplo',exact:true}).press('Home');expect(await review.locator('output').first().innerText()).not.toBe(score);
 await page.locator('#biblioteca').getByRole('button',{name:'Guardar Azul en la cola de ejemplo',exact:true}).click();await expect(page.locator('#biblioteca')).toContainText('1 releases en tu cola de ejemplo');
 await page.locator('#niveles').getByRole('slider').press('End');await expect(page.locator('#niveles')).toContainText('320,000');
 await page.locator('#tierlists').getByRole('slider').press('End');await expect(page.locator('#tierlists [class*="tierDisc"]')).toContainText('10.0');
 await page.locator('#estrenos').getByRole('button',{name:'Simular Avisarme',exact:true}).click();await expect(page.locator('#estrenos')).toContainText('No se enviará ningún mensaje');
 await expect(page.locator('#playlists')).toContainText('playlists');
 await page.locator('#maquina').getByRole('button',{name:'Tirar palanca',exact:true}).click();await expect(page.locator('#maquina [data-draw-confirmed]')).toBeVisible();
 await page.getByRole('textbox',{name:'Buscar en la guía',exact:true}).fill('palanca');expect(await page.locator('[data-tour-chapter]').count()).toBeLessThan(20);
 await page.getByRole('textbox',{name:'Buscar en la guía',exact:true}).fill('');
 expect(writes).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('h1').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.goto('/faq');await expect(page.getByRole('link',{name:'Guía interactiva de Musiclub →',exact:true})).toHaveAttribute('href','/guias');
 await page.goto('/');await expect(page.getByRole('link',{name:/Conoce Musiclub por dentro/})).toHaveAttribute('href','/guias');
});
