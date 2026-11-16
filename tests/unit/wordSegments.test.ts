import { describe,it,expect } from 'vitest';
import { wordSegments } from '../../src/content/wordSegments';
import type { Sentence } from '../../src/content/schemas';
describe('wordSegments',()=>{
 it('preserves source text and does not invent partial readings',()=>{
 const s={id:'test',text:'日本語を勉強します。',tokensStatus:'pending_agent_annotation',furiganaTokens:[{surface:'日本語を勉強します。',reading:'にほんごをべんきょうします。'}]} as Sentence;
 const words=wordSegments(s);expect(words.map(w=>w.surface).join('')).toBe(s.text);expect(words.filter(w=>!w.isPunctuation).length).toBeGreaterThan(1);expect(words.every(w=>w.reading===undefined)).toBe(true);expect(words.at(-1)?.isPunctuation).toBe(true);
 });
});

