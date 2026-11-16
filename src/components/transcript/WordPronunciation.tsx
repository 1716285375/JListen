import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { useLanguage } from '../../state/language';
export function WordPronunciation({text}:{text:string}) {
 const lang=useLanguage(s=>s.language);const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);const [playing,setPlaying]=useState(false);const [error,setError]=useState(false);
 const supported=typeof window!=='undefined'&&'speechSynthesis' in window;
 useEffect(()=>{if(!supported)return;const synth=window.speechSynthesis;const update=()=>setVoices(synth.getVoices().filter(v=>/^ja(?:-|$)/i.test(v.lang)));update();synth.addEventListener('voiceschanged',update);return()=>{synth.removeEventListener('voiceschanged',update);synth.cancel();};},[supported,text]);
 const play=()=>{const synth=window.speechSynthesis;synth.cancel();if(playing){setPlaying(false);return;}const speech=new SpeechSynthesisUtterance(text);speech.lang='ja-JP';speech.voice=voices[0];speech.rate=.85;speech.onend=()=>setPlaying(false);speech.onerror=()=>{setPlaying(false);setError(true);};setError(false);setPlaying(true);synth.speak(speech);};
 return <div className="word-pronunciation"><button type="button" className="pronunciation-button" disabled={!supported||!voices.length} aria-pressed={playing} onClick={play}>{playing?<Square size={16}/>:<Volume2 size={17}/>} {lang==='zh'?(playing?'停止':'听发音'):(playing?'Stop':'Listen')}</button><small>{lang==='zh'?'日语合成语音':'Japanese synthesized voice'}</small>{(!supported||!voices.length||error)&&<p role="status">{lang==='zh'?(error?'发音失败，请重试。':'当前设备未提供日语语音。'):(error?'Playback failed. Try again.':'No Japanese voice available on this device.')}</p>}</div>;
}
