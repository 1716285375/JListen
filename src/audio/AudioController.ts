import { toMs, toSeconds } from './time';
import { validLoop, type Loop } from './sentenceIndex';
export type AudioSnapshot = {timeMs: number; durationMs: number; playing: boolean; ready: boolean; loop: Loop | null; error: string | null};
export class AudioController {
  readonly media: HTMLAudioElement;
  private frame = 0;
  private lastUpdate = 0;
  private destroyed = false;
  private listeners = new Set<(snapshot: AudioSnapshot) => void>();
  private loop: Loop | null = null;
  private previewEndMs: number | null = null;
  private ready = false;
  private error: string | null = null;
  private durationMs = 0;
  private range = {startMs:0,endMs:0};
  private bindings: Array<[string, EventListener]> = [];
  constructor(media = new Audio()) {
    this.media = media; media.preload = 'metadata'; media.volume = 0.8; media.preservesPitch = true;
    this.bind('loadedmetadata', () => {
      this.durationMs = toMs(media.duration); this.ready = true;
      if (this.range.endMs > this.durationMs + 100) {
        this.ready = false; this.error = '录音时长与题目时间不符，请检查内容。';
      } else this.seek(this.range.startMs);
      this.emit();
    });
    this.bind('play', () => { this.frame = requestAnimationFrame(this.tick); this.emit(); });
    this.bind('pause', () => { cancelAnimationFrame(this.frame); this.emit(); });
    this.bind('seeked', () => this.emit());
    this.bind('ended', () => {
      if (this.loop) { this.media.currentTime = toSeconds(this.loop.startMs); void this.play(); }
      this.emit();
    });
    this.bind('error', () => { this.error = '此音频不可播放，请检查文件或网络连接。'; this.ready = false; this.emit(); });
  }
  private bind(name: string, callback: EventListener) { this.media.addEventListener(name,callback); this.bindings.push([name,callback]); }
  private emit() { if (!this.destroyed) for (const listener of this.listeners) listener(this.snapshot()); }
  snapshot(): AudioSnapshot { return {timeMs:this.getCurrentTimeMs(),durationMs:this.durationMs,playing:!this.media.paused,ready:this.ready,loop:this.loop,error:this.error}; }
  subscribe(listener: (snapshot: AudioSnapshot) => void) { this.listeners.add(listener); listener(this.snapshot()); return () => {this.listeners.delete(listener);}; }
  load(src: string, range: {startMs:number; endMs:number}, durationMs: number) {
    this.range = range; this.durationMs = durationMs; this.media.src = src; this.media.load();
  }
  private tick = (timestamp: number) => {
    if (this.destroyed || this.media.paused) return;
    this.enforceBoundaries();
    if (timestamp - this.lastUpdate >= 80) {this.lastUpdate = timestamp;this.emit();}
    if (!this.media.paused) this.frame = requestAnimationFrame(this.tick);
  };
  // Shared by animation-frame playback and deterministic boundary tests.
  enforceBoundaries() {
    if (this.media.paused) return;
    const ms = this.getCurrentTimeMs();
    if (this.previewEndMs !== null && ms >= this.previewEndMs) {
      this.media.currentTime = toSeconds(this.previewEndMs - 1);
      this.previewEndMs = null;
      this.pause();
      return;
    }
    if (this.loop && (ms >= this.loop.endMs || ms < this.loop.startMs)) this.media.currentTime = toSeconds(this.loop.startMs);
    else if (ms >= this.range.endMs) {this.media.currentTime = toSeconds(this.range.endMs);this.pause();}
    else if (ms < this.range.startMs) this.media.currentTime = toSeconds(this.range.startMs);
  }
  async play() {
    if (!this.ready || this.destroyed) return;
    if (this.getCurrentTimeMs() >= this.range.endMs) this.seek(this.loop?.startMs ?? this.range.startMs);
    try {await this.media.play();this.error = null;} catch {this.error = '播放未能开始，请再次点击播放。';}
    this.emit();
  }
  pause() { this.media.pause(); }
  async preview(startMs:number,endMs:number) {
    if (!validLoop({kind:'sentence',startMs,endMs},this.durationMs) || startMs<this.range.startMs || endMs>this.range.endMs) return false;
    this.loop = null;
    this.seek(startMs);
    this.previewEndMs = endMs;
    await this.play();
    return true;
  }
  seek(ms: number) {
    if (!Number.isFinite(ms)) return;
    this.previewEndMs = null;
    const target = Math.round(Math.max(this.range.startMs,Math.min(ms,this.range.endMs)));
    if (this.loop && (target < this.loop.startMs || target >= this.loop.endMs)) this.loop = null;
    this.media.currentTime = toSeconds(target);this.emit();
  }
  setVolume(value:number) {if (Number.isFinite(value)) this.media.volume = Math.max(0,Math.min(value,1));}
  setRate(rate:number) {if (rate > 0 && Number.isFinite(rate)) this.media.playbackRate = rate;}
  setLoop(loop: Loop | null) {
    if (loop && (!validLoop(loop,this.durationMs) || loop.startMs < this.range.startMs || loop.endMs > this.range.endMs)) return false;
    this.loop = loop;
    this.previewEndMs = null;
    if (loop) this.media.currentTime = toSeconds(loop.startMs);
    this.emit(); return true;
  }
  getCurrentTimeMs() {return toMs(this.media.currentTime);}
  getDurationMs() {return this.durationMs;}
  destroy() {
    this.destroyed = true;cancelAnimationFrame(this.frame);this.media.pause();
    for (const [name, callback] of this.bindings) this.media.removeEventListener(name,callback);
    this.bindings = [];this.listeners.clear();this.media.removeAttribute('src');this.media.load();
  }
}
