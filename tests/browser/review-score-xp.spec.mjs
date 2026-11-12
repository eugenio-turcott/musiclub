import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

test.beforeEach(async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});

for(const stale of [false,true])test(`weighted score survives the private review read${stale?' even with an outdated derived score':''}`,async({page})=>{
 const {own}=await communityAccount(page);
 const review={...own[0],comment:'La nota ponderada permanece al cargar mi reseña privada.',rating_produccion:4,rating_composicion:5,rating_letras:4,rating_originalidad:3,rating_cohesion:5,rating_replay:3,rating_general:10,track_ratings:Object.fromEntries([8,10,9,10,9,10,9,9].map((score,i)=>['score-track-'+i,score])),...(stale?{weighted_score:10}:{})};
 let privateReads=0;
 await page.route('**/rest/v1/reviews*',route=>{
  expect(route.request().method()).toBe('GET');privateReads++;
  return route.fulfill({json:new URL(route.request().url()).searchParams.get('album_id')==='eq.'+review.album_id?review:null});
 });
 await page.goto('/albumes/artista-de-prueba-azul');
 const card=page.locator('.community-review-card').filter({hasText:review.comment});
 await expect(card.getByLabel('Promedio ponderado de la reseña',{exact:true})).toHaveText(/9\.03/);
 await expect(card.getByLabel('General: 10 de 10',{exact:true})).toBeVisible();
 expect(privateReads).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Editar reseña',exact:true}).click();
 await expect(page.getByLabel('Promedio ponderado de tu reseña',{exact:true})).toContainText('9.03');
});

test('weighted score is also calculated for the public release snapshot',async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.goto('/albumes/artista-de-prueba-azul');
 const card=page.locator('.community-review-card').filter({hasText:'Miembro de Prueba'});
 await expect(card.getByLabel('Promedio ponderado de la reseña',{exact:true})).toHaveText(/8\.77/);
 await expect(card.getByLabel('General: 8 de 10',{exact:true})).toBeVisible();
});

test('FAQ explains five XP for each rated track',async({page})=>{
 await page.goto('/faq');await page.getByRole('button',{name:/¿Cómo funciona el Leaderboard y el Sistema de Puntuación XP\?/}).click();
 await expect(page.locator('#faq-answer-como-funciona-leaderboard')).toContainText('+5 XP');
 await expect(page.locator('#faq-answer-como-funciona-leaderboard')).not.toContainText('+2 XP');
});
