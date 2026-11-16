import './core.js';
// Sakuga Toast: a notification that streaks in from the left as a smear with speed lines behind it, lands in a cloud of dust with ズザッ
// in dotted letters, wobbles, and after a while leaves by shrinking.
//
// One file, no dependencies. Load it with a script tag, put <sakuga-toast></sakuga-toast> where the toast should appear, and call
// el.show('Saved successfully!'). It is a role="status" region, so the message is read out. The host keeps its place on the page while
// the toast is hidden; position it yourself (for example position: fixed; bottom: 24px; left: 24px).
(() => {
function component(fx) {
const { Spring, rnd, at, esc, lines, puff, shards, ticks, sfx, wob, dotted } = fx;

class SakugaToast extends fx.Base {
  static css = `
    :host { width: 236px; height: 56px; }
    .toast { position: absolute; left: 0; bottom: 0; display: flex; align-items: center; gap: 10px; width: 236px; padding: 12px 14px; border: var(--sk-bw) solid var(--sk-ink); border-radius: var(--sk-r); background: var(--sk-card); box-shadow: var(--sk-sh); font-weight: 700; font-size: 15px; white-space: nowrap; visibility: hidden; will-change: transform; }
    .toast.on { visibility: visible; }
    .ic { display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 50%; background: var(--sk-pri); border: 2.4px solid var(--sk-ink); }
    .ic svg { width: 15px; height: 15px; fill: none; stroke: var(--sk-on-pri); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    .msg { overflow: hidden; text-overflow: ellipsis; }
    .x { margin-left: auto; flex: none; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: none; font-weight: 900; font-size: 15px; cursor: pointer; }`;
  get open() { return this.state > 0 && this.state < 3; }
  render() { return `<div class="toast" part="toast"><span class="ic" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M3.5 10.5l4.5 4.5 8.5-10"/></svg></span><span class="msg" role="status"></span><button class="x" type="button" part="close" aria-label="Dismiss">✕</button></div>`; }
  setup() {
    this.toast = this.$('.toast'); this.msg = this.$('.msg'); this.sx = new Spring(-280, 280, 18); this.ss = new Spring(1, 420, 26); this.state = 0; this.at0 = 0; this.t = 0;
    this.$('.x').addEventListener('click', () => this.hide());
  }
  // show a message. It stays for the duration attribute (2.6 seconds by default), or until hide().
  show(text) {
    if (!this.toast) return; this.msg.textContent = text ?? this.getAttribute('message') ?? 'Saved successfully!';
    this.toast.classList.add('on'); this.sx.x = -280; this.sx.v = 1000; this.sx.to = 0; this.ss.x = 1; this.ss.to = 1; this.ss.k = 420; this.state = 1;
    if (fx.calm) { this.sx.x = 0; this.sx.v = 0; }
  }
  hide() { if (!this.open) return; this.state = 3; this.ss.to = 0; this.ss.k = 500; const c = at(this.toast); puff(c.x, c.y, { size: 9, n: 4, life: 0.5 }); }
  frame(dt) {
    this.t += dt; if (!this.state) return; const x = this.sx.step(dt), sc = this.ss.step(dt), st = 1 + Math.min(1.5, Math.abs(this.sx.v) * 0.0017);
    this.toast.style.transform = `translateX(${x}px) scale(${st * sc}, ${sc / Math.sqrt(st)})`;
    if (this.state === 1) { const c = at(this.toast); if (Math.random() < 0.8) lines(c.x - c.w / 2 - 6, c.y + rnd(-14, 14), { n: 1, dir: Math.PI, len: 80, spread: 2, life: 0.22 });
      if (x > -10) { this.state = 2; this.at0 = this.t;   // it lands
        lines(c.x - c.w / 2 - 4, c.y, { n: 9, dir: Math.PI, len: 70, spread: 18, life: 0.4 }); for (const u of [-0.5, -0.36, -0.2]) puff(c.x + c.w * u, c.y + c.h / 2 + 4, { size: rnd(8, 12), n: 4, vx: -rnd(10, 30), vy: -8, life: rnd(0.7, 1) });
          puff(c.x + c.w / 2 + 8, c.y + 10, { size: 7, n: 3, vx: 20, life: 0.6 }); shards(c.x - c.w / 2, c.y + 12, { n: 4, size: 4, dir: Math.PI + 0.5, arc: 1.6 }); ticks(c.x + 30, c.y + c.h / 2 + 12, { dir: 0.5, n: 2, r: 4, len: 16 });
          sfx('zuza', c.x - 34, c.y - 58, { size: 124, rot: -0.1, ...dotted() }); wob(c.x + c.w / 2 + 6, c.y, { dir: 1 }); } }
    else if (this.state === 2 && this.t - this.at0 > (+this.getAttribute('duration') || 2.6)) this.hide();
    else if (this.state === 3 && (sc < 0.03 || fx.calm)) { this.state = 0; this.toast.classList.remove('on'); this.toast.style.transform = ''; }
  }
}
fx.define('sakuga-toast', SakugaToast);
}


component(window.SakugaFX);
})();
