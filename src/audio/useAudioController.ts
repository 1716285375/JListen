import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { z } from 'zod';
import { AudioController, type AudioSnapshot } from './AudioController';
import type { Paper, Question, Sentence } from '../content/schemas';
import { assetUrl, audioUrl } from '../platform/assetUrl';
import { toSeconds } from './time';
import { playRange } from './playRange';
import { seekable } from './sentenceIndex';
const initial: AudioSnapshot = {timeMs:0,durationMs:0,playing:false,ready:false,loop:null,error:null};
const peaksSchema = z.object({durationMs:z.number().positive(),peaks:z.array(z.array(z.number().min(-1).max(1))).min(1)});
export function useAudioController(paper:Paper,question:Question,active:Sentence | undefined) {
  const container = useRef<HTMLDivElement>(null);
  const controller = useRef<AudioController | null>(null);
  const regions = useRef<Regions | null>(null);
  const range=playRange(question,paper.audio.durationMs??0);
  const [state,setState] = useState<AudioSnapshot>({...initial,timeMs:range.startMs});
  const [waveError,setWaveError] = useState<string | null>(null);
  useEffect(() => {
    if (!paper.audio.available || !container.current) return;
    const audio = new AudioController();controller.current = audio;
    const unsubscribe = audio.subscribe(setState);
    const window=playRange(question,paper.audio.durationMs??0);
    audio.load(audioUrl(paper.audio.src),window,paper.audio.durationMs??0);
    const abort = new AbortController();let wave:WaveSurfer | null = null;let disposed = false;
    setWaveError(null);
    async function render() {
      try {
        if (!paper.audio.peaksPath) throw new Error('波形尚未生成');
        const response = await fetch(assetUrl(paper.audio.peaksPath),{signal:abort.signal});
        if (!response.ok) throw new Error('波形加载失败');
        const data = peaksSchema.parse(await response.json());
        if (disposed || !container.current) return;
        const regionPlugin = Regions.create();regions.current = regionPlugin;
        wave = WaveSurfer.create({container:container.current,media:audio.media,peaks:data.peaks,duration:toSeconds(data.durationMs),height:76,waveColor:'#A3B29C',progressColor:'#49614B',cursorColor:'#49614B',barWidth:2,barGap:2,minPxPerSec:10,autoScroll:true,autoCenter:true,interact:true,hideScrollbar:true,plugins:[Timeline.create({height:20,style:{fontSize:'10px',color:'#637066'}}),regionPlugin]});
        wave.on('ready',() => wave?.setScrollTime(toSeconds(window.startMs)));
        // All seeks pass through the controller, including paused waveform clicks.
        wave.on('click',relative => audio.seek(Math.round(relative * data.durationMs)));
        wave.on('error',() => {if (!disposed) setWaveError('波形不可用，可使用下方时间轴定位。');});
      } catch (error) {if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) setWaveError('波形不可用，可使用下方时间轴定位。');}
    }
    void render();
    return () => {disposed = true;abort.abort();unsubscribe();wave?.destroy();regions.current = null;audio.destroy();controller.current = null;};
  },[paper,question]);
  useEffect(() => {
    const plugin = regions.current;
    if (!plugin) return;
    plugin.clearRegions();
    const range = state.loop ?? active;
    if (range&&seekable(range)) plugin.addRegion({id:'active',start:toSeconds(range.startMs),end:toSeconds(range.endMs),color:state.loop?.kind === 'ab' ? '#D1A98055' : '#74887333',drag:false,resize:false});
  },[active,state.loop,state.ready]);
  return {container,controller,state,waveError,range};
}
