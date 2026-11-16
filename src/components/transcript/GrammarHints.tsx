import { useMemo } from 'react';
import { useLanguage } from '../../state/language';
import { findGrammarHints } from '../../content/grammarHints';

export function GrammarHints({text}: {text:string}) {
  const lang=useLanguage(s=>s.language);
  const hints=useMemo(()=>findGrammarHints(text),[text]);
  if (!hints.length) return null;
  return <section className="grammar-hints" aria-label={lang==='zh'?'语法提示':'Grammar notes'}>
    <h3>{lang==='zh'?'语法提示':'Grammar notes'} <small>{hints.length}</small></h3>
    {hints.map(hint=><div className="grammar-hint" key={hint.pattern}>
      <strong lang="ja">{hint.pattern}</strong>
      <p>{lang==='zh'?hint.zh:hint.en}</p>
      <small>{lang==='zh'?hint.detailZh:hint.detailEn}</small>
    </div>)}
    <p className="grammar-disclaimer">{lang==='zh'?'按句型字面匹配，具体语义请结合上下文判断。':'Pattern matches only; confirm the meaning in context.'}</p>
  </section>;
}
