import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

async function setup(page,{genres=[],holdDetail}={}){
 await communityAccount(page);
 const metrics={details:0,writes:[]};
 const record={id:123,title:'Before The World Blows',artist:{name:'Artista remoto'},record_type:'album',nb_tracks:8,cover_xl:'/musiclub_logo.png',release_date:'2026-11-01',genres:{data:genres.map(name=>({name}))},tracks:{data:[{id:111,title:'Canción real de prueba',duration:180,track_position:1}]}};
 await page.route('**/api/spotify?*',route=>route.fulfill({json:{albums:{items:[]}}}));
 await page.route('https://api.deezer.com/**',async route=>{
  const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
  const detail=url.pathname==='/album/123';if(detail)metrics.details++;
  if(detail && holdDetail) await holdDetail;
  const data=detail?record:{data:url.searchParams.get('q')?.includes('Azul')?[]:[record]};
  return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify(data)});`});
 });
 await page.route('**/rest/v1/albums*',route=>{
  if(route.request().method()==='POST'){
   const payload=route.request().postDataJSON();metrics.writes.push(payload);
   return route.fulfill({json:{...payload[0],id:'remote-search-fixture'}});
  }
  return route.fulfill({json:[]});
 });
 await page.goto('/');
 // The header search is available in the mobile menu too.
 const toggle=page.getByRole('button',{name:'Buscar álbum',exact:true}).filter({visible:true});
 await toggle.click();
 const input=page.getByPlaceholder('Escribe el nombre del álbum o artista...', {exact:true});
 await input.fill('Before The World');
 await page.getByText('Before The World Blows',{exact:true}).click();
 return {metrics,input};
}

test('a release without source genres can be completed once, retaining tracks without repeating provider reads',async({page},info)=>{
 const {metrics}=await setup(page);
 const form=page.getByRole('form',{name:'Completar género del release'});
 await expect(form).toBeVisible();expect(metrics.writes).toHaveLength(0);
 await expect(form.locator('.animate-spin')).toHaveCount(0);
 await expect(form.getByRole('button',{name:'Continuar al release'})).toBeDisabled();
 const reads=metrics.details;
 await form.getByLabel('Buscar género',{exact:true}).fill('R&B');
 await form.getByLabel('Género del release',{exact:true}).selectOption({label:'R&B'});
 await page.screenshot({path:`outputs/search-genre-${info.project.name}.png`});
 await form.getByRole('button',{name:'Continuar al release'}).click();
 await expect(page).toHaveURL(/\/albumes\/artista-remoto-before-the-world-blows/);
 expect(metrics.writes).toHaveLength(1);expect(metrics.writes[0][0].genres).toEqual(['R&B']);
 expect(metrics.writes[0][0].tracks[0].name).toBe('Canción real de prueba');expect(metrics.details).toBe(reads);
});

test('changing the search clears the missing-genre notice and opens an existing release without writing',async({page})=>{
 const {metrics,input}=await setup(page);
 await expect(page.getByRole('form',{name:'Completar género del release'})).toBeVisible();
 await input.fill('Azul');
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
 await page.getByText('Azul',{exact:true}).filter({visible:true}).last().click();
 await expect(page).toHaveURL(/\/albumes\/artista-de-prueba-azul/);expect(metrics.writes).toHaveLength(0);
});

test('a recognized source genre opens directly without asking for a classification',async({page})=>{
 const {metrics}=await setup(page,{genres:['Hip Hop']});
 await expect(page).toHaveURL(/\/albumes\/artista-remoto-before-the-world-blows/);
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
 expect(metrics.writes).toHaveLength(1);expect(metrics.writes[0][0].genres).toEqual(['Hip-Hop']);
});

test('changing query while release details are pending prevents a late notice or insert',async({page})=>{
 let resume;const holdDetail=new Promise(resolve=>{resume=resolve;});
 const {metrics,input}=await setup(page,{holdDetail});
 await expect.poll(()=>metrics.details).toBe(1);
 await input.fill('Azul');resume();
 await page.getByText('Azul',{exact:true}).filter({visible:true}).last().click();
 await expect(page).toHaveURL(/\/albumes\/artista-de-prueba-azul/);
 await expect(page.getByRole('form',{name:'Completar género del release'})).toHaveCount(0);
 expect(metrics.writes).toHaveLength(0);
});
