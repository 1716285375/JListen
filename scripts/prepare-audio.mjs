import { spawnSync, spawn } from 'node:child_process';
import { mkdir,readdir,copyFile,readFile,writeFile,stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';
const manifest=JSON.parse(await readFile('public/data/n1/manifest.json','utf8'));
const files=(await readdir('audios').catch(error=>{if(error.code==='ENOENT')return [];throw error;})).filter(name=>/\.mp3$/i.test(name));
const requested=process.argv.slice(2).filter(x=>/^\d{4}-\d{2}$/.test(x));
const fingerprint=async filename=>new Promise((resolve,reject)=>{const hash=createHash('sha256');const input=createReadStream(filename);input.on('error',reject);input.on('data',chunk=>hash.update(chunk));input.on('end',()=>resolve(hash.digest('hex')));});
let index={exams:{}};
try{index=JSON.parse(await readFile('public/data/audio-index.json','utf8'));}catch{}
await mkdir('reports',{recursive:true});const rows=[];
async function prepare(exam,variant,sourceName,srtDurationMs){
  const filenameEnglish=`jlpt-n1-${exam.id}-listening${variant==='ai'?'-ai':exam.id==='2025-07'?'-live':''}.mp3`;
  const src=`audio/n1/${exam.id}/${filenameEnglish}`;const peaksPath=`data/peaks/${exam.id}-${variant}.json`;
  const canonical=path.resolve('public',src);
  const stem=sourceName.replace(/\.srt$/i,'');const filename=files.find(f=>f.replace(/\.mp3$/i,'')===stem);
  let source;try{await stat(canonical);source=canonical;}catch(error){if(error.code!=='ENOENT')throw error;if(filename)source=path.resolve('audios',filename);}
  if(!source){rows.push({exam:exam.id,variant,available:false,expected:src});return null;}
  const sourceSha256=await fingerprint(source);const previous=index.exams[exam.id]?.[variant];
  if(previous?.sha256===sourceSha256){try{await stat(`public/${previous.src}`);await stat(`public/${previous.peaksPath}`);rows.push({...previous,exam:exam.id,variant,cached:true});return previous;}catch{}}
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',source],{encoding:'utf8',windowsHide:true});
  if(probe.status!==0)throw new Error(probe.stderr||'需要 ffprobe');
  const durationMs=Math.round(Number(JSON.parse(probe.stdout).format.duration)*1000);
  await mkdir(`public/audio/n1/${exam.id}`,{recursive:true});await mkdir('public/data/peaks',{recursive:true});if(source!==canonical)await copyFile(source,canonical);
  const child=spawn('ffmpeg',['-v','error','-i',source,'-ac','1','-ar','1000','-f','s16le','pipe:1'],{windowsHide:true});
  const chunks=[];let errors='';child.stdout.on('data',c=>chunks.push(c));child.stderr.on('data',c=>errors+=c);
  await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(errors)));});
  const pcm=Buffer.concat(chunks);const peaks=[];
  for(let offset=0;offset<pcm.length;offset+=100){let min=0,max=0;for(let i=offset;i+1<Math.min(offset+100,pcm.length);i+=2){const value=pcm.readInt16LE(i)/32768;min=Math.min(min,value);max=Math.max(max,value);}peaks.push(Number(min.toFixed(4)),Number(max.toFixed(4)));}
  await writeFile(`public/${peaksPath}`,JSON.stringify({durationMs,peaks:[peaks]}));
  const copySha256=await fingerprint(`public/${src}`);if(copySha256!==sourceSha256)throw new Error(`${exam.id}: 音频复制校验失败`);
  const entry={src,peaksPath,durationMs,sourceFile:filenameEnglish,sourceSrt:sourceName,sha256:sourceSha256,redistributionAuthorized:false,srtDurationMs,durationDifferenceMs:durationMs-srtDurationMs,timelineStatus:Math.abs(durationMs-srtDurationMs)>3000?'duration_mismatch':'unverified'};
  rows.push({...entry,exam:exam.id,variant,copyIdentical:true});console.log(`${exam.id} ${variant}: ${durationMs} ms / SRT ${srtDurationMs} ms${entry.timelineStatus==='duration_mismatch'?' · 时长差异待核对':''}`);return entry;
}
for(const exam of manifest.exams){
  if(requested.length&&!requested.includes(exam.id))continue;
  const raw=JSON.parse(await readFile(`public/data/n1/${exam.id}.json`,'utf8'));
  const primary=await prepare(exam,'primary',exam.primarySrt,raw.audio.durationMsFromSrt??0);const result={};if(primary)result.primary=primary;
  if(exam.alternativeSrt?.length){const rawSrt=JSON.parse(await readFile(`public/data/n1-srt/${exam.id}.json`,'utf8'));
    for(const name of exam.alternativeSrt){const alternative=rawSrt.alternatives[name];const segments=Array.isArray(alternative)?alternative:alternative?.segments;if(!segments?.length)throw new Error(`${exam.id}: 备用 SRT 不存在`);const ai=await prepare(exam,'ai',name,Math.max(...segments.map(s=>s.endMs)));if(ai)result.ai=ai;}
  }
  index.exams[exam.id]=result;
  // Checkpoint each exam; interrupted runs resume by source hash.
  await writeFile('public/data/audio-index.json',JSON.stringify(index,null,2)+'\n');
}
await writeFile('reports/audio-catalog.json',JSON.stringify({rows,matchedMain:Object.values(index.exams).filter(x=>x.primary).length,matchedAlternative:Object.values(index.exams).filter(x=>x.ai).length},null,2)+'\n');
console.log(`已接入 ${Object.values(index.exams).filter(x=>x.primary).length} 份主录音，${Object.values(index.exams).filter(x=>x.ai).length} 份独立备用录音；音频校准与公开授权状态保持未确认。`);
