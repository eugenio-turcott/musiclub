import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {grammyReviewSummary} from '../../src/utils/grammyListening.mjs';

test('Grammy preparation exposes all categories, uses real genre art, and subscribes only after a deliberate click',async({page},info)=>{
 await communityAccount(page);await page.clock.install({time:new Date('2026-11-11T18:00:00Z')});let reads=0,writes=[];
 await page.route('**/api/grammys/me',route=>{if(route.request().method()==='GET'){reads++;return route.fulfill({json:{subscribed:false,predictions:[]}});}writes.push(route.request().postDataJSON());return route.fulfill({json:{success:true,confirmationStatus:'sent'}});});
 await page.goto('/grammys');await expect(page.getByRole('heading',{level:1})).toContainText('¿Quién va a ganar?');await expect(page.getByRole('complementary',{name:'Grammy 2027 en Musiclub'})).toHaveCount(0);
 const heading=page.getByRole('heading',{level:1});await expect(heading.locator('span').first()).toHaveCSS('color','rgb(248, 213, 138)');expect(await heading.locator('span').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(await heading.locator('span').last().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)));
 await expect(page.locator('[data-event-edition="gold"]')).toHaveCount(4);await expect(page.getByRole('region',{name:'Álbum del año',exact:true})).toContainText('+500 XP');
 await expect(page.locator('[data-grammy-category]')).toHaveCount(6);await expect(page.getByRole('button',{name:'Notificarme',exact:true})).toBeEnabled();expect(writes).toEqual([]);
 await page.getByRole('button',{name:'Notificarme',exact:true}).click();await expect(page.getByRole('button',{name:'Cancelar recordatorios',exact:true})).toBeVisible();expect(writes).toEqual([{action:'subscribe',enabled:true}]);await expect(page.getByRole('status')).toContainText('confirmación fue aceptada');
 const album=page.getByRole('region',{name:'Álbum del año',exact:true});await expect(album).toContainText('Nominados por anunciar');await expect(album.getByRole('radio')).toHaveCount(0);await expect(page.getByRole('dialog')).toHaveCount(0);await page.getByRole('button',{name:'Nuevas categorías',exact:true}).click();await expect(page.getByRole('region',{name:'Mejor canción latina',exact:true})).toContainText('+200 XP');
 await page.getByRole('textbox',{name:'Buscar categoría, release o artista',exact:true}).fill('asiática');await expect(page.locator('[data-grammy-category]')).toHaveCount(1);await expect(page.locator('[data-grammy-category]')).toContainText('Nueva en 2027');await page.getByRole('button',{name:'Limpiar búsqueda',exact:true}).click();
 await expect(page.getByRole('button',{name:'Todas las categorías',exact:true})).toHaveCount(0);
 for(const field of ['Empaque, notas e histórico','Producción, ingeniería y arreglos']){const art=page.getByRole('button',{name:field,exact:true}).locator('[data-grammy-vinyl]');await expect(art.locator('svg[data-vinyl-edition]')).toHaveCount(1);await expect(art.locator('svg').last()).toBeVisible();}
 const initial=reads;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForLoadState('networkidle');expect(reads).toBe(initial);expect(writes).toHaveLength(1);
 await page.emulateMedia({reducedMotion:'reduce'});for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize(info.project.name==='mobile'?{width:393,height:851}:{width:1440,height:1000});await page.goto('/grammys');await page.screenshot({path:`outputs/v12-grammys-${info.project.name}.png`,animations:'disabled'});
});

test('gold luster spans the hero without panel edges, pauses accessibly, and keeps the reminder hover smooth',async({page},info)=>{
 await communityAccount(page);await page.clock.install({time:new Date('2026-11-12T18:00:00Z')});await page.route('**/api/grammys/me',r=>r.fulfill({json:{subscribed:true,predictions:[],awards:[]}}));await page.goto('/grammys');const hero=page.getByRole('region',{name:'Grammy 2027. ¿Quién va a ganar?',exact:true}),title=hero.getByRole('heading',{level:1}).locator('span').first(),question=hero.getByRole('heading',{level:1}).locator('span').last(),trophy=hero.locator('[class*="medallion"]').first(),button=hero.getByRole('button',{name:'Cancelar recordatorios',exact:true});
 await expect(button).toBeEnabled();await expect(title).toHaveCSS('background-clip','text');expect(await title.evaluate(el=>getComputedStyle(el).animationName)).not.toBe('none');expect(await trophy.evaluate(el=>getComputedStyle(el,'::after').animationName)).not.toBe('none');expect(await question.evaluate(el=>parseFloat(getComputedStyle(el).marginTop))).toBeLessThanOrEqual(4);
 const before=await button.evaluate(el=>getComputedStyle(el).backgroundImage);await button.hover();await page.waitForTimeout(400);expect(await button.evaluate(el=>getComputedStyle(el).backgroundImage)).toBe(before);expect(await button.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('0.16');
 for(const width of [320,768,1440,1920]){await page.setViewportSize({width,height:1000});const backdrop=await hero.evaluate(el=>{const s=getComputedStyle(el,'::before');return {left:parseFloat(s.left),right:parseFloat(s.right),mask:s.maskImage};});expect(backdrop.left).toBeLessThan(0);expect(backdrop.right).toBeLessThan(0);expect(backdrop.mask).toContain('linear-gradient');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize(info.project.name==='mobile'?{width:393,height:851}:{width:1440,height:1000});await hero.getByRole('button',{name:'Pausar animaciones',exact:true}).click();await expect(title).toHaveCSS('animation-play-state','paused');expect(await trophy.evaluate(el=>getComputedStyle(el,'::after').animationPlayState)).toBe('paused');await page.screenshot({path:`outputs/v12-0-2-gold-${info.project.name}.png`,animations:'disabled'});
 await page.emulateMedia({reducedMotion:'reduce'});await expect(title).toHaveCSS('animation-name','none');
});

test('confirmed Grammy awards add exact XP and golden badges to both profile views and sharing',async({page},info)=>{
 const {profile}=await communityAccount(page);await page.route('**/rest/v1/public_grammy_progress*',route=>route.fulfill({json:[{user_id:profile.id,correct_count:20,normal_correct:9,new_correct:5,general_correct:6,total_xp:4900}]}));
 await page.goto('/profile?tab=badges');const source=page.locator('.xp-source-grid article').filter({has:page.getByRole('heading',{name:'Grammy 2027',exact:true})});await expect(source).toContainText('+4,900 XP');await source.locator('summary').click();await expect(source).toContainText('9 aciertos × 100 XP');await expect(source).toContainText('5 aciertos × 200 XP');await expect(source).toContainText('6 aciertos × 500 XP');await expect(page.locator('.active-achievement-grid [data-event-edition="gold"]')).toHaveCount(4);
 await page.getByRole('button',{name:'Compartir perfil',exact:true}).click();const studio=page.getByRole('dialog',{name:'Compartir mi perfil musical',exact:true});await expect(studio.getByRole('button',{name:'Descargar PNG',exact:true})).toBeEnabled();await studio.screenshot({path:`outputs/v12-0-1-grammy-share-${info.project.name}.png`,animations:'disabled'});await studio.getByRole('button',{name:'Cerrar compartir',exact:true}).click();
 await page.goto('/leaderboard?miembro='+profile.id);const member=page.getByRole('dialog',{name:'Perfil de '+profile.name,exact:true});await member.getByRole('button',{name:/^Insignias & Niveles/}).click();await expect(member.locator('.active-achievement-grid [data-event-edition="gold"]')).toHaveCount(4);await expect(member.locator('.xp-source-grid')).toContainText('+4,900 XP');
});

test('published nominees support a private, editable prediction and music links after the announcement',async({page},info)=>{
 await communityAccount(page,{expiresAt:Date.parse('2099-01-01')/1000});await page.clock.install({time:new Date('2026-11-17T18:00:00Z')});let saved=[];
 await page.route('**/api/grammys/me',route=>route.request().method()==='GET'?route.fulfill({json:{subscribed:false,predictions:[]}}):(saved.push(route.request().postDataJSON()),route.fulfill({json:{success:true}})));
 await page.goto('/grammys');await expect(page.getByRole('region',{name:'Fechas de la actividad'} )).toContainText('PREDICCIONES ABIERTAS');const dialog=page.getByRole('region',{name:'Álbum del año',exact:true});await expect(page.getByRole('dialog')).toHaveCount(0);await expect(dialog.getByRole('radio')).toHaveCount(2);await expect(dialog.getByRole('link',{name:'Escuchar y calificar',exact:true})).toHaveCount(2);await expect(dialog.getByRole('link',{name:/Escuchar .* en Spotify/})).toHaveCount(2);
 await dialog.getByRole('radio').first().check();await page.getByRole('button',{name:'Nuevas categorías',exact:true}).click();await page.getByRole('button',{name:'Campo General',exact:true}).click();await expect(dialog.getByRole('radio').first()).toBeChecked();await page.getByRole('region',{name:'Canción del año',exact:true}).getByRole('radio').check();await expect(dialog.getByRole('radio').first()).toBeChecked();expect(saved).toEqual([]);await page.getByRole('textbox',{name:'Buscar categoría, release o artista'}).fill('Rojo');await expect(page.locator('[data-grammy-category]')).toHaveCount(1);await expect(dialog.getByRole('radio').first()).toBeChecked();await page.getByRole('button',{name:'Limpiar búsqueda'}).click();await dialog.getByRole('button',{name:'Guardar predicción de Álbum del año',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Predicción guardada');expect(saved).toEqual([{action:'predict',categoryId:'album-of-the-year',nomineeId:'20000000-0000-4000-8000-000000000001'}]);
 await dialog.getByRole('radio').last().check();await dialog.getByRole('button',{name:'Guardar predicción de Álbum del año',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Predicción guardada');expect(saved.at(-1).nomineeId).toBe('20000000-0000-4000-8000-000000000002');
 await dialog.screenshot({path:`outputs/grammy-inline-ballot-${info.project.name}.png`,animations:'disabled'});await expect(dialog).toContainText('Predicción guardada');await dialog.getByRole('button',{name:'Quitar predicción de Álbum del año',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Predicción eliminada');expect(saved.at(-1).nomineeId).toBe(null);
});

test('a saved subscription never claims an email was sent without provider confirmation',async({page})=>{
 await communityAccount(page,{expiresAt:Date.parse('2099-01-01')/1000});await page.clock.install({time:new Date('2026-11-12T18:00:00Z')});let writes=0;
 await page.route('**/api/grammys/me',route=>route.request().method()==='GET'?route.fulfill({json:{subscribed:false,predictions:[],awards:[]}}):(writes++,route.fulfill({json:{success:true,confirmationStatus:'unconfirmed'}})));
 await page.goto('/grammys');await expect(page.getByRole('button',{name:/Camila de Prueba/})).toBeVisible();await page.getByRole('button',{name:'Notificarme',exact:true}).click();await expect(page.getByRole('status')).toContainText('no se confirmó el envío');await expect(page.getByRole('button',{name:'Cancelar recordatorios',exact:true})).toBeVisible();expect(writes).toBe(1);
});


test('expired reminders disappear for subscribed members in both the hero and unfilled categories',async({page})=>{
 await communityAccount(page,{expiresAt:Date.parse('2099-01-01')/1000});await page.clock.install({time:new Date('2026-11-17T18:00:00Z')});const writes=[];
 await page.route('**/api/grammys/me',route=>{if(route.request().method()==='POST')writes.push(route.request().postDataJSON());return route.fulfill({json:{subscribed:true,predictions:[],awards:[]}});});
 await page.goto('/grammys');await expect(page.getByRole('link',{name:'Ver nominados',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/Cancelar recordatorios|Notificarme|Recordatorio finalizado/})).toHaveCount(0);await expect(page.getByText('Recordatorios activados para el correo de tu cuenta.')).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Mejor artista nuevo',exact:true})).toContainText('Nominados pendientes de verificar');await expect(page.getByRole('button',{name:/Cancelar recordatorios|Notificarme|Recordatorio finalizado/})).toHaveCount(0);expect(writes).toEqual([]);
});

test('reviewed releases have a gold border, every release has a listening CTA, and creators have none',async({page})=>{
 await communityAccount(page,{expiresAt:Date.parse('2099-01-01')/1000});await page.clock.install({time:new Date('2026-11-17T18:00:00Z')});
 let revealPersonal;const personalReady=new Promise(resolve=>{revealPersonal=resolve;});
 await page.route('**/api/grammys/me',async route=>{await personalReady;return route.fulfill({json:{subscribed:false,predictions:[{category_id:'album-of-the-year',nominee_id:'20000000-0000-4000-8000-000000000002'}],awards:[],reviews:{albumIds:['00000000-0000-4000-8000-000000000001'],releaseKeys:[]}}});});
 await page.goto('/grammys');let dialog=page.getByRole('region',{name:'Álbum del año',exact:true});await expect(dialog).toBeVisible();await expect(dialog.getByRole('radio').first()).toBeDisabled();revealPersonal();
 const reviewed=dialog.locator('article').filter({has:page.getByText('Azul',{exact:true})}),unreviewed=dialog.locator('article').filter({has:page.getByText('Rojo',{exact:true})});
 await expect(reviewed).toHaveAttribute('data-reviewed','true');await expect(reviewed).toHaveCSS('border-top-color','rgb(246, 205, 117)');await expect(reviewed).toContainText('Ya reseñaste este release');await expect(unreviewed).toHaveAttribute('data-reviewed','false');await expect(unreviewed).toHaveAttribute('data-selected','true');await expect(unreviewed).toHaveAttribute('data-selected','true');await expect(dialog.getByRole('link',{name:'Escuchar y calificar',exact:true})).toHaveCount(2);
 dialog=page.getByRole('region',{name:'Canción del año',exact:true});await expect(dialog.getByRole('link',{name:'Escuchar y calificar',exact:true})).toHaveAttribute('href','/catalogo?q=Canci%C3%B3n%20sin%20ficha');
 await expect(page.getByRole('region',{name:'Tu recorrido por los nominados'})).toContainText('Releases reseñados');await expect(page.getByRole('region',{name:'Tu recorrido por los nominados'})).toContainText('Artistas explorados');dialog=page.getByRole('region',{name:'Productor del año, no clásico',exact:true});await expect(dialog.getByText('Creador de Prueba',{exact:true})).toHaveCount(1);await expect(dialog.getByRole('link',{name:'Escuchar y calificar',exact:true})).toHaveCount(0);await expect(dialog.locator('[data-reviewed=true]')).toHaveCount(0);
});


test('an older reviewed work gives its nominated artist a gold border without marking nominated releases',async({page})=>{
 await communityAccount(page,{expiresAt:Date.parse('2099-01-01')/1000});await page.clock.install({time:new Date('2026-11-17T18:00:00Z')});
 const reviews=grammyReviewSummary([{album_id:'older-unrelated-to-nominations',albums:{album_name:'Una obra anterior',artist_name:'Creador de Prueba',release_type:'ALBUM'}}]);
 await page.route('**/api/grammys/me',route=>route.fulfill({json:{subscribed:false,predictions:[],awards:[],reviews}}));
 await page.goto('/grammys');
 const creator=page.getByRole('region',{name:'Productor del año, no clásico',exact:true}),card=creator.locator('article');
 await expect(card).toHaveAttribute('data-reviewed','true');await expect(card).toHaveCSS('border-top-color','rgb(246, 205, 117)');
 await expect(card).toContainText('Ya reseñaste música de este artista');await expect(card).not.toContainText('Ya reseñaste este release');await expect(creator.getByText('Creador de Prueba',{exact:true})).toHaveCount(1);await expect(creator.getByRole('link',{name:'Escuchar y calificar',exact:true})).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Álbum del año',exact:true}).locator('[data-reviewed=true]')).toHaveCount(0);
 await expect(page.getByRole('progressbar',{name:'Artistas explorados',exact:true})).toHaveAttribute('value','1');
 await expect(page.getByRole('progressbar',{name:'Releases reseñados',exact:true})).toHaveAttribute('value','0');
});
