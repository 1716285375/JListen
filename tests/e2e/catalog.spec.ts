import { test,expect } from '@playwright/test';
test('JListen名称、32场目录及按需加载',async({page})=>{
  const fetched:string[]=[];page.on('request',r=>{if(/\/data\/unified\/\d{4}-\d{2}\.json/.test(r.url()))fetched.push(r.url());});
  await page.goto('/');await expect(page).toHaveTitle('JListen · 日语逐句精听');await expect(page.locator('.question-link')).toHaveCount(41);
  await expect(page.getByLabel('考试场次').locator('option')).toHaveCount(32);expect(fetched).toHaveLength(1);
  await page.getByLabel('年份',{exact:true}).selectOption('2026');await expect(page.locator('.question-link')).toHaveCount(34);await expect(page.locator('.paper-heading')).toContainText('2026');
  await page.getByLabel('年份',{exact:true}).selectOption('2020');await expect(page.getByLabel('考试场次').locator('option')).toHaveCount(1);await expect(page.getByLabel('考试场次')).toHaveValue('2020-12');
});
test('32场真实录音均能载入和播放，深链不白屏',async({page,request})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const manifest=await(await request.get('/data/n1/manifest.json')).json();
  for(const exam of manifest.exams){const data=await(await request.get(exam.url)).json();const first=data.sections[0].questions[0];
    await page.goto(`/listen/${exam.id}/${first.id}`);await expect(page.getByRole('heading',{name:/第 01 题/})).toBeVisible();await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled({timeout:30000});
    const before=await page.getByTestId('current-time').innerText();await page.getByRole('button',{name:'播放',exact:true}).click();await expect(page.getByRole('button',{name:'暂停',exact:true})).toBeVisible();
    await expect.poll(()=>page.getByTestId('current-time').textContent(),{timeout:10000}).not.toBe(before);await page.getByRole('button',{name:'暂停',exact:true}).click();
  }
  expect(errors).toEqual([]);
});
test('整合原文、全句假名和跨试卷切换',async({page})=>{
 await page.goto('/listen/2026-07/2026-07-p1-q01');
 await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled();
 await expect(page.locator('.source-mode')).toHaveCount(0);
 await page.getByRole('button',{name:'显示假名',exact:true}).click();
 expect(await page.locator('.japanese rt').count()).toBeGreaterThan(20);
 await page.getByRole('button',{name:'定位第 3 句',exact:true}).click();
 await expect(page.getByRole('button',{name:'单句循环',exact:true})).toBeEnabled();
 await page.getByLabel('切换考试').first().selectOption('2024-07');
 await expect(page).toHaveURL(/2024-07-p1-example/);
 await expect(page.getByRole('heading',{name:/题型说明与例题/})).toBeVisible();
});
test('通用例题使用标注来源的录音',async({page})=>{
 const media:string[]=[];page.on('request',r=>{if(r.url().includes('/audio/n1/'))media.push(r.url());});
 await page.goto('/listen/2013-12/2013-12-p2-example');
 await expect(page.getByRole('heading',{name:/通用例题/})).toBeVisible();
 await expect(page.locator('.audio-heading')).toContainText('2010 年 7 月');
 await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled();
 expect(media.some(u=>u.includes('/2010-07/jlpt-n1-2010-07-listening.mp3'))).toBe(true);
});
