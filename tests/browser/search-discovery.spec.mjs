import {test,expect} from '@playwright/test';
async function account(page,admin=true){
 const user={id:'00000000-0000-4000-8000-000000000081',email:admin?'eugenioturcott@gmail.com':'member@example.test',user_metadata:{full_name:'Administrador de prueba'},app_metadata:{provider:'google'},aud:'authenticated',created_at:'2026-10-01T00:00:00Z'};
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.addInitScript(user=>{const expiry=Math.floor(Date.now()/1000)+3600,payload=btoa(JSON.stringify({sub:user.id,exp:expiry}));localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.fixture-only`,refresh_token:'fixture-only',expires_at:expiry,expires_in:3600,token_type:'bearer',user}));},user);
 await page.route('**/auth/v1/user',route=>route.fulfill({json:user}));await page.route('**/rest/v1/profiles*',route=>route.fulfill({json:{...user,name:'Administrador de prueba',role:admin?'admin':'user'}}));
}
test('publication dashboard verifies and retries only on deliberate actions, stays responsive and never claims Google indexed a page',async({page},info)=>{
 await account(page);let reads=0,actions=[];
 const data={summary:{pending:1,verified:0,attention:1},entries:[{album_id:'a',album_name:'OSCURO ÉXTASIS',artist_name:'WOS',status:'pending',attempts:0,requested_at:'2026-11-12T18:00:00Z'},{album_id:'b',album_name:'LAHAI',artist_name:'Sampha',status:'attention',attempts:8,last_error:'page_unavailable',requested_at:'2026-11-12T17:00:00Z'}]};
 await page.route('**/api/search-discovery',route=>{
  if(route.request().method()==='GET'){reads++;return route.fulfill({json:data});}
  const action=route.request().postDataJSON().action;actions.push(action);const target=action==='process'?data.entries[0]:data.entries[1];Object.assign(target,{status:'verified',result_kind:'listed',verified_at:'2026-11-12T18:05:00Z',public_url:'https://www.musiclub.org/albumes/wos-oscuro-extasis',sitemap_url:'https://www.musiclub.org/sitemap-reviews.xml',last_error:null});data.summary=action==='process'?{pending:0,verified:1,attention:1}:{pending:0,verified:2,attention:0};return route.fulfill({json:{claimed:1,verified:1,retry:0,deferred:0}});
 });
 await page.goto('/admin/publicacion');await expect(page.getByRole('heading',{name:'Publicación en Google',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Comprobar pendientes',exact:true})).toBeEnabled();await expect(page.getByText('Google decide cuándo rastrearla e indexarla.',{exact:false})).toBeVisible();expect(reads).toBe(1);expect(actions).toEqual([]);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForLoadState('networkidle');expect(reads).toBe(1);
 await page.getByRole('button',{name:'Comprobar pendientes',exact:true}).click();await expect(page.getByRole('status')).toContainText('1 fichas verificadas');await expect(page.getByText('Publicada en sitemap',{exact:true})).toHaveCount(1);expect(actions).toEqual(['process']);await expect(page.getByRole('button',{name:'Comprobar pendientes',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Reintentar fallidos',exact:true}).click();await expect(page.getByText('Publicada en sitemap',{exact:true})).toHaveCount(2);expect(actions).toEqual(['process','retry']);await expect(page.getByRole('button',{name:'Reintentar fallidos',exact:true})).toBeDisabled();
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.setViewportSize(info.project.name==='mobile'?{width:393,height:851}:{width:1440,height:1000});await page.screenshot({path:`outputs/v12-0-5-publicacion-${info.project.name}.png`,animations:'disabled'});
});
test('a member cannot view or query the private publication ledger',async({page})=>{
 await account(page,false);let reads=0;await page.route('**/api/search-discovery',route=>{reads++;return route.fulfill({status:403,json:{error:'Forbidden'}});});await page.goto('/admin/publicacion');await expect(page.getByRole('heading',{name:'Acceso de administración',exact:true})).toBeVisible();expect(reads).toBe(0);
});
