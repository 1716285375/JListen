import { WordPronunciation } from './WordPronunciation';
import { useTranslation } from '../../state/language';
import * as Popover from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import type { Token } from '../../content/schemas';
import { useSession } from '../../state/sessionStore';
import { KanjiStroke } from './KanjiStroke';
export function WordCard({token}: {token: Token}) {
  const t=useTranslation();
  const query=token.lemma||token.surface;
  return <div className="word-card">
    <header className="word-card-header"><span className="eyebrow">{t('词语释义')}</span>
    <h3 lang="ja">{token.surface}</h3>
    {token.reading && <p lang="ja" className="reading">{token.reading}</p>}
    </header><div className="word-card-body"><div className="word-definition">
    {token.meaning ? <p className="meaning">{token.meaning}</p> : <p className="unreviewed-meaning">{t('词义尚未校对，可打开词典查询。')}</p>}
    <WordPronunciation key={token.id} text={token.reading||token.surface}/>
    <div className="word-meta">{token.pos && <span>{token.pos}</span>}{token.lemma && <span lang="ja">{t('原形')} · {token.lemma}</span>}</div>
    {token.note && <p className="word-note">{token.note}</p>}
    <a className="dictionary-link" href={`https://jisho.org/search/${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">{t('词典查询 ↗')}</a>
    </div><KanjiStroke key={token.id} word={token.surface}/></div>
  </div>;
}
export function WordToken({token}: {token: Token}) {
  const t=useTranslation();
  const {furigana, mode, selectedWord, selectWord} = useSession();
  if (token.isPunctuation) return <span>{token.surface}</span>;
  return <Popover.Root open={mode !== 'blind' && selectedWord?.id === token.id} onOpenChange={open => selectWord(open ? token : null)}>
    <Popover.Trigger asChild><button type="button" className="word" aria-label={t('单词释义：{word}',{word:token.surface})} onClick={e => e.stopPropagation()}>
      {furigana && token.reading && /[\u3400-\u9fff]/.test(token.surface) ? <ruby>{token.surface}<rt>{token.reading}</rt></ruby> : token.surface}
    </button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="word-popover" side="top" align="start" sideOffset={12} collisionPadding={{top:12,right:12,bottom:120,left:12}} sticky="always" aria-label={t('单词释义：{word}',{word:token.surface})} onClick={e => e.stopPropagation()}>
      <Popover.Close aria-label={t('关闭词义')} className="popover-close"><X size={16}/></Popover.Close><WordCard token={token}/><Popover.Arrow className="popover-arrow"/>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
