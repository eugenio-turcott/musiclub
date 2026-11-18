import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';
import {albums} from './fixtures.mjs';

const release='/albumes/artista-de-prueba-azul';
const key=`musiclub_draft_${albums[0].id}_00000000-0000-4000-8000-000000000081`;
async function setup(page){
  const {profile}=await communityAccount(page);
  await page.route('**/rest/v1/reviews*',route=>{expect(route.request().method()).toBe('GET');return route.fulfill({json:null});});
  await page.route('**/rest/v1/public_reviews*',route=>route.fulfill({json:[]}));
  return profile;
}
async function open(page){
  await page.goto(release);await page.getByRole('button',{name:'Reseñar',exact:true}).click();
  return page.getByRole('group',{name:'Formulario de reseña',exact:true});
}
async function draft(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);}

test('leaving during tracks restores that track and never pre-fills criteria',async({page},testInfo)=>{
  await setup(page);let form=await open(page);
  await expect(form.getByRole('button',{name:/Siguiente/})).toBeDisabled();
  await form.getByRole('button',{name:'8',exact:true}).click();
  await form.getByRole('button',{name:/Siguiente/}).click();
  await expect(form.getByRole('heading',{name:'Segunda canción',exact:true})).toBeVisible();
  await expect.poll(async()=> (await draft(page))?.currentTrackIndex).toBe(1);
  expect((await draft(page)).ratings).toEqual({});
  await page.goto('/catalogo');form=await open(page);
  await expect(form.getByRole('heading',{name:'Segunda canción',exact:true})).toBeVisible();
  await expect(form.getByRole('button',{name:/1\. Canciones/})).toContainText('(1/3)');
  await form.getByRole('button',{name:'2. Criterios',exact:true}).click();
  await expect(form.getByRole('button',{name:/^Ir a .*sin calificar$/})).toHaveCount(7);
  await expect(form.getByRole('button',{name:'Producción: 3 de 5',exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(form.getByRole('button',{name:/Siguiente/})).toBeDisabled();
  await form.screenshot({path:`outputs/v12-0-9-criterios-pendientes-${testInfo.project.name}.png`});
  await form.getByRole('button',{name:'3. Resumen',exact:true}).click();
  await expect(form.getByRole('button',{name:/Enviar Review Definitiva/})).toBeDisabled();
});

test('editing a published review resumes the draft instead of replacing it with the published ratings',async({page})=>{
  await communityAccount(page);
  await page.goto(release);await page.getByRole('button',{name:'Editar reseña',exact:true}).click();
  await page.getByRole('button',{name:/^Editar Review$/}).click();
  let form=page.getByRole('group',{name:'Formulario de reseña',exact:true});
  await form.getByRole('button',{name:'2. Criterios',exact:true}).click();
  await form.getByRole('button',{name:'Producción: 3 de 5',exact:true}).click();
  await form.getByRole('button',{name:/Siguiente/}).click();
  await expect.poll(async()=> (await draft(page))?.ratings.produccion).toBe(3);
  await page.goto('/catalogo');await page.goto(release);
  await page.getByRole('button',{name:'Editar reseña',exact:true}).click();
  form=page.getByRole('group',{name:'Formulario de reseña',exact:true});
  await expect(form.getByRole('heading',{name:/Composición/})).toBeVisible();
  await expect(form.getByRole('button',{name:'Ir a Producción: 3 de 5',exact:true})).toBeVisible();
  expect((await draft(page)).isEditing).toBe(true);
});

test('resetting a draft removes the stored answers and returns to an unrated first track',async({page})=>{
  await setup(page);let form=await open(page);
  await form.getByRole('button',{name:'8',exact:true}).click();
  await form.getByRole('button',{name:'2. Criterios',exact:true}).click();
  await form.getByRole('button',{name:'Producción: 3 de 5',exact:true}).click();
  await form.getByRole('button',{name:'3. Resumen',exact:true}).click();
  page.once('dialog',dialog=>dialog.accept());
  await form.getByRole('button',{name:/Reiniciar/}).click();
  await expect(form.getByRole('heading',{name:'Canción de prueba',exact:true})).toBeVisible();
  await expect.poll(()=>draft(page)).toBeNull();
  await page.reload();await page.getByRole('button',{name:'Reseñar',exact:true}).click();
  form=page.getByRole('group',{name:'Formulario de reseña',exact:true});
  await expect(form.getByRole('button',{name:/1\. Canciones/})).toContainText('(0/3)');
});

test('an explicitly chosen 3 survives with the exact criterion and the remaining six stay pending',async({page})=>{
  await setup(page);let form=await open(page);
  await form.getByRole('button',{name:'2. Criterios',exact:true}).click();
  await form.getByRole('button',{name:'Producción: 3 de 5',exact:true}).click();
  await form.getByRole('button',{name:/Siguiente/}).click();
  await expect.poll(async()=> (await draft(page))?.currentCriterionIndex).toBe(1);
  await page.goto('/catalogo');form=await open(page);
  await expect(form.getByRole('heading',{name:/Composición/})).toBeVisible();
  await expect(form.getByRole('button',{name:'Ir a Producción: 3 de 5',exact:true})).toBeVisible();
  await expect(form.getByRole('button',{name:/^Ir a .*sin calificar$/})).toHaveCount(6);
  expect((await draft(page)).ratings).toEqual({produccion:3});
  await form.getByRole('button',{name:'Ir a Calificación General: sin calificar',exact:true}).click();
  await form.getByRole('button',{name:'Calificación General: 5 de 10',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'Reseñar',exact:true}).click();
  form=page.getByRole('group',{name:'Formulario de reseña',exact:true});
  await expect(form.getByRole('heading',{name:/Calificación General/})).toBeVisible();
  await expect(form.getByRole('button',{name:'Calificación General: 5 de 10',exact:true})).toHaveAttribute('aria-pressed','true');
  expect((await draft(page)).ratings).toEqual({produccion:3,general:5});
});

test('legacy drafts recover tracks without promoting the seven old defaults into real ratings',async({page})=>{
  const profile=await setup(page);
  await page.addInitScript(({profile,albumId})=>localStorage.setItem(`musiclub_draft_${albumId}`,JSON.stringify({userEmail:profile.email,ratings:{produccion:3,composicion:3,letras:3,originalidad:3,cohesion:3,replay:3,general:5},trackRatings:{'track-0':9},wizardStep:'tracks',currentTrackIndex:1,currentCriterionIndex:0})),{profile,albumId:albums[0].id});
  const form=await open(page);
  await expect(form.getByRole('heading',{name:'Segunda canción',exact:true})).toBeVisible();
  await form.getByRole('button',{name:'2. Criterios',exact:true}).click();
  await expect(form.getByRole('button',{name:/^Ir a .*sin calificar$/})).toHaveCount(7);
  await expect.poll(async()=> (await draft(page))?.ratings).toEqual({});
  expect((await draft(page)).trackRatings).toEqual({'track-0':9});
});
