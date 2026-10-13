import { readFileSync } from 'node:fs';
import { expect,it } from 'vitest';
import { adaptExam,corpusManifestSchema,examSchema,audioIndexSchema,annotationsSchema,srtSchema,srtSentences } from '../../src/content/corpus';
import { sentenceIndex,seekable } from '../../src/audio/sentenceIndex';
import { playRange } from '../../src/audio/playRange';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
it('全32场适配保留992条题目和14541句，原文ID与顺序逐条一致',()=>{
  const manifest=corpusManifestSchema.parse(read('public/data/n1/manifest.json'));const catalog=audioIndexSchema.parse(read('public/data/audio-index.json'));
  let questions=0,sentences=0;
  for(const entry of manifest.exams){const raw=examSchema.parse(read(`public/data/n1/${entry.id}.json`));const paper=adaptExam(raw,catalog.exams[entry.id]?.primary);
    const original=raw.sections.flatMap(s=>s.questions).flatMap(q=>q.sentences);const adapted=paper.sections.flatMap(s=>s.questions).flatMap(q=>q.sentences);
    expect(adapted.map(s=>({id:s.id,text:s.text,startMs:s.startMs,endMs:s.endMs}))).toEqual(original.map(s=>({id:s.id,text:s.text,startMs:s.startMs,endMs:s.endMs})));
    expect(paper.audio.available).toBe(true);questions+=paper.sections.flatMap(s=>s.questions).length;sentences+=adapted.length;
  }
  expect(manifest.exams).toHaveLength(32);expect(questions).toBe(992);expect(sentences).toBe(14541);expect(manifest.exams.some(e=>e.id==='2020-07')).toBe(false);
});
it('首题19句既有词义保留，其他内容不会伪造',()=>{
  const raw=examSchema.parse(read('public/data/n1/2010-07.json'));const annotations=annotationsSchema.parse(read('public/data/annotations-2010-07.json'));const p=adaptExam(raw,undefined,annotations);
  expect(p.sections[0].questions[0].sentences.filter(s=>s.tokensStatus==='reviewed')).toHaveLength(19);expect(p.sections[0].questions[1].sentences.every(s=>s.tokens.length===0)).toBe(true);
});
it('null不转成0；未核时和冲突/插值不允许自动循环',()=>{
  const raw=examSchema.parse(read('public/data/n1/2010-12.json'));const p=adaptExam(raw);const lines=p.sections.flatMap(s=>s.questions).flatMap(q=>q.sentences);
  const missing=lines.find(s=>s.startMs===null)!;expect(missing.endMs).toBeNull();expect(seekable(missing)).toBe(false);expect(lines.every(s=>s.loopAllowed===false)).toBe(true);
  expect(playRange({playStartMs:null,playEndMs:null},10000)).toEqual({startMs:0,endMs:10000,wholeRecording:true});
});
it('原文乱序不重排；重叠区间不错误高亮',()=>{
  expect(sentenceIndex([{startMs:300,endMs:400},{startMs:null,endMs:null},{startMs:100,endMs:200}],150)).toBe(2);
  expect(sentenceIndex([{startMs:100,endMs:300},{startMs:200,endMs:400}],250)).toBeNull();
});
it('2025现场与AI版本采用各自独立录音与SRT',()=>{
  const audio=audioIndexSchema.parse(read('public/data/audio-index.json')).exams['2025-07'];const srt=srtSchema.parse(read('public/data/n1-srt/2025-07.json'));
  expect(audio.primary?.src).not.toBe(audio.ai?.src);expect(srt.primarySrt).toBe(audio.primary?.sourceSrt);
  const alt=srt.alternatives![audio.ai!.sourceSrt];expect(alt).toHaveLength(128);expect(srtSentences(alt,'2025-07','ai')[0].startMs).toBe(alt[0].startMs);expect(srt.segments.length).not.toBe(128);
});
