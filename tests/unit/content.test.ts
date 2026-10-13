import { describe,it,expect } from 'vitest';
import paper from '../../public/content/papers/n1-2010-07.json';
import { validatePaper } from '../../src/content/validate';
import { assetUrl, audioUrl } from '../../src/platform/assetUrl';
describe('题包与发布门禁',()=>{
  it('36 题 428 句可导入，首题有完整词义',()=>{const result=validatePaper(paper);expect(result.errors).toEqual([]);expect(result.paper?.sections[0].questions[0].sentences.every(s=>s.tokensStatus === 'reviewed')).toBe(true);});
  it('时间和授权未确认的内容阻止发布',()=>{const result=validatePaper(paper,true);expect(result.errors).toContain('未确认素材公开分发授权');expect(result.errors).toContain('所有句级时间尚未经音频校准');});
  it.each(['拼接','词义','重复','倒置'])('拒绝%s损坏',kind=>{const draft=structuredClone(paper);const sentences=draft.sections[0].questions[0].sentences;
    if(kind==='拼接')sentences[0].tokens[0].surface='错误';
    if(kind==='词义')sentences[0].tokens[0].meaning='';
    if(kind==='重复')sentences[1].id=sentences[0].id;
    if(kind==='倒置')sentences[0].endMs=sentences[0].startMs;
    expect(validatePaper(draft).errors.length).toBeGreaterThan(0);
  });
  it('静态资源支持子路径，拒绝路径逃逸',()=>{expect(assetUrl('/audio/a.mp3','/studio/')).toBe('/studio/audio/a.mp3');expect(()=>assetUrl('../private','/')).toThrow();expect(()=>assetUrl('https://example.com/a.mp3','/')).toThrow();});
  it('外部音频保留目录和原录音版本，拒绝凭据与路径逃逸',()=>{
    expect(audioUrl('audio/n1/2010-07/jlpt-n1-2010-07-listening.mp3','')).toBe('/audio/n1/2010-07/jlpt-n1-2010-07-listening.mp3');
    expect(audioUrl('audio/n1/2025-07/jlpt-n1-2025-07-listening-ai.mp3','https://cdn.example.com/jlisten')).toBe('https://cdn.example.com/jlisten/audio/n1/2025-07/jlpt-n1-2025-07-listening-ai.mp3');
    for(const base of ['http://example.com','https://user:secret@example.com','https://example.com/?token=x'])expect(()=>audioUrl('audio/a.mp3',base)).toThrow();
    expect(()=>audioUrl('../private','https://cdn.example.com')).toThrow();
  });
});
