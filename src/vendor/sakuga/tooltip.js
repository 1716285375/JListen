import './core.js';
// Sakuga Tooltip: a help button whose hint springs out of it like a speech bubble, with puffs either side, a ring off the button and a
// hollow カチッ.
//
// One file, no dependencies. Load it with a script tag and use <sakuga-tooltip text="Helpful hint!"></sakuga-tooltip>.
// It shows on hover, on focus and on tap, and Escape closes it. Whatever you put inside it replaces the "?" on the button.
(() => {
function component(fx) {
const { Spring, later, at, esc, puff, ticks, ring, sfx, squashy, hollow } = fx;
let count = 0;

class SakugaTooltip extends fx.Base {
  static delegates = true;
  static observedAttributes = ['text', 'label'];
  static css = `
    :host { margin-top: 60px; }
    .tip { position: absolute; left: 50%; bottom: calc(100% + 16px); width: max-content; max-width: 220px; min-width: 120px; padding: 11px 14px; border: var(--sk-bw) solid var(--sk-ink); border-radius: 13px; background: var(--sk-card); box-shadow: var(--sk-sh); font-size: 16px; font-weight: 800; text-align: center; translate: -50% 0; transform-origin: 50% 120%; transform: scale(0); will-change: transform; pointer-events: none; }
    .tip::after { content: ""; position: absolute; left: 50%; top: 100%; margin-left: -9px; border: 9px solid transparent; border-top: 12px solid var(--sk-ink); }
    .tip::before { content: ""; position: absolute; left: 50%; top: calc(100% - 4.5px); margin-left: -6px; border: 6px solid transparent; border-top: 8.5px solid var(--sk-card); z-index: 1; }
    .help { display: grid; place-items: center; width: 42px; height: 42px; padding: 0; border: var(--sk-bw) solid var(--sk-ink); border-radius: 50%; background: var(--sk-card); box-shadow: 4px 5px 0 var(--sk-soft); font-weight: 900; cursor: pointer; }`;
  get open() { return !!this.isOpen; }
  attributeChangedCallback(name, _, v) { if (!this.b) return; if (name === 'text') this.tip.textContent = v || ''; else this.b.setAttribute('aria-label', v || 'Help'); }
  render() { const id = 'sk-tip-' + ++count; return `<div class="tip" role="tooltip" id="${id}" part="tip">${esc(this.getAttribute('text') || 'Helpful hint!')}</div><button class="help" type="button" part="button" aria-describedby="${id}" aria-label="${esc(this.getAttribute('label') || 'Help')}"><slot>?</slot></button>`; }
  setup() {
    const b = this.b = this.$('.help'); this.tip = this.$('.tip'); this.s = new Spring(0, 460, 15); this.bs = squashy(b, { low: 0.78, wide: 0.3 }); this.isOpen = false;
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') this.show(true); }); b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.show(false); });
    b.addEventListener('focus', () => this.show(true)); b.addEventListener('blur', () => this.show(false)); b.addEventListener('click', () => this.show(!this.isOpen || this.root.activeElement === b));
    b.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.show(false); });
  }
  show(on = true) {
    if (on === this.isOpen) return; this.isOpen = on; this.s.to = on ? 1 : 0; this.s.d = on ? 15 : 34; if (!on) return; this.bs.s.v += 2;
    later(120, () => { if (!this.isOpen) return; const c = at(this.tip), q = at(this.b);
      puff(c.x - c.w / 2 - 8, c.y - 12, { size: 8, n: 4, vx: -14, vy: -10, life: 0.8 }); puff(c.x + c.w / 2 + 10, c.y + 12, { size: 8, n: 4, vx: 14, vy: -6, life: 0.8 }); puff(c.x - c.w / 2 - 4, c.y + 22, { size: 5, n: 3, vx: -10, life: 0.6 });
      ticks(c.x + c.w / 2 - 2, c.y - c.h / 2 - 6, { dir: -1.0, n: 3, r: 5, len: 16, fan: 0.36, life: 0.5 }); ring(q.x, q.y - q.h / 2 - 3, { rx: 22, ry: 5, life: 0.5, w: 3 }); sfx('kachi', c.x + 6, c.y - 46, { size: 96, rot: -0.08, life: 0.8, ...hollow() }); });
  }
  hide() { this.show(false); }
  frame(dt) { this.bs.step(dt); const y = Math.max(0, this.s.step(dt)); this.tip.style.transform = `scale(${y}) rotate(${(1 - y) * -10}deg)`; }
}
fx.define('sakuga-tooltip', SakugaTooltip);
}


component(window.SakugaFX);
})();
