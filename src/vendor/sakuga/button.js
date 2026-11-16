import './core.js';
// Sakuga Button: a button that reacts like an anime impact frame.
// Primary: press and it squashes flat with wedges above it. Let go and the button inverts for one frame and tilts, a spiky burst goes off
// behind it with crystals and four clouds, ドン! lands above it, then it springs tall and smoke rings drift off. Call done() for a check and a glint.
// Secondary (variant="secondary"): a small squash and three wedges at the corner.
//
// One file, no dependencies. Load it with a script tag and use <sakuga-button>Confirm</sakuga-button>.
// It fires an ordinary click. With type="submit" inside a form, it submits the form.
(() => {
function component(fx) {
const { rnd, later, at, esc, squashy, Spring, ticks, wob, lines, burst, shards, puff, sfx, donut, kira } = fx;

class SakugaButton extends fx.Base {
  static delegates = true;
  static observedAttributes = ['disabled'];
  static css = `
    .btn { position: relative; padding: 14px 30px; border: var(--sk-bw) solid var(--sk-btn-line); border-radius: var(--sk-r); background: var(--sk-card); color: var(--sk-ink); font: italic 800 19px/1.1 "Avenir Next", "Nunito", -apple-system, "Segoe UI", system-ui, sans-serif; letter-spacing: -.01em; box-shadow: var(--sk-btn-sh); cursor: pointer; user-select: none; -webkit-user-select: none; touch-action: manipulation; will-change: transform; }
    .btn.alt { border-color: var(--sk-alt-line); box-shadow: var(--sk-alt-sh); }
    .btn.inv { background: var(--sk-ink); color: var(--sk-card); box-shadow: none; }   /* the impact frame */
    .btn:disabled { opacity: .45; cursor: not-allowed; }
    .ok { display: inline-block; width: calc(var(--ok, 0) * 24px); height: 18px; margin-left: calc(var(--ok, 0) * 6px); vertical-align: -2px; overflow: visible; fill: none; stroke: var(--sk-acc); stroke-width: 4.4; stroke-linecap: round; stroke-linejoin: round; transform: scale(var(--ok, 0)); }`;

  get primary() { return this.getAttribute('variant') !== 'secondary'; }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  attributeChangedCallback() { if (this.b) this.b.disabled = this.disabled; }

  render() {
    return `<button class="btn${this.primary ? '' : ' alt'}" type="button" part="button"${this.disabled ? ' disabled' : ''}><slot>${this.primary ? 'Confirm' : 'Cancel'}</slot>`
      + (this.primary ? '<svg class="ok" viewBox="0 0 24 18" aria-hidden="true"><path d="M3 9.5l6 6L21 2.5"/></svg>' : '') + '</button>';
  }
  setup() {
    const b = this.b = this.$('.btn');
    this.ok = new Spring(0, 420, 14); this.seq = 0;
    if (!this.primary) {
      this.sq = squashy(b, { low: 0.72, wide: 0.3 });
      b.addEventListener('click', () => { this.sq.s.x = Math.min(this.sq.s.x, 0.8); this.sq.s.v += 4; const c = at(b, 1, 0); ticks(c.x - 8, c.y - 4, { dir: -1.05, n: 3, r: 5, len: 17, fan: 0.36, life: 0.5 }); });
    } else {
      this.sq = squashy(b, { low: 0.5, wide: 0.24 }); this.back = this.backLayer();
      b.addEventListener('pointerdown', () => { if (b.disabled) return; const c = at(b); ticks(c.x, c.y - c.h / 2 - 6, { dir: -Math.PI / 2, n: 3, r: 4, len: 14, fan: 0.5 }); wob(c.x - c.w / 2 - 6, c.y, { dir: -1, r: 10, life: 0.3 }); wob(c.x + c.w / 2 + 6, c.y, { dir: 1, r: 10, life: 0.3 }); lines(c.x, c.y + c.h / 2 + 10, { n: 3, dir: 0, len: 16, spread: 0.1, life: 0.25 }); });
      b.addEventListener('click', () => this.impact());
    }
    b.addEventListener('click', () => { if (this.getAttribute('type') === 'submit') this.closest('form')?.requestSubmit(); });
  }
  // the impact: what a click does. You can call it yourself.
  impact() {
    const b = this.b, sq = this.sq, c = at(b), n = ++this.seq; this.ok.to = 0; this.ok.x = 0;
    sq.s.x = Math.min(sq.s.x, 0.6); sq.pop.x = 1.24; sq.tilt.x = -5; b.classList.add('inv'); later(190, () => b.classList.remove('inv'));
    burst(c.x, c.y, { r: 98, spikes: 17, life: 0.48, layer: this.back }); shards(c.x, c.y, { n: 11, speed: 260, size: 9, life: 0.95, arc: 6.28, grav: 300 });
      for (const [dx, dy] of [[-1, -0.5], [1, -1], [-1, 0.9], [1, 1]]) puff(c.x + dx * (c.w / 2 + 6), c.y + dy * 26, { size: rnd(12, 16), n: 5, vx: dx * 46, vy: dy * 30 - 6, life: rnd(0.75, 1.05) });
      sfx('don', c.x + 10, c.y - 84, { size: 176, rot: -0.12, life: 1.05 }); ticks(c.x - 96, c.y - 70, { dir: -2.4, n: 2, r: 4, len: 22, life: 0.45 }); ticks(c.x + 110, c.y - 60, { dir: -0.7, n: 2, r: 4, len: 22, life: 0.45 });
    later(200, () => { if (n !== this.seq) return; sq.s.x = 1.22; wob(c.x - c.w / 2 - 8, c.y, { dir: -1 }); wob(c.x + c.w / 2 + 8, c.y, { dir: 1 });
      donut(c.x + 6, c.y - 44, { r: 30, vx: 22, vy: -52, life: 1.25 }); later(90, () => donut(c.x + 54, c.y - 50, { r: 18, vx: 34, vy: -40, life: 1.1 })); later(170, () => donut(c.x + 86, c.y - 46, { r: 10, vx: 40, vy: -30, life: 0.95 }));
        shards(c.x - 30, c.y + 30, { n: 2, speed: 20, size: 6, dir: Math.PI / 2, arc: 1, grav: 380 }); shards(c.x + 34, c.y + 30, { n: 2, speed: 20, size: 6, dir: Math.PI / 2, arc: 1, grav: 380 }); });
  }
  // a check lands on the button with a glint, and goes after a while. hold is how long it stays, in seconds.
  done(hold = 1.8) {
    if (!this.primary || !this.b) return; const n = this.seq; this.ok.to = 1; const q = at(this.b, 1, 0);
    kira(q.x - 16, q.y + 2, { r: 15, life: 1 }); ticks(q.x - 2, q.y - 12, { dir: -0.8, n: 2, r: 6, len: 12 });
    if (hold > 0) later(hold * 1000, () => { if (n === this.seq) this.ok.to = 0; });
  }
  frame(dt) { this.sq.step(dt); if (this.primary) this.b.style.setProperty('--ok', Math.max(0, this.ok.step(dt)).toFixed(3)); }
}
fx.define('sakuga-button', SakugaButton);
}


component(window.SakugaFX);
})();
