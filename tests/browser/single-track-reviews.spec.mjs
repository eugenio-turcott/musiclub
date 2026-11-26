import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {albums} from './fixtures.mjs';

test('one-track releases restore their own score, skip criteria and submit only that score',async({page},info)=>{
 const {profile}=await communityAccount(page);const writes=[];
 await page.route('**/rest/v1/reviews*',async route=>{
  if(route.request().method()==='POST'){const body=route.request().postDataJSON(),row=Array.isArray(body)?body[0]:body;writes.push(row);return route.fulfill({status:201,json:[{...row,id:'single-review',created_at:'2026-11-26T12:00:00Z'}]});}
  return route.fulfill({json:null});
 });
 await page.route('**/rest/v1/public_reviews*',route=>route.fulfill({json:[]}));
 await page.route('**/api/reviews/continuations*',route=>route.fulfill({json:{continuations:[]}}));
 const key=`musiclub_draft_${albums[1].id}_${profile.id}`;
 await page.addInitScript(({key,id})=>localStorage.setItem(key,JSON.stringify({version:2,userId:id,ratings:{produccion:3,general:10},trackRatings:{'track-1':7},wizardStep:'criteria'})),{key,id:profile.id});
 await page.goto('/albumes/artista-de-prueba-rojo');
 await expect(page.getByText('Desglose de Criterios',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Reseñar',exact:true}).click();
 const form=page.getByRole('group',{name:'Formulario de reseña',exact:true});
 await expect(form.getByRole('button',{name:'1. Calificación',exact:true})).toBeVisible();
 await expect(form.getByRole('button',{name:/Criterios/})).toHaveCount(0);
 await form.getByRole('button',{name:'9',exact:true}).click();
 await form.getByRole('button',{name:/Continuar al resumen/}).click();
 await expect(form).not.toContainText('Criterios del Álbum');await expect(form).not.toContainText('Promedio Ponderado Final');
 await expect(form.getByRole('button',{name:/Enviar Review Definitiva/})).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await form.screenshot({path:`outputs/v1235/single-review-${info.project.name}.png`});
 await form.getByRole('button',{name:/Enviar Review Definitiva/}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].rating_general).toBe(9);expect(writes[0].track_ratings).toEqual({'track-1':9});
 for(const key of ['produccion','composicion','letras','originalidad','cohesion','replay'])expect(writes[0]['rating_'+key]).toBeNull();
});

test('Grammy lives below Musiclub 2026 in Community with no top announcement',async({page})=>{
 await communityAccount(page);await page.goto('/catalogo');
 await expect(page.locator('.grammy-announcement')).toHaveCount(0);
 const mobile=page.getByRole('button',{name:'Abrir menú de navegación',exact:true});
 if(await mobile.isVisible())await mobile.click();else await page.getByRole('button',{name:/^Comunidad/}).click();
 const header=page.getByRole('banner');
 const annual=header.getByRole('link',{name:/^Musiclub 2026/}),grammy=header.getByRole('link',{name:/^Grammy 2027/});
 await expect(annual).toBeVisible();await expect(grammy).toBeVisible();
 expect(await annual.evaluate((a)=>Boolean(a.nextElementSibling?.getAttribute('href')==='/grammys'))).toBe(true);
 await grammy.click();await expect(page).toHaveURL(/\/grammys$/);await expect(page.getByRole('heading',{level:1})).toContainText('Grammy 2027');
});
