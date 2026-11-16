import './core.js';
// Sakuga Slider: a range slider with a cloud behind the thumb.
// The value rides in a bubble that leans with the drag. The thumb stretches into a teardrop and lags on a spring. Drag fast and a bank of
// cumulus rolls up behind it with speed lines and chips, and シュッ. Let go at speed and a crescent flies on ahead, with two puffs left behind.
//
// One file, no dependencies. Load it with a script tag and use <sakuga-slider value="30" label="Volume"></sakuga-slider>.
// Read el.value. It fires input while it moves and change when it is let go. With a name, it is sent with its form.
(() => {
function component(fx) {
const { Spring, clamp, rnd, later, at, esc, puff, lines, shards, slash, burst, ticks, wob, sfx } = fx;

class SakugaSlider extends fx.Base {
  static delegates = true;
  static formAssociated = true;
  static observedAttributes = ['value', 'min', 'max', 'step', 'disabled', 'label', 'unit'];
  static css = `
    :host { margin: 30px 0 0; }
    .sld { position: relative; width: var(--sk-slider-width, 230px); max-width: 100%; height: 46px; }
    .trk { position: absolute; left: 0; right: 0; top: 16px; height: 14px; border: var(--sk-bw) solid var(--sk-ink); border-radius: 7px; background: var(--sk-card); overflow: hidden; }
    .trk i { display: block; height: 100%; width: calc(var(--v, 0) * 100% + 6px); max-width: 100%; background: var(--sk-pri); }
    .th { position: absolute; top: 9px; left: 0; width: 28px; height: 28px; border-radius: 50%; background: #fff; border: var(--sk-bw) solid var(--sk-ink); will-change: transform; }
    .val { position: absolute; top: -30px; left: -9px; min-width: 46px; padding: 3px 4px; border: 2.6px solid var(--sk-ink); border-radius: 9px; background: var(--sk-card); text-align: center; font: 800 13px/1.1 -apple-system, "Segoe UI", system-ui, sans-serif; white-space: nowrap; transform-origin: 50% 160%; will-change: transform; }
    .val::after { content: ""; position: absolute; left: 50%; top: 100%; margin-left: -5px; border: 5px solid transparent; border-top: 7px solid var(--sk-ink); }
    input { position: absolute; inset: -8px 0; width: 100%; height: calc(100% + 16px); margin: 0; opacity: 0; cursor: ew-resize; }
    input:disabled { cursor: not-allowed; } :host([disabled]) .sld { opacity: .5; }
    .sld:has(input:focus-visible) { outline: 2.5px solid var(--sk-acc); outline-offset: 6px; border-radius: 8px; }`;
  get value() { return this.r ? this.r.value : this.getAttribute('value') || '50'; }
  set value(v) { if (this.r) { this.r.value = v; this.sync(); } else this.setAttribute('value', v); }
  get valueAsNumber() { return +this.value; }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  attributeChangedCallback(name, _, v) {
    if (!this.r) return;
    if (name === 'value') { this.r.value = v; this.sync(); }
    else if (name === 'label') this.r.setAttribute('aria-label', v || 'Slider');
    else if (name === 'disabled') this.r.disabled = this.disabled;
    else if (name === 'unit') this.sync();
    else { if (v === null) this.r.removeAttribute(name); else this.r.setAttribute(name, v); this.sync(); }
  }
  render() {
    const a = (n, d) => esc(this.getAttribute(n) ?? d);
    return `<div class="sld" part="slider"><div class="trk"><i></i></div><span class="val" aria-hidden="true"></span><span class="th" part="thumb"></span>
      <input type="range" min="${a('min', 0)}" max="${a('max', 100)}" step="${a('step', 1)}" value="${a('value', 50)}" aria-label="${a('label', 'Slider')}"${this.disabled ? ' disabled' : ''}></div>`;
  }
  frac() { const r = this.r, lo = +r.min || 0, hi = r.max === '' ? 100 : +r.max; return hi > lo ? (+r.value - lo) / (hi - lo) : 0; }
  sync() { this.s.to = this.frac(); this.val.textContent = this.r.value + (this.getAttribute('unit') ?? '%'); this.internals.setFormValue(this.r.value); }
  setup() {
    const box = this.box = this.$('.sld'), r = this.r = this.$('input'); this.th = this.$('.th'); this.val = this.$('.val');
    this.s = new Spring(0, 420, 30); this.sync(); this.s.x = this.s.to; this.acc = 0; this.peak = 0; this.said = 0; this.t = 0;
    r.addEventListener('input', () => this.sync());
    r.addEventListener('change', () => {
      const c = at(this.th), dir = Math.sign(this.peak) || 1;
      if (Math.abs(this.peak) > 1.3) { slash(c.x + dir * 34, c.y, { len: 150, ang: dir > 0 ? 0 : Math.PI, thick: 12, life: 0.5, col: '#b8b3ff' }); burst(c.x + dir * 4, c.y, { r: 24, spikes: 11, life: 0.28 }); shards(c.x + dir * 10, c.y, { n: 4, size: 4, dir: dir > 0 ? 0 : Math.PI, arc: 2.4 }); ticks(c.x + dir * 52, c.y - 30, { dir: dir > 0 ? -0.6 : -2.5, n: 3, r: 4, len: 10 });
        later(520, () => { puff(c.x - dir * 60, c.y - 34, { size: 11, n: 4, vy: -10, life: 0.8 }); puff(c.x - dir * 22, c.y - 22, { size: 6, n: 3, vy: -8, life: 0.6 }); wob(c.x - dir * 82, c.y - 34, { dir: -1, r: 9 }); }); }
      if (this.frac() >= 1 || this.frac() <= 0) shards(c.x, c.y, { n: 5, dir: dir > 0 ? Math.PI : 0, arc: 2 });
      this.peak = 0; this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  frame(dt) {
    this.t += dt; const W = this.box.clientWidth - 28, x = this.s.step(dt), v = this.s.v, st = 1 + Math.min(1.5, Math.abs(v) * 0.3);
    this.th.style.transformOrigin = v > 0 ? '100% 50%' : '0 50%'; this.th.style.transform = `translateX(${x * W}px) scale(${st}, ${1 / Math.sqrt(st)})`;
    this.val.style.transform = `translateX(${x * W - (this.val.offsetWidth - 46) / 2}px) rotate(${clamp(-v * 5, -14, 14)}deg)`; this.box.style.setProperty('--v', clamp(x));
    if (Math.abs(v) > Math.abs(this.peak)) this.peak = v; else this.peak *= 0.96;
    if (Math.abs(v) > 0.35) {   // fast: a bank of cloud rolls up behind the thumb, with speed lines and chips
      this.acc += dt * Math.abs(v) * 20; const c = at(this.th), dir = Math.sign(v), big = Math.min(1, Math.abs(v) / 2.4);
      while (this.acc > 1) { this.acc -= 1; puff(c.x - dir * rnd(14, 30), c.y - rnd(2, 12) - big * 8, { size: rnd(6, 9) + big * 9, n: 4, vx: -dir * rnd(26, 70), vy: -rnd(22, 58) * (0.5 + big), life: rnd(0.7, 1.15) });
        lines(c.x - dir * 16, c.y + rnd(-4, 12), { n: 1, dir: dir > 0 ? Math.PI : 0, len: 50 + big * 50, spread: 2, life: 0.24 }); if (Math.random() < 0.3) shards(c.x - dir * 20, c.y + 6, { n: 1, size: 3.5, speed: 120, dir: dir > 0 ? Math.PI + 0.5 : -0.5, arc: 1 }); }
      if (Math.abs(v) > 1.5 && this.t - this.said > 1.1) { this.said = this.t; sfx('shu', c.x - dir * 6, c.y - 78, { size: 104, life: 0.75, rot: -0.16, col: '#5a4fd8', edge: '#ffffff' }); }
    }
  }
}
fx.define('sakuga-slider', SakugaSlider);
}


component(window.SakugaFX);
})();
