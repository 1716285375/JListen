import { test,expect } from '@playwright/test';
const route='/listen/jlpt-n1-2010-07/2010-07-p1-q01';
test('首页筛选、36题导航及友好404',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'真题题库',exact:true})).toBeVisible();await expect(page.locator('.question-link')).toHaveCount(41);
  await page.getByRole('button',{name:'即时应答',exact:true}).click();expect(await page.locator('.question-link').count()).toBe(15);
  await page.getByLabel('搜索题库').fill('不存在的内容');await expect(page.getByText('没有找到符合条件的题目')).toBeVisible();
  await page.goto('/missing');await expect(page.getByRole('heading',{name:'这一页走丢了。'})).toBeVisible();
});
test('真实录音、字幕定位、循环、盲听与临时听写',async({page})=>{
 await page.goto(route);await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled();
 const line=page.getByTestId('sentence').nth(2);const start=Number(await line.getAttribute('data-start'));
 await page.getByRole('button',{name:'定位第 3 句',exact:true}).click();
 const display=`${String(Math.floor(start/60000)).padStart(2,'0')}:${(start%60000/1000).toFixed(2).padStart(5,'0')}`;
 await expect(page.getByTestId('current-time')).toHaveText(display);
 await page.getByRole('button',{name:'单句循环',exact:true}).click();await expect(page.getByText('单句循环中',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'播放',exact:true}).click();await expect.poll(()=>page.getByTestId('current-time').innerText()).not.toBe(display);
 await page.getByRole('button',{name:'暂停',exact:true}).click();
 await page.getByRole('button',{name:'盲听',exact:true}).click();await expect(page.locator('.japanese')).toHaveCount(0);
 await page.getByRole('button',{name:'全文',exact:true}).click();await page.getByRole('button',{name:/本句听写/}).click();
 await page.getByRole('textbox',{name:'本句听写',exact:true}).fill('テスト');await page.getByRole('link',{name:'下一题',exact:true}).click();await expect(page.locator('textarea')).toHaveCount(0);
});
test('四种宽度截图，无横向溢出',async({page})=>{
  for(const width of [1440,1280,768,390]) {
    await page.setViewportSize({width,height:900});await page.goto('/');await expect(page.locator('.question-link').first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);await page.screenshot({path:`reports/library-${width}.png`,fullPage:true});
    await page.goto(route);await expect(page.getByRole('button',{name:width<1024?'底栏播放':'播放',exact:true})).toBeEnabled({timeout:30000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);await page.screenshot({path:`reports/listen-${width}.png`,fullPage:true});
    if(width<1024){
      await expect(page.getByRole('button',{name:'底栏播放',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'打开题目目录'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'关闭目录'}).click();
      await page.getByRole('button',{name:'显示假名',exact:true}).click();await expect(page.locator('.japanese rt').first()).toBeVisible();
      await page.screenshot({path:`reports/kana-${width}.png`,fullPage:true});
    }
  }
});
test('缺失音频友好错误、子题双答案与未知题目',async({page})=>{
  await page.route('**/audio/n1/2010-07/jlpt-n1-2010-07-listening.mp3',route=>route.fulfill({status:404,body:'Not found'}));
  await page.goto(route);await expect(page.getByRole('alert')).toContainText('此音频不可播放');await expect(page.getByRole('button',{name:'播放',exact:true})).toBeDisabled();
  await page.goto('/listen/jlpt-n1-2010-07/2010-07-p5-q03');await page.getByText('原题参考与来源答案',{exact:true}).click();await expect(page.getByText('『ネオ銀行の再生』',{exact:true})).toBeVisible();await expect(page.getByText('『ハードアンドソフト』',{exact:true})).toBeVisible();
  await page.goto('/listen/jlpt-n1-2010-07/unknown');await expect(page.getByRole('heading',{name:'这一页走丢了。'})).toBeVisible();
});

test('试听只播放本句一次，未标定句界定位关联片段',async({page,request})=>{
 const paper=await(await request.get('/data/unified/2020-12.json')).json();const q=paper.sections[0].questions.find((q:{id:string})=>q.id==='2020-12-p1-q01');
 await page.goto('/listen/2020-12/2020-12-p1-q01');await expect(page.getByRole('button',{name:'试听本句',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'试听本句',exact:true}).click();await expect(page.getByRole('button',{name:'暂停',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'播放',exact:true})).toBeVisible({timeout:10000});
 const expected=q.sentences[0].endMs;const displayed=await page.getByTestId('current-time').innerText();const [min,sec]=displayed.split(':').map(Number);expect(Math.abs((min*60+sec)*1000-expected)).toBeLessThan(20);
 await page.goto('/listen/2011-07/2011-07-p1-q01');await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled();
 const source=await(await request.get('/data/unified/2011-07.json')).json();const related=source.sections[0].questions[1].sentences[5].sourceWindowStartMs;
 await page.getByRole('button',{name:'定位关联片段：第 6 句',exact:true}).click();
 const expectedTime=`${String(Math.floor(related/60000)).padStart(2,'0')}:${(related%60000/1000).toFixed(2).padStart(5,'0')}`;await expect(page.getByTestId('current-time')).toHaveText(expectedTime);await page.getByRole('button',{name:'单句',exact:true}).click();
 await expect(page.locator('.japanese')).toHaveText('前回見たときは研究の背景のところが不十分だったけど、そこは今回だいぶ良くなったんじゃないかしら。');await expect(page.getByRole('button',{name:'试听本句',exact:true})).toBeDisabled();
});

test('全文定位关联录音清除旧循环，单句在共享片段和字幕空档持续显示',async({page,request})=>{
 const paper=await(await request.get('/data/unified/2011-07.json')).json();const q=paper.sections[1].questions[2];
 await page.goto('/listen/2011-07/2011-07-p2-q02');await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:/A 设起点/}).click();await page.getByLabel('播放位置').press('End');await page.getByRole('button',{name:/B 设终点/}).click();
 await expect(page.getByText('A–B 循环中',{exact:true})).toBeVisible();
 await page.getByTestId('sentence').nth(14).locator('.japanese').click();
 await expect(page.getByRole('button',{name:'清除循环',exact:true})).toHaveCount(0);
 const related=q.sentences[14].sourceWindowStartMs;const expected=`${String(Math.floor(related/60000)).padStart(2,'0')}:${(related%60000/1000).toFixed(2).padStart(5,'0')}`;
 await expect(page.getByTestId('current-time')).toHaveText(expected);
 await page.getByRole('button',{name:'单句',exact:true}).click();await expect(page.locator('.japanese')).toHaveText(q.sentences[14].text);
 await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(600);await expect(page.locator('.japanese')).toHaveText(q.sentences[14].text);
 await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByLabel('播放位置').press('Home');await page.getByLabel('播放位置').press('ArrowRight');
 await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(1400);
 await expect(page.locator('.japanese')).toHaveCount(1);await expect(page.locator('.japanese')).not.toBeEmpty();
});
