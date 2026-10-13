import { beforeEach,it,expect,vi } from 'vitest';
import { fireEvent,render,screen,cleanup } from '@testing-library/react';
import { SentenceLine } from '../../src/components/transcript/SentenceLine';
import { paperSchema } from '../../src/content/schemas';
import paper from '../../public/content/papers/n1-2010-07.json';
import { useSession } from '../../src/state/sessionStore';
beforeEach(()=>{cleanup();useSession.setState({mode:'all',selectedWord:null,furigana:false});});
it('点击词语和助词打开对应中文义，不冒泡跳句；标点没有按钮',()=>{
  const sentence=paperSchema.parse(paper).sections[0].questions[0].sentences[0];const seek=vi.fn();render(<SentenceLine sentence={sentence} index={0} active={false} seek={seek}/>);
  fireEvent.click(screen.getByRole('button',{name:'单词释义：電話'}));expect(screen.getByText('电话')).toBeInTheDocument();expect(seek).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'单词释义：が'}));expect(screen.getByText('标记动作主体；也可接续下文作铺垫')).toBeInTheDocument();expect(seek).not.toHaveBeenCalled();
  expect(screen.queryByRole('button',{name:'单词释义：。'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'定位第 1 句'}));expect(seek).toHaveBeenCalledWith(sentence.startMs);
});

it('句界未标定时可以选择原文，但不跳转音频',()=>{
 const sentence={...paperSchema.parse(paper).sections[0].questions[0].sentences[0],startMs:null,endMs:null};
 const select=vi.fn(),seek=vi.fn();render(<SentenceLine sentence={sentence} index={2} active={false} seek={seek} select={select}/>);
 fireEvent.click(screen.getByRole('button',{name:'选择第 3 句'}));expect(select).toHaveBeenCalledOnce();expect(seek).not.toHaveBeenCalled();
});
it('有来源片段的句子可定位，定位按钮不受残留文字选择阻挡',()=>{
 const sentence={...paperSchema.parse(paper).sections[0].questions[0].sentences[0],startMs:null,endMs:null,sourceWindowStartMs:190000,sourceWindowEndMs:200000};
 const seek=vi.fn();render(<SentenceLine sentence={sentence} index={2} active={false} seek={seek}/>);
 const selection=vi.spyOn(window,'getSelection').mockReturnValue({toString:()=>sentence.text} as Selection);
 fireEvent.click(screen.getByRole('button',{name:'定位关联片段：第 3 句'}));expect(seek).toHaveBeenCalledWith(190000);selection.mockRestore();
});
