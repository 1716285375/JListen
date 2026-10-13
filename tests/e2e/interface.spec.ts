import { test,expect } from '@playwright/test';
test('language persists and sentence navigation keeps the workspace still',async({page})=>{
 await page.goto('/listen/2010-07/2010-07-p1-q01');
 await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled();
 await expect(page.getByRole('link',{name:'使用说明',exact:true})).toHaveText('');
 await page.getByRole('button',{name:'Switch to English',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.getByRole('button',{name:'Full text',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Sentence',exact:true}).click();
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  const before=await page.locator('.dictation').evaluate(el=>el.getBoundingClientRect().top+scrollY);
  for(let i=0;i<6;i++)await page.getByRole('button',{name:width<1024?'Next sentence (bottom bar)':'Next sentence',exact:true}).click();
  await page.getByRole('button',{name:'Show readings',exact:true}).click();
  const after=await page.locator('.dictation').evaluate(el=>el.getBoundingClientRect().top+scrollY);
  expect(Math.abs(after-before)).toBeLessThan(1);
  await expect(page.locator('.single-gap')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Hide readings',exact:true}).click();
 }
 await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.getByRole('button',{name:'切换为中文',exact:true}).click();
 await expect(page.getByRole('button',{name:'单句',exact:true})).toBeVisible();
});

test('changing a long sentence resets its own scroll position',async({page})=>{
 await page.setViewportSize({width:390,height:900});
 await page.goto('/listen/2013-12/2013-12-p5-q03');
 await expect(page.getByRole('button',{name:'底栏播放',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'全文',exact:true}).click();
 await page.getByTestId('sentence').nth(20).locator('.japanese').click();
 await page.getByRole('button',{name:'单句',exact:true}).click();
 await page.getByRole('button',{name:'显示假名',exact:true}).click();
 const sentences=page.locator('.single-sentence-list');
 const scrolled=await sentences.evaluate(el=>{el.scrollTop=60;return el.scrollTop;});
 expect(scrolled).toBeGreaterThan(0);
 await page.getByRole('button',{name:'底栏下一句',exact:true}).click();
 await expect.poll(()=>sentences.evaluate(el=>el.scrollTop)).toBe(0);
});
