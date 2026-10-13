import { useTranslation } from '../../state/language';
import { useEffect, useRef } from 'react';
import { CornerDownRight } from 'lucide-react';
import type { Sentence } from '../../content/schemas';
import { useSession } from '../../state/sessionStore';
import { WordToken } from './WordToken';
import { formatTime } from '../../audio/time';
import { seekable,relatedRange } from '../../audio/sentenceIndex';
const colors = ['neutral', 'question', 'contrast', 'important', 'neutral'];
const roles = {narration:'旁白',dialogue:'对话',question:'提问',prompt:'回应题干',option:'选项'};
export function SentenceLine({sentence, index, active, seek,durationMs,select}: {sentence: Sentence; index: number; active: boolean; seek: (ms: number) => void;durationMs?:number;select?:()=>void}) {
  const t=useTranslation();
  const furigana=useSession(s=>s.furigana);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    const container = element?.closest('.sentence-list');
    if (!element || !container) return;
    if (container.classList.contains('single-sentence-list')) {
      container.scrollTop=0;
      return;
    }
    if (!active) return;
    const line = element.getBoundingClientRect();const viewport = container.getBoundingClientRect();
    const delta = line.top < viewport.top ? line.top - viewport.top : line.bottom > viewport.bottom ? line.bottom - viewport.bottom : 0;
    if (delta) container.scrollBy({top:delta,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }, [active,sentence.id]);
  const canSeek=seekable(sentence,durationMs);
  const range=relatedRange(sentence,durationMs);
  const choose=(explicit=false)=>{if(!explicit&&window.getSelection()?.toString())return;if(select)select();else if(range)seek(range.startMs);};
  return <article ref={ref} className={`sentence role-${sentence.highlightRole === 'neutral' ? colors[index % colors.length] : sentence.highlightRole} ${active ? 'is-active' : ''} ${!canSeek?'untimed':''}`} data-testid="sentence" data-start={sentence.startMs??''} onClick={()=>choose()} aria-current={active ? 'true' : undefined}>
    <div className="sentence-meta"><span className="sentence-number">{String(index + 1).padStart(2, '0')}</span><span>{sentence.speaker ? `${t(sentence.speaker)} · ${t(roles[sentence.role])}` : t(roles[sentence.role])}{sentence.optionNumber ? ` ${sentence.optionNumber}` : ''}</span><span className="timestamp">{canSeek?formatTime(sentence.startMs!, true):t('时间待核对')}</span>{sentence.timingConflict&&<span>{t('时间冲突')}</span>}{sentence.timingStatus==='interpolated_placeholder'&&<span>{t('插值占位')}</span>}{active && <span className="current-label">{t('当前句')}</span>}</div>
    <p className="japanese" lang="ja">{sentence.tokensStatus === 'reviewed' ? sentence.tokens.map(token => <WordToken key={token.id} token={token}/>) : furigana&&sentence.furiganaTokens ? sentence.furiganaTokens.map((token,i)=>/[一-龯々]/.test(token.surface)?<ruby key={i}>{token.surface}<rt>{token.reading}</rt></ruby>:<span key={i}>{token.surface}</span>):sentence.text}</p>
    <button className="sentence-seek" disabled={!range&&!select} title={canSeek?t('定位到本句'):range?t('定位到关联录音片段；本句起止时间待核对'):t('选中本句；播放位置不变')} aria-label={t(canSeek?'定位第 {n} 句':range?'定位关联片段：第 {n} 句':'选择第 {n} 句',{n:index+1})} onClick={e => {e.stopPropagation();choose(true);}}><CornerDownRight size={16}/></button>
  </article>;
}
