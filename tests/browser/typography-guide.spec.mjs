import {test,expect} from '@playwright/test';
import {communityAccount} from './community-session.mjs';

test.beforeEach(async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});

test('the review guide includes every real track, updates its local score and keeps each chapter independent',async({page})=>{
 await page.goto('/guias#resenas');
 const review=page.locator('#resenas'),editor=review.locator('[data-track-rating-example]');
 await expect(editor.locator('[data-tour-track]')).toHaveCount(3);
 const original=await review.locator('output').first().innerText(),requests=[];
 page.on('request',r=>{if(/\/rest\/v1\/|\/api\//.test(r.url()))requests.push(r.method()+' '+r.url());});
 await editor.getByRole('slider',{name:'Nota de ejemplo de Canción de prueba',exact:true}).press('Home');
 await expect(editor.getByRole('slider',{name:'Nota de ejemplo de Canción de prueba',exact:true})).toHaveValue('1');
 await expect.poll(()=>review.locator('output').first().innerText()).not.toBe(original);
 await editor.getByRole('button',{name:'Favorita de ejemplo: Tercera canción',exact:true}).click();
 await expect(editor.getByRole('button',{name:'Favorita de ejemplo: Tercera canción',exact:true})).toHaveAttribute('aria-pressed','true');
 const separate=page.locator('#canciones [data-track-rating-example]');
 await expect(separate.getByRole('slider',{name:'Nota de ejemplo de Canción de prueba',exact:true})).toHaveValue('9');
 await expect(separate.getByRole('button',{name:'Favorita de ejemplo: Segunda canción',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(requests).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('heading ink fits its paint box across the public pages and account views',async({page},info)=>{
 test.setTimeout(180000);
 await communityAccount(page);
 const routes=['/','/guias','/catalogo','/reviews','/leaderboard','/albumes/artista-de-prueba-azul','/generos/pop','/pool','/portadas','/faq','/patch-notes','/privacy','/terms','/profile','/settings'];
 const failures=[];
 for(const route of routes){
  await page.goto(route);await expect(page.getByRole('heading',{level:1}).first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const issues=await page.evaluate(()=>{
   const context=document.createElement('canvas').getContext('2d'),issues=[];
   for(const element of document.querySelectorAll('h1,h2,h3,h4,h5,h6,[data-gradient-text],.bg-clip-text')){
    const style=getComputedStyle(element),box=element.getBoundingClientRect(),text=element.textContent.trim();
    if(!text||box.width===0||box.height===0||style.display==='none'||style.visibility==='hidden')continue;
    if(style.textOverflow==='ellipsis'||Number(style.webkitLineClamp)>0)continue;
    const range=document.createRange();range.selectNodeContents(element);
    const lines=[...range.getClientRects()].filter(r=>r.width>0);
    if(!lines.length||Math.max(...lines.map(r=>r.top))-Math.min(...lines.map(r=>r.top))>parseFloat(style.fontSize)*.4)continue;
    context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.letterSpacing=style.letterSpacing==='normal'?'0px':style.letterSpacing;
    const ink=context.measureText(text),gradient=style.backgroundClip==='text';
    // Background-clip paints only inside the element, including its padding.
    if(gradient&&ink.actualBoundingBoxRight>box.width-parseFloat(style.paddingLeft)+1)issues.push({text:text.slice(0,90),kind:'right ink',ink:ink.actualBoundingBoxRight,width:box.width});
    if(ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent>box.height+1)issues.push({text:text.slice(0,90),kind:'vertical ink',height:box.height});
   }
   return issues;
  });
  failures.push(...issues.map(issue=>({route,...issue})));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
 }
 expect(failures).toEqual([]);
 await page.goto('/guias');await page.screenshot({path:`outputs/v11-1-3-guide-${info.project.name}.png`,animations:'disabled'});
});
