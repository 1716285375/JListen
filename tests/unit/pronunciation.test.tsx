import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {WordPronunciation} from '../../src/components/transcript/WordPronunciation';
it('speaks Japanese only on request and cancels on close',()=>{
 const speak=vi.fn(),cancel=vi.fn();
 vi.stubGlobal('SpeechSynthesisUtterance',class {text:string;constructor(text:string){this.text=text;}});
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{lang:'ja-JP',name:'Japanese'}],addEventListener:vi.fn(),removeEventListener:vi.fn(),speak,cancel}});
 render(<WordPronunciation text="かいぎ"/>);expect(speak).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'听发音'}));expect(speak.mock.calls[0][0]).toMatchObject({text:'かいぎ',lang:'ja-JP',rate:.85});cleanup();expect(cancel).toHaveBeenCalled();vi.unstubAllGlobals();
});
