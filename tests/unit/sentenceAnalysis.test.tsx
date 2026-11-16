import {it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {SentenceAnalysis} from '../../src/components/transcript/SentenceAnalysis';
it('shows provided translation and separates unreviewed reference notes',()=>{
 render(<SentenceAnalysis sentence={{text:'会議です。',translation:'这是会议。',translationSource:'provided_model_translation',languageAnalysis:{wordGloss:[{surface:'会議',meaning:'会议'}],grammar:[],examFocus:'意图理解'}}}/>);
 expect(screen.getByText('这是会议。')).toBeInTheDocument();expect(screen.getByText('参考译文 · 待复核')).toBeInTheDocument();expect(screen.getByText('词汇与考点参考')).toBeInTheDocument();cleanup();
});
