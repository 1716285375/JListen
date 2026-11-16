import './core.js';
// Sakuga Tabs: the raised tab itself slides to the one you pick, stretching as it goes, and lands with wedges above it, a puff at the side
// it came from and speed lines behind it.
//
// One file, no dependencies. Load it with a script tag, and list the tabs as <option>s inside it:
//   <sakuga-tabs label="Sections"><option>Home</option><option>Profile</option><option>Settings</option></sakuga-tabs>
// Read el.selected (the index) and el.value. It fires change; show the matching panel there.
(() => {
function component(fx) {
const { Spring, later, at, esc, ticks, puff, lines } = fx;

class SakugaTabs extends fx.Base {
  static fromChildren = true;
  static observedAttributes = ['selected'];
  static css = `
    :host { margin-top: 10px; }
    .tabs { position: relative; display: flex; border: var(--sk-bw) solid var(--sk-ink); border-radius: 12px; background: var(--sk-card); box-shadow: var(--sk-sh); }
    .ind { position: absolute; top: -11px; bottom: -1px; left: 0; width: 10px; border: var(--sk-bw) solid var(--sk-ink); border-bottom: 0; border-radius: 13px 13px 0 0; background: var(--sk-card); margin: 0 0 0 calc(var(--sk-bw) * -1); will-change: transform, width; }
    button { position: relative; padding: 10px 15px; border: 0; border-left: 2.4px solid var(--sk-ink); background: none; font: 600 15px/1.2 -apple-system, "Segoe UI", system-ui, sans-serif; white-space: nowrap; cursor: pointer; transition: translate .18s cubic-bezier(.3, 1.6, .5, 1); }
    button:first-of-type { border-left-color: transparent; }
    button[aria-selected=true] { font-weight: 800; translate: 0 -5px; border-left-color: transparent; } button[aria-selected=true] + button { border-left-color: transparent; }`;
  get selected() { return this.tabs ? this.tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true') : +(this.getAttribute('selected') || 0); }
  set selected(i) { if (this.tabs) this.go(+i, true); else this.setAttribute('selected', i); }
  get value() { const t = this.tabs?.[this.selected]; return t ? t.dataset.value : ''; }
  attributeChangedCallback(_, __, v) { if (this.tabs && +v !== this.selected) this.go(+v || 0, true); }
  render() {
    const opts = [...this.querySelectorAll('option')].map((o, i) => ({ v: o.value || String(i), t: o.textContent.trim() }));
    if (!opts.length) opts.push(...['Home', 'Profile', 'Settings'].map((t) => ({ v: t.toLowerCase(), t })));
    return `<div class="tabs" role="tablist" part="tabs" aria-label="${esc(this.getAttribute('label') || 'Tabs')}"><span class="ind" part="indicator"></span>${opts.map((o) => `<button type="button" role="tab" part="tab" aria-selected="false" tabindex="-1" data-value="${esc(o.v)}">${esc(o.t)}</button>`).join('')}</div>`;
  }
  go(i, quiet) {
    const tabs = this.tabs; i = Math.max(0, Math.min(tabs.length - 1, i)); if (i === this.selected && !quiet) return;
    tabs.forEach((t, n) => { t.setAttribute('aria-selected', String(n === i)); t.tabIndex = n === i ? 0 : -1; });
    const t = tabs[i]; this.dir = Math.sign(t.offsetLeft - this.sx.to) || 1; this.sx.to = t.offsetLeft; this.sw.to = t.offsetWidth;
    if (quiet) { this.sx.x = this.sx.to; this.sw.x = this.sw.to; this.sx.v = 0; } else { this.pending = true; this.up.x = -5; this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { index: i, value: t.dataset.value, label: t.textContent } })); }
  }
  setup() {
    this.ind = this.$('.ind'); this.tabs = this.$$('button[role=tab]');
    this.sx = new Spring(0, 320, 23); this.sw = new Spring(10, 320, 26); this.up = new Spring(0, 420, 13); this.pending = false; this.dir = 1;
    this.tabs.forEach((t, i) => {
      t.addEventListener('click', () => this.go(i));
      t.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowLeft: -1, Home: -99, End: 99 }[e.key]; if (!d) return; e.preventDefault(); const n = Math.abs(d) > 1 ? (d < 0 ? 0 : this.tabs.length - 1) : (i + d + this.tabs.length) % this.tabs.length; this.go(n); this.tabs[n].focus(); });
    });
    this.go(+(this.getAttribute('selected') || 0), true);
    this.resizeObserver = new ResizeObserver(() => this.go(this.selected, true)); this.resizeObserver.observe(this.$('.tabs'));
  }
  connectedCallback() { super.connectedCallback(); if (this.resizeObserver) this.resizeObserver.observe(this.$('.tabs')); }
  disconnectedCallback() { super.disconnectedCallback(); this.resizeObserver?.disconnect(); }
  frame(dt) {
    const sx = this.sx, x = sx.step(dt), w = this.sw.step(dt) + Math.min(46, Math.abs(sx.v) * 0.06), u = this.up.step(dt);
    this.ind.style.transform = `translate(${x - (sx.v < 0 ? 0 : w - this.sw.x)}px, ${u}px)`; this.ind.style.width = w + 'px';
    if (this.pending && Math.abs(x - sx.to) < 3) {   // it has landed
      this.pending = false; this.up.x = -7; const c = at(this.tabs[this.selected]), dir = this.dir;
      ticks(c.x, c.y - c.h / 2 - 12, { dir: -Math.PI / 2, n: 3, r: 4, len: 15, fan: 0.5, life: 0.5 }); puff(c.x - dir * (c.w / 2 + 12), c.y - 6, { size: 9, n: 4, vx: -dir * 20, vy: -12, life: 0.7 });
      later(90, () => puff(c.x - dir * (c.w / 2 + 20), c.y + 14, { size: 6, n: 3, vx: -dir * 14, life: 0.55 })); lines(c.x - dir * c.w / 2, c.y, { n: 4, dir: dir > 0 ? Math.PI : 0, len: 34, spread: 10 });
    }
  }
}
fx.define('sakuga-tabs', SakugaTabs);
}


component(window.SakugaFX);
})();
