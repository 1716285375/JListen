import { assetUrl } from '../platform/assetUrl';
import { audioIndexSchema,corpusManifestSchema,srtSchema } from './corpus';
import { paperSchema,type Paper } from './schemas';
async function json(path:string){const response=await fetch(assetUrl(path));if(!response.ok)throw new Error('内容加载失败，请刷新重试。');return response.json();}
export async function loadManifest(){return corpusManifestSchema.parse(await json('data/n1/manifest.json'));}
export async function loadAudioCatalog(){return audioIndexSchema.parse(await json('data/audio-index.json'));}
const papers=new Map<string,Promise<Paper>>();
export function loadPaper(requestedId:string){
  const id=requestedId==='jlpt-n1-2010-07'?'2010-07':requestedId;
  let pending=papers.get(id);
  if(!pending){pending=(async()=>{
    const manifest=await loadManifest();const entry=manifest.exams.find(e=>e.id===id);
    if(!entry)throw new Error('找不到这份试卷。');
    const paper=paperSchema.parse(await json(`data/unified/${id}.json`));
    if(paper.id!==entry.id)throw new Error('试卷目录与内容不一致。');
    return paper;
  })();papers.set(id,pending);void pending.catch(()=>papers.delete(id));}
  return pending;
}
export async function loadSrt(id:string){
  const manifest=await loadManifest();if(!manifest.exams.some(e=>e.id===id))throw new Error('找不到这份试卷。');
  const srt=srtSchema.parse(await json(`data/n1-srt/${id}.json`));if(srt.examId!==id)throw new Error('识别稿与考试不一致。');return srt;
}
