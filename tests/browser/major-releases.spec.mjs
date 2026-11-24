import {test,expect} from '@playwright/test';
test('version page shows one consolidated release per major and includes current filters',async({page})=>{
 let commits=0;
 await page.route('https://api.github.com/**',route=>{commits++;return route.abort();});
 await page.goto('/patch-notes');
 await page.getByRole('button',{name:'V12.x',exact:true}).click();
 await expect(page.getByText('V.12.0.0',{exact:true})).toHaveCount(2);
 await expect(page.getByText('V.12.2.2',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Grammy 2027 y el año del club',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'V10.x',exact:true}).click();
 await expect(page.getByText('Tu música también se comparte',{exact:true})).toBeVisible();
 await expect(page.getByText('Grammy 2027 y el año del club',{exact:true})).toHaveCount(0);
 expect(commits).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
