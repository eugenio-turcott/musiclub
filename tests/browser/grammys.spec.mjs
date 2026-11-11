import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

test('Grammy preparation exposes all categories, uses real genre art, and subscribes only after a deliberate click',async({page},info)=>{
 await communityAccount(page);await page.clock.install({time:new Date('2026-11-11T18:00:00Z')});let reads=0,writes=[];
 await page.route('**/api/grammys/me',route=>{if(route.request().method()==='GET'){reads++;return route.fulfill({json:{subscribed:false,predictions:[]}});}writes.push(route.request().postDataJSON());return route.fulfill({json:{success:true}});});
 await page.goto('/grammys');await expect(page.getByRole('heading',{level:1})).toContainText('¿Quién va a ganar?');await expect(page.getByRole('complementary',{name:'Grammy 2027 en Musiclub'})).toContainText('16 de noviembre');
 await expect(page.getByRole('button',{name:/^Explorar /})).toHaveCount(11);await expect(page.getByRole('button',{name:'Notificarme',exact:true})).toBeEnabled();expect(writes).toEqual([]);
 await page.getByRole('button',{name:'Notificarme',exact:true}).click();await expect(page.getByRole('button',{name:'Cancelar recordatorios',exact:true})).toBeVisible();expect(writes).toEqual([{action:'subscribe',enabled:true}]);
 await page.getByRole('button',{name:'Explorar Álbum del año',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Álbum del año',exact:true});await expect(dialog).toContainText('Nominados por anunciar');await expect(dialog.getByRole('radio')).toHaveCount(0);await dialog.getByRole('button',{name:'Cerrar categoría',exact:true}).press('Escape');await expect(dialog).toHaveCount(0);
 await page.getByRole('textbox',{name:'Buscar categoría o campo musical',exact:true}).fill('asiática');await expect(page.getByRole('button',{name:/^Explorar /})).toHaveCount(1);await expect(page.getByRole('button',{name:/^Explorar /})).toContainText('NUEVA CATEGORÍA');await page.getByRole('button',{name:'Limpiar búsqueda',exact:true}).click();
 for(const toggle of await page.locator('button[aria-controls^="field-"]').all())await toggle.click();await expect(page.getByRole('button',{name:/^Explorar /})).toHaveCount(100);
 const initial=reads;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForLoadState('networkidle');expect(reads).toBe(initial);expect(writes).toHaveLength(1);
 await page.emulateMedia({reducedMotion:'reduce'});for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize(info.project.name==='mobile'?{width:393,height:851}:{width:1440,height:1000});await page.goto('/grammys');await page.screenshot({path:`outputs/v12-grammys-${info.project.name}.png`,animations:'disabled'});
});

test('published nominees support a private, editable prediction and music links after the announcement',async({page},info)=>{
 await communityAccount(page,{expiresAt:Date.parse('2099-01-01')/1000});await page.clock.install({time:new Date('2026-11-17T18:00:00Z')});let saved=[];
 await page.route('**/api/grammys/me',route=>route.request().method()==='GET'?route.fulfill({json:{subscribed:false,predictions:[]}}):(saved.push(route.request().postDataJSON()),route.fulfill({json:{success:true}})));
 await page.goto('/grammys');await expect(page.getByRole('region',{name:'Fechas de la actividad'} )).toContainText('PREDICCIONES ABIERTAS');await page.getByRole('button',{name:'Explorar Álbum del año',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Álbum del año',exact:true});await expect(dialog.getByRole('radio')).toHaveCount(2);await expect(dialog.getByRole('link',{name:'Escuchar y calificar',exact:true})).toHaveCount(2);await expect(dialog.getByRole('link',{name:/Escuchar .* en Spotify/})).toHaveCount(2);
 await dialog.getByRole('radio').first().check();await dialog.getByRole('button',{name:'Guardar predicción',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Predicción guardada');expect(saved).toEqual([{action:'predict',categoryId:'album-of-the-year',nomineeId:'20000000-0000-4000-8000-000000000001'}]);
 await dialog.getByRole('radio').last().check();await dialog.getByRole('button',{name:'Guardar predicción',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Predicción guardada');expect(saved.at(-1).nomineeId).toBe('20000000-0000-4000-8000-000000000002');
 await dialog.screenshot({path:`outputs/v12-grammy-ballot-${info.project.name}.png`,animations:'disabled'});await dialog.getByRole('button',{name:'Cerrar categoría',exact:true}).click();await expect(page.getByRole('button',{name:'Explorar Álbum del año',exact:true})).toContainText('Predicción guardada');
});
