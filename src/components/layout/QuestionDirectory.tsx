import { useTranslation } from '../../state/language';
import { Link,useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import type { Paper } from '../../content/schemas';
import type { CorpusManifest } from '../../content/corpus';
import { loadPaper } from '../../content/load';
export function QuestionDirectory({paper,current,onNavigate,exams}: {paper:Paper;current:string;onNavigate?:()=>void;exams?:CorpusManifest['exams']}) {
  const t=useTranslation();
  const navigate=useNavigate();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const changeExam=async(id:string)=>{setBusy(true);setError('');try{const next=await loadPaper(id);await navigate({to:'/listen/$paperId/$questionId',params:{paperId:next.id,questionId:next.sections[0].questions[0].id}});onNavigate?.();}catch{setError(t('试卷切换失败，请重试。'));}finally{setBusy(false);}};
  return <div className="directory"><Link to="/" className="back-link"><ArrowLeft size={15}/>{t('真题题库')}</Link><span className="eyebrow">LISTENING COLLECTION</span><h2>{paper.year}<span>{t('年 {month} 月',{month:paper.month})}</span></h2><span className="pill">JLPT N1</span>{exams&&<select className="directory-exam" aria-label={t('切换考试')} value={paper.id} disabled={busy} onChange={e=>void changeExam(e.target.value)}>{exams.map(e=><option key={e.id} value={e.id}>{t('{year} 年 {month} 月',{year:e.year,month:e.month})}</option>)}</select>}{busy&&<p role="status" className="muted">{t('正在切换试卷…')}</p>}{error&&<p role="alert" className="muted">{error}</p>}<div className="directory-sections">{paper.sections.map(s=><details key={s.id} open={s.questions.some(q=>q.id === current)}><summary><span>問題 {s.id}<small lang="ja">{s.name}</small></span><ChevronDown size={15}/></summary><div>{s.questions.map(q=><Link key={q.id} to="/listen/$paperId/$questionId" params={{paperId:paper.id,questionId:q.id}} onClick={onNavigate} className={`directory-question ${current === q.id ? 'selected' : ''}`}><span>{String(q.number).padStart(2,'0')}</span>{q.kind==='example'?t(q.title??'例题'):t('第 {n} 题',{n:q.number})}{current === q.id && <i/>}</Link>)}</div></details>)}</div><p className="directory-bottom">一文ずつ、少しずつ。<br/><span>{t('一次，听明白一句。')}</span></p></div>;
}
