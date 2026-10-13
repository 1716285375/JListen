import { useTranslation } from '../../state/language';
import * as Popover from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import type { Token } from '../../content/schemas';
import { useSession } from '../../state/sessionStore';
export function WordCard({token}: {token: Token}) {
  const t=useTranslation();
  return <div className="word-card"><span className="eyebrow">{t('词语释义')}</span><h3 lang="ja">{token.surface}</h3><p lang="ja" className="reading">{token.reading}</p><p className="meaning">{token.meaning}</p><div className="word-meta"><span>{token.pos}</span>{token.lemma && <span lang="ja">{t('原形')} · {token.lemma}</span>}</div>{token.note && <p className="word-note">{token.note}</p>}</div>;
}
export function WordToken({token}: {token: Token}) {
  const t=useTranslation();
  const {furigana, mode, selectedWord, selectWord} = useSession();
  if (token.isPunctuation) return <span>{token.surface}</span>;
  return <Popover.Root open={mode !== 'blind' && selectedWord?.id === token.id} onOpenChange={open => selectWord(open ? token : null)}>
    <Popover.Trigger asChild><button type="button" className="word" aria-label={t('单词释义：{word}',{word:token.surface})} onClick={e => e.stopPropagation()}>
      {furigana && token.reading && /[\u3400-\u9fff]/.test(token.surface) ? <ruby>{token.surface}<rt>{token.reading}</rt></ruby> : token.surface}
    </button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="word-popover" side="bottom" sideOffset={10} collisionPadding={16} onClick={e => e.stopPropagation()}>
      <WordCard token={token}/><Popover.Close aria-label={t('关闭词义')} className="popover-close"><X size={16}/></Popover.Close><Popover.Arrow className="popover-arrow"/>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
