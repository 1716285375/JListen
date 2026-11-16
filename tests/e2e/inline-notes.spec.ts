import { test,expect } from '@playwright/test';
for(const width of [1440,390]) test(`inline word notes at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/listen/2010-07/2010-07-p1-q02');
 await expect(page.locator('.desktop-inspector,.drawer-right')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'打开语言解析',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'单句',exact:true}).click();
 const box=await page.locator('.single-sentence-list').boundingBox();
 await page.locator('.word').first().click();await expect(page.locator('.word-popover')).toBeVisible();
 const card=await page.locator('.word-popover').boundingBox();expect(card!.x).toBeGreaterThanOrEqual(0);expect(card!.x+card!.width).toBeLessThanOrEqual(width);expect(card!.y).toBeGreaterThanOrEqual(0);expect(card!.y+card!.height).toBeLessThanOrEqual(900);
 await expect(page.getByRole('button',{name:'关闭词义',exact:true})).toBeInViewport();
 await page.keyboard.press('Escape');await expect(page.locator('.word-popover')).toHaveCount(0);
 await page.locator('.inline-notes summary').click();await expect(page.locator('.inline-notes')).toHaveAttribute('open','');
 expect((await page.locator('.single-sentence-list').boundingBox())!.height).toBe(box!.height);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
