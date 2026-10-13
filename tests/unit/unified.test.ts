import { readFileSync,existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { it,expect } from 'vitest';
import { paperSchema } from '../../src/content/schemas';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('整合库32场、全部假名、例题独立音频和原ASR时间戳',()=>{
 const manifest=read('public/data/n1/manifest.json');
 for(const exam of manifest.exams){
  const raw=read(`public/data/unified/${exam.id}.json`);const paper=paperSchema.parse(raw);
  const paths=new Map<string,Map<number,{start:number,end:number}>>();
  const timestamps=(id:string)=>{
   if(paths.has(id))return paths.get(id)!;
   const data=read(`public/data/unified/${id}.json`);const result=new Map<number,{start:number,end:number}>();
   readFileSync(data.sources.asr,'utf8').split(/\r?\n/).forEach((line,index)=>{const m=line.match(/^\[(\d+):(\d+):(\d+)\.(\d+)\s*→\s*(\d+):(\d+):(\d+)\.(\d+)\]/);if(m){const v=m.slice(1).map(Number);result.set(index+1,{start:((v[0]*60+v[1])*60+v[2])*1000+v[3],end:((v[4]*60+v[5])*60+v[6])*1000+v[7]});}});paths.set(id,result);return result;
  };
  for(const section of paper.sections){
   expect(section.questions[0].kind).toBe('example');
   for(const q of section.questions)for(const s of q.sentences){
    expect(s.furiganaTokens?.map(t=>t.surface).join('')).toBe(s.text);
    expect(s.furiganaTokens?.filter(t=>/[一-龯]/.test(t.surface)).every(t=>t.reading&&!/[一-龯]/.test(t.reading))).toBe(true);
    // Manually reviewed shared examples can join several subtitle cues.
    if(!raw.documentReview&&!s.timingSubtitleSource){
     const original=timestamps(s.sourceExamId??exam.id).get(s.sourceAsrLines[0])!;
     expect([s.startMs,s.endMs]).toEqual([original.start,original.end]);
    }
    if(s.endMs!==null)expect(s.endMs).toBeLessThanOrEqual((q.audioOverride??paper.audio).durationMs!);else expect(s.loopAllowed).toBe(false);
    if(s.sourceExamId)expect(q.audioOverride?.src).toContain(s.sourceExamId);
   }
  }
 }
 expect(manifest.exams).toHaveLength(32);
});
it('提供的文本来源未改写，识别环境已移除',()=>{
 for(const [resource,hash] of Object.entries(read('scripts/source-fingerprints.json')))expect(createHash('sha256').update(readFileSync(`public/${resource}`)).digest('hex')).toBe(hash);
 // Local source documents are excluded from Git; their audit remains available locally.
 if(existsSync('reports/unified-build.json'))for(const source of read('reports/unified-build.json').sources)expect(createHash('sha256').update(readFileSync(source.path)).digest('hex')).toBe(source.sha256);
 expect(existsSync('.venv-align')).toBe(false);expect(existsSync('scripts/benchmark-aligner.py')).toBe(false);
});
it('33份录音使用唯一英文文件名，现场版与AI版明确区分',()=>{
 const catalog=read('public/data/audio-index.json');const files:string[]=[];
 for(const [exam,variants] of Object.entries(catalog.exams))for(const [variant,asset] of Object.entries(variants as Record<string,{src:string;sourceFile:string}>)){
   const suffix=variant==='ai'?'-ai':exam==='2025-07'?'-live':'';
   const filename=`jlpt-n1-${exam}-listening${suffix}.mp3`;
   expect(asset.sourceFile).toBe(filename);expect(asset.src).toBe(`audio/n1/${exam}/${filename}`);files.push(asset.src);
 }
 expect(files).toHaveLength(33);expect(new Set(files).size).toBe(33);
});
