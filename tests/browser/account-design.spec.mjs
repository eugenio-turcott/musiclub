import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { albums } from './fixtures.mjs';

const memberId='00000000-0000-4000-8000-000000000081';
async function account(page,{failSave=false}={}) {
  const profile={id:memberId,email:'member@example.test',name:'Camila de Prueba',avatar_url:'http://127.0.0.1:3101/musiclub_logo.png',bio:'Buscando discos para escuchar de principio a fin.',favorite_artist:'Radiohead',favorite_album:'In Rainbows',favorite_genres:['Rock','Jazz'],role:'user'};
  const user={id:memberId,email:profile.email,user_metadata:{full_name:profile.name,avatar_url:profile.avatar_url},app_metadata:{provider:'google'},aud:'authenticated',created_at:'2026-10-01T00:00:00Z'};
  const writes=[];
  const reviews=albums.slice(0,2).map((album,index)=>({id:`personal-review-${index}`,user_id:memberId,album_id:album.id,reviewer_name:profile.name,reviewer_email:profile.email,rating_general:8+index,comment:'Una reseña local de prueba.',created_at:`2026-10-0${index+1}T00:00:00Z`,albums:album}));
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.addInitScript(user=>{
    const payload=btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600}));
    localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.fixture-only`,refresh_token:'fixture-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
  },user);
  await page.route('**/auth/v1/user',route=>{
    if(route.request().method()==='PUT')Object.assign(user.user_metadata,route.request().postDataJSON()?.data || {});
    return route.fulfill({json:user});
  });
  await page.route('**/rest/v1/profiles*',route=>{
    if(route.request().method()==='PATCH'){
      const body=route.request().postDataJSON();writes.push(body);
      if(failSave)return route.fulfill({status:400,json:{message:'No se pudo guardar el perfil de prueba.'}});
      Object.assign(profile,body);return route.fulfill({json:[]});
    }
    return route.fulfill({json:profile});
  });
  await page.route('**/rest/v1/public_profiles*',route=>route.fulfill({json:[profile]}));
  await page.route('**/rest/v1/public_reviews*',route=>route.fulfill({json:reviews}));
  await page.route('**/rest/v1/reviews*',route=>route.fulfill({json:route.request().method()==='GET'?reviews:[]}));
  return {profile,writes};
}

test('leaderboard plates match their icons, one-review members have no severe label and the guide uses only vector icons',async({page},testInfo)=>{
 await page.goto('/leaderboard');
 await expect(page.locator('[data-leaderboard-member]')).toHaveCount(3);
 const single=page.locator('[data-leaderboard-member]').filter({has:page.getByText('Otra persona actual',{exact:true})});
 const multiple=page.locator('[data-leaderboard-member]').filter({has:page.getByText('Miembro de Prueba',{exact:true})});
 await expect(single).not.toContainText('Más severo:');await expect(multiple).toContainText('Más severo:');
 const icons=await page.locator('.leaderboard-stat-icon').evaluateAll(items=>items.map(plate=>{const icon=plate.querySelector('svg');const rect=icon.getBoundingClientRect();return {color:getComputedStyle(icon).color,plate:getComputedStyle(plate).color,width:rect.width,height:rect.height};}));
 expect(icons).toHaveLength(4);for(const icon of icons){expect(icon.width).toBe(30);expect(icon.height).toBe(30);expect(icon.color).toBe(icon.plate);}
 for(const score of await page.locator('.leaderboard-xp-score').all())expect(await score.evaluate(el=>getComputedStyle(el).color===getComputedStyle(el.querySelector('svg')).color)).toBe(true);
 await page.getByRole('button',{name:/Cómo funciona el Score XP/}).click();
 const guide=page.getByRole('dialog',{name:'Guía Oficial de Insignias y Puntos'});await expect(guide).toBeVisible();
 expect(await guide.innerText()).not.toMatch(/\p{Extended_Pictographic}/u);
 expect(await guide.locator('[data-ui-icon]').count()).toBeGreaterThan(20);
 mkdirSync('outputs/v101-proof',{recursive:true});await page.screenshot({path:`outputs/v101-proof/leaderboard-guide-${testInfo.project.name}.png`});
 await page.keyboard.press('Escape');await expect(guide).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('profile navigation preserves personal sections and adapts to the screen',async({page},testInfo)=>{
 await account(page);await page.goto('/profile');
 await expect(page.getByRole('heading',{level:1,name:'Camila de Prueba'})).toBeVisible();
 const nav=page.getByRole('navigation',{name:'Secciones de Mi Perfil'});
 await nav.getByRole('button',{name:'Para Ti',exact:true}).click();await expect(nav.getByRole('button',{name:'Para Ti',exact:true})).toHaveAttribute('aria-current','page');
 await nav.getByRole('button',{name:'Escuchar más tarde',exact:true}).click();await expect(page.getByRole('region',{name:'Escuchar más tarde',exact:true})).toBeVisible();
 await nav.getByRole('button',{name:'Descartes del Gashapon',exact:true}).click();await expect(page.getByRole('region',{name:'Descartes del Gashapon',exact:true})).toBeVisible();
 await nav.getByRole('button',{name:/Mis Reviews/}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));
 mkdirSync('outputs/v101-proof',{recursive:true});await page.screenshot({path:`outputs/v101-proof/profile-${testInfo.project.name}.png`});
});

test('settings previews edits, restores the draft and persists all fields only on save',async({page},testInfo)=>{
 const {profile,writes}=await account(page);await page.goto('/settings');
 const save=page.getByRole('button',{name:'Guardar cambios',exact:true});await expect(save).toBeDisabled();
 await page.getByLabel('Nombre o alias',{exact:true}).fill('Cami');await page.getByLabel('Acerca de ti',{exact:true}).fill('Jazz de noche, rock de día.');
 await expect(page.getByRole('complementary',{name:'Vista previa de tu perfil'})).toContainText('Cami');
 await expect(page.getByText('Borrador guardado en este navegador.',{exact:true})).toBeVisible();expect(writes).toHaveLength(0);
 await page.reload();await expect(page.getByLabel('Nombre o alias',{exact:true})).toHaveValue('Cami');
 await page.getByRole('group',{name:'Tus géneros favoritos'}).getByRole('button',{name:'Pop',exact:true}).click();
 await page.getByLabel('Perfil de Spotify',{exact:true}).fill('https://open.spotify.com/user/fixture');
 const saveBar=page.locator('.settings-save-bar');
 await expect(saveBar).toBeInViewport();
 if(testInfo.project.name==='desktop')await expect(page.getByRole('complementary',{name:'Vista previa de tu perfil'})).toBeInViewport();
 await page.evaluate(()=>window.scrollTo(0,0));
 mkdirSync('outputs/v101-proof',{recursive:true});await page.screenshot({path:`outputs/v101-proof/settings-${testInfo.project.name}.png`});
 await save.click();await expect(page.getByRole('status')).toHaveText('Cambios guardados. Tu perfil está actualizado.');
 expect(profile.name).toBe('Cami');expect(profile.bio).toBe('Jazz de noche, rock de día.');expect(profile.favorite_genres).toContain('Pop');expect(profile.spotify_url).toBe('https://open.spotify.com/user/fixture');
 expect(await page.evaluate(()=>localStorage.getItem('musiclub_settings_draft_00000000-0000-4000-8000-000000000081'))).toBeNull();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('a failed profile update preserves the draft and never displays a saved confirmation',async({page})=>{
 await account(page,{failSave:true});await page.goto('/settings');
 await page.getByLabel('Acerca de ti',{exact:true}).fill('Conservar este borrador.');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await expect(page.locator('.settings-feedback').getByRole('alert')).toContainText('No se pudo guardar');await expect(page.getByText('Cambios guardados. Tu perfil está actualizado.')).toHaveCount(0);
 await expect(page.getByLabel('Acerca de ti',{exact:true})).toHaveValue('Conservar este borrador.');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('musiclub_settings_draft_00000000-0000-4000-8000-000000000081')).bio)).toBe('Conservar este borrador.');
});
