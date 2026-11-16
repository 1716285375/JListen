import './core.js';
// Sakuga Input: a text field that kicks up dust. Focus it and wedges fly off the corner; every key throws a puff of dust (and now and then
// a chip) from where the caret is, and the box gives a little.
//
// One file, no dependencies. Load it with a script tag and use <sakuga-input label="Name" placeholder="Type something"></sakuga-input>.
// Read and set el.value. It fires input and change like a text input. With a name, it is sent with its form.
(() => {
function component(fx) {
const { Spring, rnd, at, esc, ticks, lines, puff, shards } = fx;
const TYPES = ['text', 'email', 'search', 'url', 'tel', 'password'];

class SakugaInput extends fx.Base {
  static delegates = true;
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'disabled', 'label'];
  static css = `
    input { width: var(--sk-input-width, 230px); max-width: 100%; padding: 13px 16px; border: var(--sk-bw) solid var(--sk-ink); border-radius: var(--sk-r); background: var(--sk-card); box-shadow: var(--sk-sh); font-weight: 600; font-size: 16px; outline: none; caret-color: var(--sk-ink); will-change: transform; }
    input::placeholder { color: var(--sk-dim); } input:disabled { opacity: .5; }`;
  get value() { return this.inp ? this.inp.value : this.getAttribute('value') || ''; }
  set value(v) { if (this.inp) { this.inp.value = v; this.internals.setFormValue(this.inp.value); } else this.setAttribute('value', v); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  attributeChangedCallback(name, _, v) {
    if (!this.inp) return;
    if (name === 'value') this.value = v ?? ''; else if (name === 'disabled') this.inp.disabled = this.disabled;
    else if (name === 'label') this.inp.setAttribute('aria-label', v || 'Text'); else this.inp.placeholder = v ?? '';
  }
  render() {
    const a = (n, d = '') => esc(this.getAttribute(n) ?? d), type = TYPES.includes(this.getAttribute('type')) ? this.getAttribute('type') : 'text';
    return `<input part="input" type="${type}" value="${a('value')}" placeholder="${a('placeholder')}" aria-label="${a('label', 'Text')}" autocomplete="${a('autocomplete', 'off')}"${this.disabled ? ' disabled' : ''}>`;
  }
  setup() {
    const inp = this.inp = this.$('input'), m = document.createElement('canvas').getContext('2d'); this.s = new Spring(1, 700, 16); this.internals.setFormValue(inp.value);
    inp.addEventListener('focus', () => { const c = at(inp, 1, 0); this.s.x = 1.04; ticks(c.x - 6, c.y - 4, { dir: -1.05, n: 3, r: 5, len: 17, fan: 0.36, life: 0.5 }); });
    inp.addEventListener('input', () => {   // every key kicks up a little dust where the caret is
      this.internals.setFormValue(inp.value);
      const cs = getComputedStyle(inp); m.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const shown = inp.type === 'password' ? '•'.repeat(inp.selectionStart ?? inp.value.length) : inp.value.slice(0, inp.selectionStart ?? inp.value.length);
      const c = at(inp, 0, 0.5), x = c.x + 18 + Math.min(c.w - 38, m.measureText(shown).width);
      this.s.x = 0.985; puff(x, c.y + 10, { size: rnd(4, 6), n: 2, vy: -22, vx: rnd(-10, 10), life: 0.4 }); if (Math.random() < 0.35) shards(x, c.y + 6, { n: 2, speed: 110, size: 3, life: 0.5 });
    });
    inp.addEventListener('change', () => this.dispatchEvent(new Event('change', { bubbles: true })));
  }
  frame(dt) { const y = this.s.step(dt); this.inp.style.transform = Math.abs(y - 1) < 0.0006 ? '' : `scale(${y})`; }
}
fx.define('sakuga-input', SakugaInput);
}


component(window.SakugaFX);
})();
