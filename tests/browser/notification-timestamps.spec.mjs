import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

test('an old release continuation displays its delivery date and keeps it on refresh',async({page})=>{
 await communityAccount(page,{expiresAt:Date.parse('2099-01-01')/1000});
 await page.clock.install({time:new Date('2026-11-27T18:00:00Z')});
 let calls=0;
 await page.route('**/api/reviews/continuations*',route=>route.fulfill({json:{continuations:[{id:'continue-review:old-release',title:'Release antiguo',createdAt:'2020-01-01T00:00:00Z',matchedTracks:6,totalTracks:8,link:'/catalogo'}]}}));
 await page.route('**/api/notifications/timestamps',route=>{calls++;const body=route.request().postDataJSON();expect(body.userId).toBe('00000000-0000-4000-8000-000000000081');return route.fulfill({json:{receipts:body.ids.map(notification_id=>({notification_id,sent_at:'2026-11-27T17:00:00Z'}))}});});
 await page.goto('/catalogo');await expect.poll(()=>calls).toBeGreaterThan(0);
 await page.getByRole('button',{name:/Abrir centro de notificaciones/}).click();
 const heading=page.getByRole('heading',{name:'Release antiguo',exact:true});await expect(heading).toBeVisible();
 const time=heading.locator('..').locator('time[title="Fecha de envío de la notificación"]');
 await expect(time).toHaveAttribute('datetime','2026-11-27T17:00:00Z');await expect(time).toContainText('Hace 1 h');
 await page.getByRole('button',{name:'Actualizar',exact:true}).click();await expect.poll(()=>calls).toBeGreaterThan(1);
 await expect(time).toHaveAttribute('datetime','2026-11-27T17:00:00Z');
});

test('notification timestamps require authentication',async({request})=>{
 const response=await request.post('/api/notifications/timestamps',{data:{ids:['continue-review:private'],userId:'someone-else'}});
 expect(response.status()).toBe(401);expect(await response.text()).not.toContain('sent_at');
});
