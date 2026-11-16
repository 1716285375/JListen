import { useState } from 'react';
import { useLanguage } from '../../state/language';

export function KanjiStroke({word}: {word:string}) {
  const lang=useLanguage(s=>s.language);
  const chars=Array.from(new Set(Array.from(word).filter(char=>/\p{Script=Han}/u.test(char))));
  const [active,setActive]=useState(chars[0]??'');
  const [error,setError]=useState(false);
  if (!chars.length) return null;
  const code=active.codePointAt(0)?.toString(16);
  return <section className="kanji-stroke" aria-label={lang==='zh'?'汉字笔顺':'Kanji stroke order'}>
    <div className="stroke-heading"><strong>{lang==='zh'?'汉字笔顺':'Kanji stroke order'}</strong><small>{lang==='zh'?'点击汉字切换':'Choose a character'}</small></div>
    <div className="stroke-choices">{chars.map(char=><button type="button" key={char} aria-pressed={active===char} onClick={()=>{setActive(char);setError(false);}} lang="ja">{char}</button>)}</div>
    {error?<p className="stroke-unavailable">{lang==='zh'?'暂无该字的笔顺动画。':'No stroke animation available.'}</p>:
      <img key={active} width="132" height="132" loading="lazy" alt={`${active} stroke order`} src={`https://raw.githubusercontent.com/mistval/kanji_images/master/gifs/${code}.gif`} onError={()=>setError(true)}/>}
    <small className="stroke-source">{lang==='zh'?'动画来源：Kanji Images / KanjiVG':'Source: Kanji Images / KanjiVG'}</small>
  </section>;
}
