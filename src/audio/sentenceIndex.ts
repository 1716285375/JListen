import type { Sentence } from '../content/schemas';
export function sentenceIndex(sentences: Pick<Sentence, 'startMs' | 'endMs'>[], ms: number): number | null {
  // Source order is authoritative; OCR alignment can be unsorted or ambiguous.
  const matches=sentences.map((s,i)=>s.startMs!==null&&s.endMs!==null&&s.startMs<=ms&&ms<s.endMs?i:null).filter((i):i is number=>i!==null);
  return matches.length===1?matches[0]:null;
}
export function seekable(s:Pick<Sentence,'startMs'|'endMs'>,durationMs?:number):s is typeof s&{startMs:number;endMs:number}{return s.startMs!==null&&s.endMs!==null&&s.startMs>=0&&s.endMs>s.startMs&&(durationMs===undefined||s.endMs<=durationMs);}
export function relatedRange(s:Pick<Sentence,'startMs'|'endMs'|'sourceWindowStartMs'|'sourceWindowEndMs'>,durationMs?:number) {
  if (seekable(s,durationMs)) return {startMs:s.startMs,endMs:s.endMs};
  const range={startMs:s.sourceWindowStartMs??null,endMs:s.sourceWindowEndMs??null};
  return seekable(range,durationMs)?range:null;
}
export function displaySentenceIndex(sentences:Pick<Sentence,'startMs'|'endMs'|'sourceWindowStartMs'|'sourceWindowEndMs'>[],ms:number,preferred:number) {
  const exact=sentenceIndex(sentences,ms);
  if (exact!==null) return exact;
  const contains=(index:number)=>{const range=relatedRange(sentences[index]);return range!==null&&range.startMs<=ms&&ms<range.endMs;};
  if (sentences[preferred]&&contains(preferred)) return preferred;
  const related=sentences.findIndex((_,i)=>contains(i));
  return related<0?preferred:related;
}
export type Loop = {kind: 'sentence' | 'ab'; startMs: number; endMs: number};
export function validLoop(loop: Loop, durationMs: number) {
  return Number.isInteger(loop.startMs) && Number.isInteger(loop.endMs) && loop.startMs >= 0 && loop.startMs < loop.endMs && loop.endMs <= durationMs;
}
