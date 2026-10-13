import type { Question } from '../content/schemas';
export function playRange(question:Pick<Question,'playStartMs'|'playEndMs'>,durationMs:number){
  const {playStartMs:startMs,playEndMs:endMs}=question;
  if(startMs!==null&&endMs!==null&&startMs>=0&&startMs<endMs&&endMs<=durationMs)return {startMs,endMs,wholeRecording:false};
  return {startMs:0,endMs:durationMs,wholeRecording:true};
}
