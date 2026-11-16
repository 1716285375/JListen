import './core.js';
// Sakuga Radio: a radio group. The picked dot springs in, a fan of wedges goes off it, two puffs drift away, and a hollow ポン pops up.
//
// One file, no dependencies. Load it with a script tag, and list the choices as <option>s inside it:
//   <sakuga-radio label="Plan"><option value="a" selected>Option A</option><option value="b">Option B</option></sakuga-radio>
// Read el.value. It fires change. With a name, it is sent with its form.
(() => {
function component(fx) {
const { Spring, later, at, esc, ticks, lines, puff, sfx, hollow } = fx;
let count = 0;

class SakugaRadio extends fx.Base {
  static formAssociated = true;
  static fromChildren = true;
  static observedAttributes = ['value', 'disabled'];
  static css = `
    .rad { display: grid; gap: 12px; }
    label { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; -webkit-user-select: none; }
    input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }
    .dot { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border: var(--sk-bw) solid var(--sk-ink); border-radius: 50%; background: var(--sk-card); will-change: transform; }
    .dot::after { content: ""; width: 19px; height: 19px; border-radius: 50%; background: var(--sk-pri); scale: var(--d, 0); }
    input:focus-visible + .dot { outline: 2.5px solid var(--sk-acc); outline-offset: 3px; }
    :host([disabled]) label { opacity: .5; cursor: not-allowed; }`;
  get value() { return this.rows ? (this.rows.find((r) => r.inp.checked)?.inp.value ?? '') : this.getAttribute('value') || ''; }
  set value(v) { if (!this.rows) { this.setAttribute('value', v); return; } for (const r of this.rows) r.inp.checked = r.inp.value === String(v); this.settle(true); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  attributeChangedCallback(name, _, v) { if (!this.rows) return; if (name === 'value') this.value = v; else for (const r of this.rows) r.inp.disabled = this.disabled; }
  render() {
    const name = 'sk-radio-' + ++count, want = this.getAttribute('value');
    const opts = [...this.querySelectorAll('option')].map((o, i) => ({ v: o.value || String(i), t: o.textContent.trim(), on: want !== null ? (o.value || String(i)) === want : o.selected }));
    if (!opts.length) opts.push({ v: 'a', t: 'Option A', on: true }, { v: 'b', t: 'Option B', on: false });
    return `<div class="rad" role="radiogroup" part="group" aria-label="${esc(this.getAttribute('label') || 'Options')}">${opts.map((o) => `<label part="option"><input type="radio" name="${name}" value="${esc(o.v)}"${o.on ? ' checked' : ''}${this.disabled ? ' disabled' : ''}><span class="dot" part="dot"></span>${esc(o.t)}</label>`).join('')}</div>`;
  }
  settle(quiet) { for (const r of this.rows) { r.s.to = r.inp.checked ? 1 : 0; if (quiet) r.s.x = r.s.to; } this.internals.setFormValue(this.value || null); }
  setup() {
    this.rows = this.$$('label').map((l) => ({ inp: l.querySelector('input'), dot: l.querySelector('.dot'), s: new Spring(0, 520, 14) }));
    this.settle(true);
    for (const r of this.rows) r.inp.addEventListener('change', () => {
      this.settle(); const c = at(r.dot);
      ticks(c.x, c.y, { dir: -2.3, n: 4, r: 20, len: 15, fan: 0.36, life: 0.5 }); lines(c.x - 26, c.y + 18, { n: 3, dir: 2.6, len: 26, spread: 6 });
      puff(c.x + 26, c.y - 22, { size: 8, n: 3, vx: 16, vy: -14, life: 0.7 }); later(120, () => puff(c.x + 78, c.y + 2, { size: 7, n: 3, vx: 10, vy: -10, life: 0.6 }));
      sfx('pon', c.x + 70, c.y - 76, { size: 86, rot: 0.06, life: 0.8, ...hollow() });
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  frame(dt) { for (const r of this.rows) r.dot.style.setProperty('--d', Math.max(0, r.s.step(dt)).toFixed(3)); }
}
fx.define('sakuga-radio', SakugaRadio);
}


component(window.SakugaFX);
})();
