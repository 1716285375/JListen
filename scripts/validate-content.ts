import { readFileSync,existsSync,mkdirSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadEnv } from 'vite';
import { audioUrl } from '../src/platform/assetUrl';
import { corpusManifestSchema,examSchema,audioIndexSchema,annotationsSchema,adaptExam,srtSchema } from '../src/content/corpus';
import { paperSchema } from '../src/content/schemas';
import { validatePaper,allSentences } from '../src/content/validate';
const release=process.argv.includes('--release');const errors:string[]=[];
const read=(file:string)=>JSON.parse(readFileSync(file,'utf8'));
const manifest=corpusManifestSchema.parse(read('public/data/n1/manifest.json'));
const audio=audioIndexSchema.parse(read('public/data/audio-index.json'));
const annotations=annotationsSchema.parse(read('public/data/annotations-2010-07.json'));
const fingerprints:Record<string,string>=read('scripts/source-fingerprints.json');
const remoteAudio=process.env.VITE_AUDIO_BASE_URL??loadEnv('production',process.cwd(),'VITE_').VITE_AUDIO_BASE_URL??'';
if(remoteAudio)audioUrl('audio/n1/2010-07/jlpt-n1-2010-07-listening.mp3',remoteAudio);
const rows:Record<string,unknown>[]=[];const ids=new Set<string>();let questions=0,sentences=0,segments=0;
const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
function assetFile(resource:string){const root=path.resolve('public');const resolved=path.resolve(root,resource.replace(/^\/+/,''));if(!resolved.startsWith(root+path.sep))throw new Error('资源路径逃逸 public');return resolved;}
for(const entry of manifest.exams){
  const file=assetFile(entry.url);const input=examSchema.parse(read(file));
  if(input.id!==entry.id||input.year!==entry.year||input.month!==entry.month)errors.push(`${entry.id}: 目录与题包不一致`);
  if(sha(file)!==fingerprints[`data/n1/${entry.id}.json`])errors.push(`${entry.id}: 来源题包被改写`);
  const asset=audio.exams[entry.id]?.primary;
  if(asset&&asset.sourceSrt!==entry.primarySrt)errors.push(`${entry.id}: 录音版本与时间轴不一致`);
  const result=validatePaper(adaptExam(input,asset,entry.id==='2010-07'?annotations:{}),release);errors.push(...result.errors);
  if(!result.paper)continue;
  const paper=result.paper;const lines=allSentences(paper);const qs=paper.sections.flatMap(s=>s.questions);
  for(const id of [paper.id,...qs.map(q=>q.id),...lines.map(s=>s.id)]){if(ids.has(id))errors.push(`${id}: 跨题包 ID 重复`);ids.add(id);}
  const srtFile=`public/data/n1-srt/${entry.id}.json`;const srt=srtSchema.parse(read(srtFile));
  if(srt.primarySrt!==entry.primarySrt||srt.examId!==entry.id)errors.push(`${entry.id}: SRT 来源不一致`);
  if(sha(srtFile)!==fingerprints[`data/n1-srt/${entry.id}.json`])errors.push(`${entry.id}: 来源识别稿被改写`);
  if(lines.length!==entry.sentences||qs.length!==entry.questions)errors.push(`${entry.id}: 题数或句数与目录不一致`);
  questions+=qs.length;sentences+=lines.length;segments+=srt.segments.length;
  for(const [variant,a]of Object.entries(audio.exams[entry.id]??{})){
    if(!a)continue;if((!remoteAudio&&!existsSync(assetFile(a.src)))||!existsSync(assetFile(a.peaksPath)))errors.push(`${entry.id}/${variant}: 音频或波形缺失`);
    if(variant==='ai'&&!srt.alternatives?.[a.sourceSrt])errors.push(`${entry.id}: AI 录音没有独立 SRT`);
  }
  rows.push({exam:entry.id,questions:qs.length,sentences:lines.length,annotated:lines.filter(s=>s.tokensStatus==='reviewed').length,audioAvailable:paper.audio.available,audioVerified:paper.timing.audioVerified,nullTimes:lines.filter(s=>s.startMs===null).length,conflicts:lines.filter(s=>s.timingConflict).length,interpolated:lines.filter(s=>s.timingStatus==='interpolated_placeholder').length,durationDifferenceMs:asset?asset.durationMs-(input.audio.durationMsFromSrt??0):null,warnings:result.warnings});
}
let unifiedSentences=0;
for(const entry of manifest.exams){
 const paper=paperSchema.parse(read(`public/data/unified/${entry.id}.json`));
 for(const section of paper.sections){
  if(section.questions[0].kind!=='example')errors.push(`${entry.id}/${section.id}: 缺少题型说明`);
  for(const q of section.questions){
   const duration=(q.audioOverride??paper.audio).durationMs;
   for(const sentence of q.sentences){
    unifiedSentences++;
    if(sentence.furiganaTokens?.map(t=>t.surface).join('')!==sentence.text)errors.push(`${sentence.id}: 假名正文不一致`);
    if(sentence.furiganaTokens?.some(t=>/[一-龯]/.test(t.surface)&&(!t.reading||/[一-龯]/.test(t.reading))))errors.push(`${sentence.id}: 缺少读音`);
    if(sentence.startMs===null||sentence.endMs===null){if(sentence.loopAllowed!==false)errors.push(`${sentence.id}: 未标定句界仍允许循环`);}else if(duration&&sentence.endMs>duration)errors.push(`${sentence.id}: 时间超出录音`);
   }
  }
 }
}
console.log(`整合文本：${manifest.exams.length} 场，${unifiedSentences} 条，假名与录音范围已检查。`);
if(sha('public/data/n1/manifest.json')!==fingerprints['data/n1/manifest.json'])errors.push('场次目录与来源不同');
if(manifest.exams.length!==manifest.summary.exams||questions!==manifest.summary.questions||sentences!==manifest.summary.sentences||segments!==manifest.summary.srtSegments)errors.push('全库汇总数量不一致');
mkdirSync('reports',{recursive:true});
writeFileSync(`reports/content-${release?'release':'draft'}.json`,JSON.stringify({mode:release?'release':'draft',summary:{exams:manifest.exams.length,questions,sentences,srtSegments:segments},rows,errors},null,2)+'\n');
if(remoteAudio)console.log('使用外部音频；本次仅检查地址配置，远端文件可达性与音质需单独验收。');
console.table(rows.map(({exam,questions,sentences,annotated,audioAvailable,nullTimes,conflicts})=>({exam,questions,sentences,annotated,audioAvailable,nullTimes,conflicts})));
if(errors.length){console.error(`${errors.length} 项校验失败：\n${errors.slice(0,10).join('\n')}\n详见 reports/content-${release?'release':'draft'}.json`);process.exitCode=1;}else console.log(`全部 ${manifest.exams.length} 场 / ${questions} 条分题记录 / ${sentences} 句校验通过；${release?'发布门禁通过':'仅为开发导入检查，非公开发布许可'}。`);
