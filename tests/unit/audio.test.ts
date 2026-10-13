import { describe,it,expect,vi,beforeEach } from 'vitest';
import { sentenceIndex,validLoop,relatedRange,displaySentenceIndex } from '../../src/audio/sentenceIndex';
import { AudioController } from '../../src/audio/AudioController';
import { formatTime,toMs,toSeconds } from '../../src/audio/time';
function setup() {
  const media=new Audio();let paused=true;
  Object.defineProperty(media,'paused',{get:()=>paused});Object.defineProperty(media,'duration',{value:3500});
  media.load=vi.fn();media.play=vi.fn(async()=>{paused=false;media.dispatchEvent(new Event('play'));});media.pause=vi.fn(()=>{paused=true;media.dispatchEvent(new Event('pause'));});
  const controller=new AudioController(media);controller.load('test.mp3',{startMs:180000,endMs:260000},3500000);media.dispatchEvent(new Event('loadedmetadata'));
  return {controller,media};
}
beforeEach(()=>{vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());});
describe('单一媒体时钟',()=>{
  it('毫秒与整卷绝对时间映射',()=>{expect(toMs(197.01)).toBe(197010);expect(toSeconds(197010)).toBe(197.01);expect(formatTime(197010,true)).toBe('03:17.01');});
  it('边界为半开区间，句间空白返回 null',()=>{const s=[{startMs:100,endMs:200},{startMs:300,endMs:400}];expect(sentenceIndex(s,100)).toBe(0);expect(sentenceIndex(s,200)).toBeNull();expect(sentenceIndex(s,300)).toBe(1);expect(sentenceIndex(s,400)).toBeNull();});
  it('共享来源片段保留选句，字幕空档保持文本，非法来源范围不可定位',()=>{
    const sentences=[{startMs:100,endMs:200},{startMs:null,endMs:null,sourceWindowStartMs:300,sourceWindowEndMs:500},{startMs:null,endMs:null,sourceWindowStartMs:300,sourceWindowEndMs:500}];
    expect(displaySentenceIndex(sentences,350,0)).toBe(1);expect(displaySentenceIndex(sentences,350,2)).toBe(2);expect(displaySentenceIndex(sentences,550,2)).toBe(2);
    expect(relatedRange(sentences[1],600)).toEqual({startMs:300,endMs:500});expect(relatedRange(sentences[1],400)).toBeNull();
    expect(relatedRange({startMs:null,endMs:null})).toBeNull();
  });
  it('seek 保持暂停且不越过本题',()=>{const {controller,media}=setup();controller.seek(197010);expect(media.currentTime).toBe(197.01);expect(media.play).not.toHaveBeenCalled();controller.seek(900000);expect(controller.getCurrentTimeMs()).toBe(260000);controller.destroy();});
  it('循环边界立即回到 start，暂停时不回跳',async()=>{const {controller,media}=setup();controller.setLoop({kind:'sentence',startMs:197010,endMs:204068});await controller.play();media.currentTime=204.071;controller.enforceBoundaries();expect(controller.getCurrentTimeMs()).toBe(197010);controller.pause();media.currentTime=204.071;controller.enforceBoundaries();expect(controller.getCurrentTimeMs()).toBe(204071);controller.destroy();});
  it('试听本句只播一次，暂停在本句末尾，跳转取消试听范围',async()=>{const {controller,media}=setup();await controller.preview(190000,193000);media.currentTime=193.01;controller.enforceBoundaries();expect(media.paused).toBe(true);expect(controller.getCurrentTimeMs()).toBe(192999);await controller.preview(190000,193000);controller.seek(200000);controller.enforceBoundaries();expect(media.paused).toBe(false);expect(controller.getCurrentTimeMs()).toBe(200000);expect(await controller.preview(170000,190000)).toBe(false);controller.destroy();});
  it('A-B 与句循环互斥，非法范围不可启用',()=>{const {controller}=setup();controller.setLoop({kind:'sentence',startMs:190000,endMs:195000});controller.setLoop({kind:'ab',startMs:200000,endMs:210000});expect(controller.snapshot().loop?.kind).toBe('ab');expect(controller.setLoop({kind:'ab',startMs:210000,endMs:200000})).toBe(false);expect(validLoop({kind:'ab',startMs:-1,endMs:2},20)).toBe(false);controller.destroy();});
  it('题目结束暂停，销毁后不再通知',async()=>{const {controller,media}=setup();const listener=vi.fn();controller.subscribe(listener);await controller.play();media.currentTime=261;controller.enforceBoundaries();expect(media.paused).toBe(true);expect(media.currentTime).toBe(260);controller.destroy();listener.mockClear();media.dispatchEvent(new Event('error'));expect(listener).not.toHaveBeenCalled();expect(media.getAttribute('src')).toBeNull();});
});
