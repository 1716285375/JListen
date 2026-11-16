import {test,expect} from '@playwright/test';
for(const width of [1440,390])test(`Sakuga controls serve existing features without records at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/listen/2010-07/2010-07-p1-q02');
 await expect(page.getByRole('region',{name:'学习记录'})).toHaveCount(0);await expect(page.locator('sakuga-rating')).toHaveCount(0);
 await page.getByRole('tab',{name:'单句',exact:true}).click();await expect(page.getByRole('tabpanel')).toBeVisible();
 await page.locator('.speed-picker>summary').click();await page.locator('.speed-picker sakuga-radio').locator('label').filter({hasText:'1.25×'}).click();await expect(page.locator('.speed-picker>summary')).toHaveText('1.25×');
 await page.locator('.volume-control').getByRole('slider',{name:'音量',exact:true}).fill('35');await expect(page.locator('.volume-control').getByRole('slider')).toHaveValue('35');
 await page.getByRole('button',{name:/本句听写/}).click();await page.getByRole('textbox',{name:'本句听写',exact:true}).fill('rfl []');
 await page.locator('.dictation sakuga-checkbox').locator('label').click();await expect(page.locator('.dictation-comparison')).toBeVisible();
 await page.getByRole('button',{name:'清空输入',exact:true}).click();await expect(page.getByRole('textbox',{name:'本句听写',exact:true})).toHaveValue('');await expect(page.locator('.player-toast').getByRole('status')).toHaveText('已清空听写');
 expect(await page.evaluate(()=>localStorage.getItem('jlisten-study-records'))).toBeNull();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await page.waitForTimeout(1200); // Capture the settled state after the original canvas effects.
 await page.screenshot({path:`reports/sakuga-stateless-${width}.png`,fullPage:true});
 await page.goto('/');await page.getByRole('textbox',{name:'搜索题库',exact:true}).fill('不存在的内容');await expect(page.getByText('没有找到符合条件的题目')).toBeVisible();
});
