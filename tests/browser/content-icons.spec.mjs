import {test,expect} from '@playwright/test';
import {REVIEW_CRITERIA} from '../../src/utils/reviewCriteria.mjs';

test.beforeEach(async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});
const colors=locator=>locator.evaluateAll(elements=>elements.map(el=>getComputedStyle(el).color));

test('home uses distinct icon accents and keeps recommended genres at the upper right of the cover',async({page},info)=>{
 await page.goto('/');
 const stats=page.getByRole('region',{name:'Musiclub en cifras',exact:true});
 await expect(stats.locator('[data-ui-icon]')).toHaveCount(4);
 expect(new Set(await colors(stats.locator('[data-ui-icon]'))).size).toBe(4);
 const nav=page.getByRole('navigation',{name:'Demostraciones de Musiclub',exact:true});
 expect(new Set(await colors(nav.locator('a > [data-ui-icon]:not([data-ui-icon="arrow"])'))).size).toBe(3);
 expect(new Set(await colors(page.locator('[class*="xpPath"] > div > [data-ui-icon]'))).size).toBe(3);
 const cover=page.locator('[data-hourly-cover]');await expect(cover).toBeVisible();
 const geometry=await cover.evaluate(el=>{
  const box=el.getBoundingClientRect(),genres=el.querySelector('[data-release-genres]').getBoundingClientRect(),type=el.querySelector('[data-hourly-release-type]').getBoundingClientRect();
  return {right:box.right-genres.right,top:genres.top-box.top,separate:genres.left>=type.right};
 });
 expect(geometry.right).toBeGreaterThan(5);expect(geometry.right).toBeLessThan(22);
 expect(geometry.top).toBeGreaterThan(5);expect(geometry.top).toBeLessThan(22);expect(geometry.separate).toBe(true);
 await stats.scrollIntoViewIfNeeded();await page.screenshot({path:`outputs/v11-1-4-icons-${info.project.name}.png`,animations:'disabled'});
});

test('all guide chapters have accented icons while criteria and achievement badges retain their own ink',async({page},info)=>{
 await page.goto('/guias');
 await expect(page.locator('[data-tour-chapter]')).toHaveCount(20);
 const headings=page.locator('[data-tour-chapter] [class*="chapterIcon"] [data-ui-icon]');
 await expect(headings).toHaveCount(20);
 for(const color of await colors(headings))expect(['rgb(255, 255, 255)','rgb(248, 244, 255)']).not.toContain(color);
 for(const id of ['catalogo','resenas','niveles'])expect(new Set(await colors(page.locator(`#${id} [class*="steps"] [data-ui-icon]`))).size).toBeGreaterThanOrEqual(2);
 const criteria=page.locator('#resenas [class*="demoCriteria"] label');
 const actual=await colors(criteria.locator('[data-ui-icon]'));
 const expected=await page.evaluate(palette=>palette.map(color=>{const canvas=document.createElement('canvas'),context=canvas.getContext('2d');context.fillStyle=color;const hex=context.fillStyle;return `rgb(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)})`;}),REVIEW_CRITERIA.map(c=>c[4]));
 expect(actual).toEqual(expected);
 const badges=await page.locator('[data-achievement-badge] [data-badge-icon] .ui-icon').evaluateAll(elements=>elements.map(el=>({icon:getComputedStyle(el).color,emblem:getComputedStyle(el.parentElement).color})));
 expect(badges.length).toBeGreaterThan(0);for(const badge of badges){expect(badge.icon).toBe(badge.emblem);expect(['rgb(0, 0, 0)','rgb(255, 255, 255)']).toContain(badge.icon);}
 await page.getByRole('navigation',{name:'Capítulos de la guía'}).getByRole('link',{name:'Catálogo',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`outputs/v11-1-4-guide-${info.project.name}.png`,animations:'disabled'});
});
