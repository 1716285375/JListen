import {test,expect} from '@playwright/test';
test('Sakuga palette, native controls and impact effects',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');
 await expect(page.getByRole('heading',{name:'真题题库',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim())).toBe('#1D1A4A');
 await page.getByRole('button',{name:'重点理解',exact:true}).click();await expect(page.locator('canvas.sakuga-fx')).toHaveCount(1);
 expect(await page.locator('canvas.sakuga-fx').evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
 await page.screenshot({path:'reports/sakuga-home.png',fullPage:true});
 await page.goto('/listen/2010-07/2010-07-p1-q02');await page.getByRole('button',{name:'查看本句解析',exact:true}).click();await page.locator('.analysis-reference>summary').click();
 await page.screenshot({path:'reports/sakuga-listening.png',fullPage:true});
});
test('reduced motion suppresses canvas reactions',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'重点理解',exact:true}).click();await expect(page.locator('canvas.sakuga-fx')).toHaveCount(0);
});
