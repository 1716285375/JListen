import { BookOpenText, ChevronDown, Layers3, Target } from 'lucide-react';
import type { Sentence } from '../../content/schemas';
import { useTranslation } from '../../state/language';
import { GrammarHints } from './GrammarHints';
export function SentenceAnalysis({sentence}:{sentence:Pick<Sentence,'text'|'translation'|'translationSource'|'grammarNotes'|'languageAnalysis'>}){
 const t=useTranslation();const analysis=sentence.languageAnalysis;
 return <div className="sentence-analysis">{sentence.translation?<section className="analysis-translation"><span className="analysis-label">{t('中文释义')}{sentence.translationSource==='provided_model_translation'&&<small>{t('参考译文 · 待复核')}</small>}</span><p>{sentence.translation}</p></section>:<p className="muted">{t('本句中文释义尚待复核。')}</p>}
 {sentence.grammarNotes?.length? <section><span className="analysis-label">{t('用法说明')}</span>{sentence.grammarNotes.map(note=><p key={note}>{note}</p>)}</section>:null}
 {analysis&&(analysis.grammar.length>0||analysis.wordGloss.length>0||analysis.examFocus)&&<details className="analysis-reference"><summary><span className="reference-title"><BookOpenText size={16}/><span>{t('词汇与考点参考')}</span></span><span className="reference-summary-end"><small>{t('待复核')}</small><ChevronDown size={15}/></span></summary><div className="reference-content"><div className="reference-columns">
 {analysis.wordGloss.length>0&&<section className="reference-section reference-vocabulary"><h3><BookOpenText size={15}/>{t('词汇')}<span>{analysis.wordGloss.length}</span></h3><dl className="analysis-gloss">{analysis.wordGloss.map((w,i)=><div key={i}><dt lang="ja">{w.surface}</dt><dd>{w.meaning}</dd></div>)}</dl></section>}
 {analysis.grammar.length>0&&<section className="reference-section reference-grammar"><h3><Layers3 size={15}/>{t('语法与用法')}<span>{analysis.grammar.length}</span></h3><div className="reference-patterns">{analysis.grammar.map((g,i)=><section className="analysis-pattern" key={i}><strong>{g.structure}</strong><p>{g.explanation}</p>{g.skill&&<small>{g.skill}</small>}</section>)}</div></section>}
 </div>{analysis.examFocus&&<section className="analysis-focus"><Target size={17}/><div><h3>{t('听力考点')}</h3><p>{analysis.examFocus}</p></div></section>}<footer className="reference-disclaimer">{t('以上为模型或规则生成的参考，请结合原句判断。')}</footer></div></details>}

 <GrammarHints text={sentence.text}/></div>;
}
