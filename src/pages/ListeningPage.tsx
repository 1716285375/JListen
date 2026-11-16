import { SakugaControl } from '../components/ui/SakugaControl';
import { SentenceAnalysis } from '../components/transcript/SentenceAnalysis';
import { useTranslation } from '../state/language';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLoaderData, useNavigate, useParams } from '@tanstack/react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Eye, Headphones, Menu, PanelLeftClose, Pause, PencilLine, Play, Repeat2, RotateCcw, RotateCw, Volume2, X } from 'lucide-react';
import { NotFound } from '../app/router';
import { useAudioController } from '../audio/useAudioController';
import { sentenceIndex,seekable,relatedRange,displaySentenceIndex } from '../audio/sentenceIndex';
import { formatTime } from '../audio/time';
import { useSession } from '../state/sessionStore';
import { Button } from '../components/ui/button';
import { QuestionDirectory } from '../components/layout/QuestionDirectory';
import { SentenceLine } from '../components/transcript/SentenceLine';
import type { Paper, Question } from '../content/schemas';
import { loadManifest } from '../content/load';
import { type CorpusManifest } from '../content/corpus';
export function ListeningPage() {
  const paper = useLoaderData({from:'/listen/$paperId/$questionId'});
  const {questionId} = useParams({from:'/listen/$paperId/$questionId'});
  const question = paper.sections.flatMap(s=>s.questions).find(q=>q.id === questionId);
  const viewPaper=useMemo(()=>question?.audioOverride?{...paper,audio:question.audioOverride}:paper,[paper,question]);
  return question ? <Workspace key={`${paper.id}/${question.id}`} paper={viewPaper} question={question}/> : <NotFound/>;
}
function Workspace({paper,question}: {paper:Paper;question:Question}) {
  const t=useTranslation();
  const session = useSession();const navigate = useNavigate();
  const [activeIndex,setActiveIndex] = useState<number | null>(null);
  const [chosenIndex,setChosenIndex] = useState(0);
  const currentIndex = activeIndex ?? chosenIndex;const sentence = question.sentences[currentIndex];
  const audio = useAudioController(paper,question,activeIndex === null ? undefined : sentence);
  const {state,controller} = audio;
  const canLoop=sentence.loopAllowed!==false&&seekable(sentence,paper.audio.durationMs)&&!sentence.timingConflict&&sentence.timingStatus!=='interpolated_placeholder';
  const [navigationNotice,setNavigationNotice]=useState('');const [manifest,setManifest]=useState<CorpusManifest|null>(null);
  useEffect(()=>{let active=true;void loadManifest().then(m=>{if(active)setManifest(m);}).catch(()=>{});return()=>{active=false;};},[]);
  const [rate,setRate] = useState(1);const [volume,setVolume] = useState(0.8);
  const [a,setA] = useState<number | null>(null);const [b,setB] = useState<number | null>(null);const [abError,setAbError] = useState('');
  const [leftOpen,setLeftOpen] = useState(true);
  const [directoryOpen,setDirectoryOpen] = useState(false);
  const [analysisOpen,setAnalysisOpen] = useState(false);
  useEffect(()=>{if(session.mode==='blind')setAnalysisOpen(false);},[session.mode]);
  const speedMenu=useRef<HTMLDetailsElement>(null);
  const [notice,setNotice]=useState<{id:number;text:string}>();
  const notify=(text:string)=>setNotice(previous=>({id:(previous?.id??0)+1,text}));
  const [dictationOpen,setDictationOpen] = useState(false);
  useEffect(()=> {session.resetQuestion();return ()=>useSession.getState().resetQuestion();},[]);
  useEffect(()=> {setActiveIndex(sentenceIndex(question.sentences,state.timeMs));setChosenIndex(previous=>displaySentenceIndex(question.sentences,state.timeMs,previous));},[state.timeMs,question]);
  const seek = (ms:number) => {const index = sentenceIndex(question.sentences,ms);if (index !== null) setChosenIndex(index);controller.current?.seek(ms);};
  const play = () => {if (state.playing) controller.current?.pause();else void controller.current?.play();};
  const selectSentence = (index:number) => {
    const target=question.sentences[index];const range=relatedRange(target,paper.audio.durationMs);
    setChosenIndex(index);setActiveIndex(null);setA(null);setB(null);setAbError('');controller.current?.setLoop(null);
    if(range){controller.current?.seek(range.startMs);setNavigationNotice(seekable(target,paper.audio.durationMs)?'':`已定位第 ${index+1} 句的关联录音片段，本句起止时间待核对。`);}
    else setNavigationNotice(`第 ${index+1} 句尚无关联时间，播放位置未改变。`);
  };
  const move = (delta:number) => {const next=currentIndex+delta;if(next>=0&&next<question.sentences.length)selectSentence(next);};
  const previewSentence=()=>{if(seekable(sentence,paper.audio.durationMs)){setA(null);setB(null);setAbError('');void controller.current?.preview(sentence.startMs,sentence.endMs);}};
  const sentenceLoop = () => {
    if(!canLoop||!seekable(sentence)){setAbError(t('本句时间待复核，暂不自动循环；可试听后手动设置 A/B。'));return;}
    const disabling=state.loop?.kind==='sentence';
    if(!controller.current?.setLoop(disabling?null:{kind:'sentence',startMs:sentence.startMs,endMs:sentence.endMs}))return;
    setA(null);setB(null);setAbError('');notify(t(disabling?'已关闭循环播放':'已开启单句循环'));
  };
  const markA = () => {if(!controller.current||!state.ready)return;controller.current.setLoop(null);setA(state.timeMs);setB(null);setAbError('');notify(t('循环起点：{time}',{time:formatTime(state.timeMs,true)}));};
  const markB = () => {
    if (a === null || state.timeMs <= a) {setAbError(t('先设置 A，再把播放位置移到 A 之后设置 B。'));return;}
    if (controller.current?.setLoop({kind:'ab',startMs:a,endMs:state.timeMs})) {setB(state.timeMs);setAbError('');notify(t('已开启 A–B 循环'));}
    else setAbError(t('循环范围必须在当前题目内。'));
  };
  const clearLoop=()=>{if(!controller.current?.setLoop(null))return;setA(null);setB(null);setAbError('');notify(t('已关闭循环播放'));};
  useEffect(()=> {
    const keydown = (event:KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.composedPath().some(node=>node instanceof HTMLElement&&node.tagName.startsWith('SAKUGA-'))) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[data-radix-popper-content-wrapper]')) return;
      if (target.closest('button,a') && (event.code === 'Space' || event.key === 'Enter')) return;
      const actions:Record<string,()=>void> = {ArrowUp:()=>move(-1),ArrowDown:()=>move(1),ArrowLeft:()=>seek(state.timeMs-3000),ArrowRight:()=>seek(state.timeMs+3000),l:sentenceLoop,'[':markA,']':markB,f:()=>session.setMode(({blind:'single',single:'all',all:'blind'} as const)[session.mode]),r:()=>session.setFurigana(!session.furigana),'?':()=>{controller.current?.pause();void navigate({to:'/about'});},Escape:()=> {session.selectWord(null);setDirectoryOpen(false);}};
      if (event.code === 'Space') {event.preventDefault();play();}
      else {const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;if (actions[key]) {event.preventDefault();actions[key]();}}
    };
    window.addEventListener('keydown',keydown);return ()=>window.removeEventListener('keydown',keydown);
  });
  const reviewed = question.sentences.every(s=>s.tokensStatus === 'reviewed');
  const questions = paper.sections.flatMap(s=>s.questions);const questionIndex = questions.findIndex(q=>q.id === question.id);
  return <div className={`workspace-layout ${!leftOpen ? 'left-collapsed' : ''}`}>
    {leftOpen && <aside className="desktop-directory"><QuestionDirectory paper={paper} current={question.id} exams={manifest?.exams}/></aside>}
    <main id="main" className="workspace-main"><div className="workspace-breadcrumb"><div><Button size="icon" variant="ghost" className="desktop-toggle" aria-label={leftOpen ? t('收起目录') : t('展开目录')} onClick={()=>setLeftOpen(!leftOpen)}><PanelLeftClose size={18}/></Button><Button size="icon" variant="ghost" className="mobile-toggle" aria-label={t('打开题目目录')} onClick={()=>setDirectoryOpen(true)}><Menu size={18}/></Button><span>{t('{year} 年 {month} 月',{year:paper.year,month:paper.month})}</span><ChevronRight size={13}/><span>問題 {question.section}</span></div><div></div></div>
    <div className="question-header"><div><span className="eyebrow">INTENSIVE LISTENING · 問題 {question.section}</span><h1>{question.kind==='example'?t(question.title??'例题'):t('第 {n} 题',{n:String(question.number).padStart(2,'0')})}<span>{question.sectionName}</span></h1></div><div className="question-navigation">{questionIndex > 0 ? <Button asChild size="icon" variant="ghost" aria-label={t('上一题')}><Link to="/listen/$paperId/$questionId" params={{paperId:paper.id,questionId:questions[questionIndex-1].id}}><ArrowLeft size={17}/></Link></Button> : <Button size="icon" variant="ghost" disabled aria-label={t('上一题')}><ArrowLeft size={17}/></Button>}{questionIndex < questions.length-1 ? <Button asChild size="icon" variant="ghost" aria-label={t('下一题')}><Link to="/listen/$paperId/$questionId" params={{paperId:paper.id,questionId:questions[questionIndex+1].id}}><ArrowRight size={17}/></Link></Button> : <Button size="icon" variant="ghost" disabled aria-label={t('下一题')}><ArrowRight size={17}/></Button>}</div></div>
    <section className="audio-panel" aria-label={t('音频播放器')}><div className="audio-heading"><span><Headphones size={15}/>{question.kind==='example'?t('说明与例题录音'):t('本题录音')}{question.exampleSource&&` · ${question.exampleSource}` }</span><span className="timing-badge">{t('估算时间轴')}</span></div><div className="waveform" ref={audio.container} data-testid="waveform"/>{audio.waveError && <p className="muted">{t(audio.waveError)}</p>}<div className="audio-time"><span data-testid="current-time">{formatTime(state.timeMs,true)}</span><span>{formatTime(audio.range.endMs,true)}</span></div><div className="playback-timeline"><SakugaControl kind="progress" label={t('播放进度')} progress={Math.min(1,Math.max(0,(state.timeMs-audio.range.startMs)/Math.max(1,audio.range.endMs-audio.range.startMs)))}/><input className="seek-slider" aria-label={t('播放位置')} type="range" min={audio.range.startMs} max={audio.range.endMs} step="10" value={Math.max(audio.range.startMs,state.timeMs)} onChange={e=>seek(Number(e.target.value))} disabled={!state.ready}/></div>
    <div className="player-controls"><div className="transport"><Button size="icon" variant="ghost" aria-label={t('上一句')} disabled={!state.ready || currentIndex === 0} onClick={()=>move(-1)}><ChevronLeft size={18}/></Button><Button size="icon" variant="ghost" className="play-button" disabled={!state.ready} aria-label={state.playing ? t('暂停') : t('播放')} onClick={play}>{state.playing ? <Pause size={19}/> : <Play size={19}/>}</Button><Button size="icon" variant="ghost" aria-label={t('下一句')} disabled={!state.ready || currentIndex === question.sentences.length-1} onClick={()=>move(1)}><ChevronRight size={18}/></Button></div><div className="secondary-controls"><Button size="icon" variant="ghost" aria-label={t('后退 3 秒')} disabled={!state.ready} onClick={()=>seek(state.timeMs-3000)}><RotateCcw size={17}/></Button><Button size="icon" variant="ghost" aria-label={t('前进 3 秒')} disabled={!state.ready} onClick={()=>seek(state.timeMs+3000)}><RotateCw size={17}/></Button><Button size="icon" variant="ghost" aria-label={t('试听本句')} disabled={!state.ready||!canLoop} title={canLoop?t('播放一次后停在句尾'):t('本句时间待核对，可手动设置 A–B 范围')} onClick={previewSentence}><Play size={16}/></Button><Button size="icon" variant="ghost" aria-label={t('单句循环')} className={state.loop?.kind === 'sentence' ? 'selected' : ''} aria-pressed={state.loop?.kind === 'sentence'} disabled={!state.ready||!canLoop} title={canLoop?t('循环当前句'):t('句级时间待复核，可手动设置 A/B')} onClick={sentenceLoop}><Repeat2 size={17}/></Button><details className="speed-picker" ref={speedMenu}><summary aria-label={t('播放速度')}>{rate.toFixed(2).replace(/0$/,'')}×</summary><SakugaControl key={t('播放速度')} kind="radio" label={t('播放速度')} value={String(rate)} options={[0.65,0.75,0.85,1,1.15,1.25].map(value=>({value:String(value),label:`${value}×`}))} onValue={value=>{if(controller.current){setRate(Number(value));controller.current.setRate(Number(value));notify(t('播放速度：{rate}×',{rate:Number(value)}));}if(speedMenu.current)speedMenu.current.open=false;}}/></details></div></div>
    <div className="ab-controls"><span>{t('A–B 循环')}</span><Button size="small" disabled={!state.ready} onClick={markA}>A {a === null ? t('设起点') : formatTime(a,true)}</Button><Button size="small" disabled={!state.ready} onClick={markB}>B {b === null ? t('设终点') : formatTime(b,true)}</Button>{(a !== null || state.loop) && <Button size="small" variant="ghost" onClick={clearLoop}>{t('清除循环')}</Button>}</div>{abError && <p role="status" className="control-error">{t(abError)}</p>}{state.error && <p role="alert" className="control-error">{t(state.error)}</p>}{!paper.audio.available && <p role="status">{t('此题尚未提供音频，播放暂不可用。')}</p>}</section>
    <p className="sr-only" role="status">{navigationNotice}</p>
    <section className="transcript-section"><div className="transcript-toolbar"><SakugaControl key={t('原文显示模式')} kind="tabs" panelId="transcript-panel" className="mode-tabs" label={t('原文显示模式')} selected={['blind','single','all'].indexOf(session.mode)} options={[{value:'blind',label:t('盲听')},{value:'single',label:t('单句')},{value:'all',label:t('全文')}]} onValue={value=>{if(value==='blind'||value==='single'||value==='all')session.setMode(value);}}/><label className="furigana-switch"><span>{t('显示假名')}</span><SakugaControl kind="toggle" disabled={session.mode==='blind'} label={t('显示假名')} checked={session.furigana} onToggle={session.setFurigana}/></label><Button variant="ghost" size="icon" aria-label={t(analysisOpen?'返回原文':'查看本句解析')} aria-pressed={analysisOpen} disabled={session.mode==='blind'} onClick={()=>setAnalysisOpen(!analysisOpen)}>{analysisOpen?<Eye size={17}/>:<BookOpen size={17}/>}</Button><span className="sentence-count">{activeIndex === null ? t('已选 {n} / {total}',{n:currentIndex+1,total:question.sentences.length}) : t('当前句 {n} / {total}',{n:currentIndex+1,total:question.sentences.length})}</span></div>
    <div className="transcript-caption"><span>{t(analysisOpen?'本句解析':'逐句原文')}</span><span>{reviewed ? t('词义初稿 · 待人工复核') : t('点句定位 · 词级注释准备中')}</span></div>
    {analysisOpen&&session.mode!=='blind'?<section id="transcript-panel" role="tabpanel" aria-labelledby={`transcript-panel-tab-${['blind','single','all'].indexOf(session.mode)}`} className={`reading-desk ${session.mode==='single'?'reading-desk-single':''}`} aria-label={t('本句解析')}><div className="reading-desk-heading"><span className="eyebrow">LANGUAGE NOTES</span><span>{String(currentIndex+1).padStart(2,'0')} / {question.sentences.length}</span></div><blockquote lang="ja">{sentence.text}</blockquote><SentenceAnalysis key={sentence.id} sentence={sentence}/></section>:<div id="transcript-panel" role="tabpanel" aria-labelledby={`transcript-panel-tab-${['blind','single','all'].indexOf(session.mode)}`} className={`sentence-list ${session.mode === 'single' ? 'single-sentence-list' : ''}`}>{session.mode === 'blind' ? <div className="blind-panel"><Headphones size={36} strokeWidth={1.3}/><h2>{t('把注意力，交给声音。')}</h2><p>{t('第 {n} 句 / 共 {total} 句',{n:currentIndex+1,total:question.sentences.length})}</p><div className="blind-lines" aria-hidden="true"><i/><i/><i/></div><SakugaControl kind="button" onAction={()=>session.setMode('single')}>{t('显示当前句')}</SakugaControl></div> : session.mode === 'single' ? <><SentenceLine select={()=>selectSentence(currentIndex)} sentence={sentence} index={currentIndex} active={activeIndex!==null} seek={seek} durationMs={paper.audio.durationMs}/></> : question.sentences.map((s,i)=><SentenceLine key={s.id} select={()=>selectSentence(i)} sentence={s} index={i} active={activeIndex === i} seek={seek} durationMs={paper.audio.durationMs}/>)}</div>}</section>
    <section className="dictation"><button className="dictation-toggle" aria-expanded={dictationOpen} onClick={()=>setDictationOpen(!dictationOpen)}><PencilLine size={17}/><span>{t('本句听写')}<small>{t('写下你听到的，不必急着看答案')}</small></span><span>{dictationOpen ? '−' : '+'}</span></button>{dictationOpen && <div className="dictation-body"><textarea aria-label={t('本句听写')} placeholder={t('在这里写下听到的日语…')} value={session.dictation} onChange={e=>session.setDictation(e.target.value)}/><div><SakugaControl kind="checkbox" checked={session.compare} onToggle={session.setCompare}>{t('显示对照')}</SakugaControl><SakugaControl kind="button" variant="secondary" onAction={()=>{session.setDictation('');session.setCompare(false);notify(t('已清空听写'));}}>{t('清空输入')}</SakugaControl><span className="muted">{t('切题或刷新即清空')}</span></div>{session.compare && <p className="dictation-comparison" lang="ja">{sentence.text}</p>}</div>}</section>
    <details className="answer-reference"><summary>{t('原题参考与来源答案')}</summary><p lang="ja">{question.sentences.filter(s=>s.role === 'question' || s.role === 'option').map(s=>s.text).join('\n')}</p><p>{t('PDF 所列答案：')}{question.answer ?? (question.subQuestions?.length?t('见子问题'):t('来源未提供'))} {question.answerDescription}</p>{question.answerExtra.filter(text=>!question.subQuestions?.some(s=>s.answerText === text)).map((text,i)=><p key={i} lang="ja">{text}</p>)}{question.subQuestions?.map(s=><div key={s.number}><p lang="ja">{s.number}. {s.prompt}</p><p lang="ja">{s.answerText}</p></div>)}{question.id === '2010-07-p1-q01' && <p className="source-warning">来源疑点：题干询问「当日」，所列答案为周末前汇款。保留 PDF 答案，待核对正式选项。</p>}</details>
    <footer className="workspace-footnote">{t('逐句时间参考字幕与录音停顿 · 听写在切题或刷新后清空')}</footer></main>
    <div className="workspace-status"><div className="mobile-player"><Button size="icon" variant="ghost" aria-label={t('底栏上一句')} disabled={!state.ready || currentIndex === 0} onClick={()=>move(-1)}><ChevronLeft size={18}/></Button><Button size="icon" variant="ghost" aria-label={state.playing ? t('底栏暂停') : t('底栏播放')} disabled={!state.ready} onClick={play}>{state.playing ? <Pause size={18}/> : <Play size={18}/>}</Button><Button size="icon" variant="ghost" aria-label={t('底栏下一句')} disabled={!state.ready || currentIndex === question.sentences.length-1} onClick={()=>move(1)}><ChevronRight size={18}/></Button><Button size="icon" variant="ghost" aria-label={t('底栏单句循环')} aria-pressed={state.loop?.kind === 'sentence'} disabled={!state.ready||!canLoop} title={canLoop?t('循环当前句'):t('句级时间待复核，可手动设置 A/B')} onClick={sentenceLoop}><Repeat2 size={18}/></Button></div><div className="volume-control"><Volume2 size={16}/><SakugaControl kind="slider" label={t('音量')} min={0} max={100} step={1} unit="%" value={Math.round(volume*100)} onValue={value=>{const next=Number(value)/100;setVolume(next);controller.current?.setVolume(next);}}/></div><span className="shortcut-hints"><kbd>Space</kbd>{t('播放 / 暂停')} <kbd>↑ ↓</kbd>{t('切句')} <kbd>L</kbd>{t('单句循环')}</span><span className="status-loop">{state.loop ? (state.loop.kind === 'ab' ? t('A–B 循环中') : t('单句循环中')) : t('按自己的节奏，听一遍。')}</span></div>
    <SakugaControl kind="toast" className="player-toast" notice={notice}/>
    <Dialog.Root open={directoryOpen} onOpenChange={setDirectoryOpen}><Dialog.Portal><Dialog.Overlay className="drawer-overlay"/><Dialog.Content className="drawer drawer-left"><Dialog.Title className="sr-only">{t('题目目录')}</Dialog.Title><Dialog.Description className="sr-only">{t('选择当前试卷中的题目')}</Dialog.Description><Dialog.Close className="drawer-close" aria-label={t('关闭目录')}><X size={20}/></Dialog.Close><QuestionDirectory paper={paper} current={question.id} exams={manifest?.exams} onNavigate={()=>setDirectoryOpen(false)}/></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
