import './core.js';
// Sakuga Rating: five stars that pop in one after another. The last one lit gets a fan of wedges and a hollow ポン;
// five stars gets a burst behind it as well.
//
// One file, no dependencies. Load it with a script tag and use <sakuga-rating label="Rating"></sakuga-rating>.
// Read el.value (0 to 5). It fires change. Clicking the lit star again clears it. With a name, it is sent with its form.
(() => {
function component(fx) {
const { Spring, clamp, later, at, esc, puff, ticks, burst, shards, sfx, kira, hollow } = fx;
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z"/></svg>';

class SakugaRating extends fx.Base {
  static formAssociated = true;
  static observedAttributes = ['value', 'disabled'];
  static css = `
    .stars { display: flex; }
    button { width: 44px; height: 44px; padding: 2px; border: 0; background: none; cursor: pointer; will-change: transform; }
    button:disabled { cursor: not-allowed; opacity: .5; }
    svg { width: 100%; height: 100%; fill: var(--sk-card); stroke: var(--sk-ink); stroke-width: 2.3; stroke-linejoin: round; overflow: visible; }
    .lit svg { fill: var(--sk-pri); }`;
  get value() { return this.score ?? +(this.getAttribute('value') || 0); }
  set value(n) { if (this.btns) this.set(clamp(Math.round(+n || 0), 0, 5), true); else this.setAttribute('value', n); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  attributeChangedCallback(name, _, v) { if (!this.btns) return; if (name === 'value') this.value = v; else for (const b of this.btns) b.disabled = this.disabled; }
  render() { return `<div class="stars" role="radiogroup" part="stars" aria-label="${esc(this.getAttribute('label') || 'Rating')}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" part="star" aria-checked="false" tabindex="-1" aria-label="${n} star${n > 1 ? 's' : ''}"${this.disabled ? ' disabled' : ''}>${STAR}</button>`).join('')}</div>`; }
  set(n, quiet) {
    const was = this.score; this.score = n; this.internals.setFormValue(n ? String(n) : null);
    this.btns.forEach((b, i) => {
      b.setAttribute('aria-checked', String(i + 1 === n)); b.tabIndex = (n ? i + 1 === n : i === 0) ? 0 : -1;
      if (quiet) { b.classList.toggle('lit', i < n); return; }
      later(Math.max(0, i - was) * 60, () => {   // they light one after another
        b.classList.toggle('lit', i < n); if (!(i < n && i >= was)) return;
        this.sp[i].x = 0.35; const c = at(b); puff(c.x, c.y + 14, { size: 5, n: 2, life: 0.4 });
        if (i !== n - 1) return;
        ticks(c.x, c.y, { dir: -Math.PI / 2, n: 9, r: 20, len: n === 5 ? 26 : 17, fan: 0.698, life: 0.55 }); if (n === 5) { burst(c.x, c.y, { r: 46, life: 0.4, layer: this.back }); shards(c.x, c.y, { n: 6, size: 5, arc: 6.28 }); }
          sfx('pon', c.x + 20, c.y - 56, { size: n === 5 ? 120 : 92, rot: 0.08, life: 0.85, ...hollow() }); later(300, () => kira(c.x - 22, c.y - 30, { r: 8 }));
      });
    });
    if (!quiet) this.dispatchEvent(new Event('change', { bubbles: true }));
  }
  setup() {
    this.btns = this.$$('button'); this.sp = this.btns.map(() => new Spring(1, 560, 12)); this.back = this.backLayer(); this.score = 0;
    this.btns.forEach((b, i) => {
      b.addEventListener('click', () => this.set(this.score === i + 1 ? 0 : i + 1));
      b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]; if (!d) return; e.preventDefault(); const n = clamp((this.score || (d > 0 ? 0 : 2)) + d, 1, 5); this.set(n); this.btns[n - 1].focus(); });
    });
    this.set(clamp(Math.round(+this.getAttribute('value') || 0), 0, 5), true);
  }
  frame(dt) { this.btns.forEach((b, i) => { const y = this.sp[i].step(dt); b.style.transform = Math.abs(y - 1) < 0.001 ? '' : `scale(${y}) rotate(${(1 - y) * -34}deg)`; }); }
}
fx.define('sakuga-rating', SakugaRating);
}


component(window.SakugaFX);
})();
