import {test,expect} from '@playwright/test';
test('loop and speed toasts reflect successful controller changes',async({page})=>{
 await page.addInitScript(()=>{const property=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate')!;Object.defineProperty(HTMLMediaElement.prototype,'playbackRate',{...property,set(value:number){property.set!.call(this,value);(window as Window&{testPlaybackRate?:number}).testPlaybackRate=value;}});});
 await page.goto('/listen/2010-07/2010-07-p1-q02');const toast=page.locator('.player-toast').getByRole('status');
 const loop=page.getByRole('button',{name:'单句循环',exact:true});await expect(loop).toBeEnabled();
 await loop.click();await expect(toast).toHaveText('已开启单句循环');await expect(loop).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('l');await expect(toast).toHaveText('已关闭循环播放');await expect(loop).toHaveAttribute('aria-pressed','false');
 await page.locator('.speed-picker>summary').click();await page.locator('.speed-picker sakuga-radio').locator('label').filter({hasText:'1.25×'}).click();await expect(toast).toHaveText('播放速度：1.25×');expect(await page.evaluate(()=>(window as Window&{testPlaybackRate?:number}).testPlaybackRate)).toBe(1.25);
 await page.locator('.ab-controls').getByRole('button',{name:/^A /}).click();await expect(toast).toContainText('循环起点：');
 await page.locator('.ab-controls').getByRole('button',{name:/^B /}).click();await expect(page.locator('.control-error')).toContainText('先设置 A');await expect(toast).not.toHaveText('已开启 A–B 循环');
 const seek=page.getByRole('slider',{name:'播放位置',exact:true});const start=Number(await seek.inputValue());await seek.fill(String(start+3000));
 await page.locator('.ab-controls').getByRole('button',{name:/^B /}).click();await expect(toast).toHaveText('已开启 A–B 循环');
 await page.getByRole('button',{name:'清除循环',exact:true}).click();await expect(toast).toHaveText('已关闭循环播放');
});

for(const width of [1440,390])test(`toast is centred below navigation at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/listen/2010-07/2010-07-p1-q02');
 const loop=page.getByRole('button',{name:'单句循环',exact:true});await expect(loop).toBeEnabled();await loop.click();
 await expect(page.locator('.player-toast').getByRole('status')).toHaveText('已开启单句循环');
 const header=await page.locator('.app-header').boundingBox();const toast=await page.locator('.player-toast').boundingBox();
 expect(toast!.y).toBeGreaterThan(header!.y+header!.height);expect(Math.abs(toast!.x+toast!.width/2-width/2)).toBeLessThan(1);expect(toast!.x).toBeGreaterThanOrEqual(16);expect(toast!.x+toast!.width).toBeLessThanOrEqual(width-16);
});
