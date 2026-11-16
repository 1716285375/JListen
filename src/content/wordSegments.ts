import type { Sentence, Token } from './schemas';
const segmenter = new Intl.Segmenter('ja', {granularity:'word'});
export function wordSegments(sentence: Sentence): Token[] {
  if (sentence.tokensStatus === 'reviewed' && sentence.tokens.map(t=>t.surface).join('') === sentence.text) return sentence.tokens;
  let offset=0;
  const readings=(sentence.furiganaTokens??[]).map(t=>{const start=offset;offset+=t.surface.length;return {...t,start,end:offset};});
  const validReadings=readings.map(t=>t.surface).join('')===sentence.text;
  return Array.from(segmenter.segment(sentence.text), part=>{
    const end=part.index+part.segment.length;
    const covered=validReadings?readings.filter(t=>t.start>=part.index&&t.end<=end):[];
    const reading=covered.length&&covered[0].start===part.index&&covered.at(-1)!.end===end?covered.map(t=>t.reading||t.surface).join(''):undefined;
    const meanings=[...new Set((sentence.languageAnalysis?.wordGloss??[]).filter(w=>w.surface===part.segment).map(w=>w.meaning))];
    const meaning=meanings.length===1?meanings[0]:undefined;
    return {...(meaning?{meaning,note:'词义参考 · 待复核'}:{}),id:`${sentence.id}-word-${part.index}`,surface:part.segment,reading,isPunctuation:!part.isWordLike};
  });
}
