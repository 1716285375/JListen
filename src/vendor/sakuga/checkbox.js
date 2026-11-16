import './core.js';
// Sakuga Checkbox: tick it and two crescents swing round the box, crystals fly, the tick draws itself, and ズザッ lands in dotted letters.
// Untick it and it goes out in a small puff.
//
// One file, no dependencies. Load it with a script tag and use <sakuga-checkbox>Remember me</sakuga-checkbox>.
// Read el.checked. It fires change. With a name, it is sent with its form like a checkbox.
(() => {
function component(fx) {
const { Spring, later, at, puff, slash, lines, shards, kira, sfx, dotted } = fx;

class SakugaCheckbox extends fx.Base {
  static delegates = true;
  static formAssociated = true;
  static observedAttributes = ['checked', 'disabled'];
  static css = `
    label { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; -webkit-user-select: none; }
    input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }
    .box { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border: var(--sk-bw) solid var(--sk-ink); border-radius: 9px; background: var(--sk-card); box-shadow: var(--sk-sh); will-change: transform; }
    svg { width: 26px; height: 26px; fill: none; stroke: var(--sk-tick); stroke-width: 4.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 30; stroke-dashoffset: 30; transition: stroke-dashoffset .24s cubic-bezier(.2, .9, .3, 1) .08s; }
    input:checked + .box svg { stroke-dashoffset: 0; }
    input:focus-visible + .box { outline: 2.5px solid var(--sk-acc); outline-offset: 3px; }
    :host([disabled]) label { opacity: .5; cursor: not-allowed; }`;
  get checked() { return this.inp ? this.inp.checked : this.hasAttribute('checked'); }
  set checked(v) { if (this.inp) { this.inp.checked = !!v; this.form(); } else this.toggleAttribute('checked', !!v); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  get value() { return this.getAttribute('value') || 'on'; }
  attributeChangedCallback(name) { if (!this.inp) return; if (name === 'checked') this.checked = this.hasAttribute('checked'); else this.inp.disabled = this.disabled; }
  form() { this.internals.setFormValue(this.checked ? this.value : null); }
  render() { return `<label part="label"><input type="checkbox"${this.hasAttribute('checked') ? ' checked' : ''}${this.disabled ? ' disabled' : ''}><span class="box" part="box"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10.5l4.5 4.5 8.5-10"/></svg></span><slot></slot></label>`; }
  setup() {
    const inp = this.inp = this.$('input'), box = this.box = this.$('.box'); this.s = new Spring(1, 600, 13); this.form();
    inp.addEventListener('change', () => {
      this.form(); this.s.x = 0.68; const c = at(box);
      if (!inp.checked) puff(c.x, c.y, { size: 7, n: 3, life: 0.4 });
      else {
        slash(c.x + 8, c.y + 2, { len: 150, ang: -0.42, thick: 13, life: 0.5 }); slash(c.x - 6, c.y + 12, { len: 110, ang: 2.72, thick: 7, life: 0.55 }); lines(c.x - 34, c.y + 26, { n: 6, dir: 2.75, len: 60, spread: 14 });
        shards(c.x, c.y, { n: 6, speed: 190, size: 6, arc: 6.28, grav: 260 }); later(380, () => kira(c.x + 24, c.y - 22, { r: 9 }));
        sfx('zuza', c.x + 30, c.y - 62, { size: 112, rot: -0.12, ...dotted() });
      }
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  frame(dt) { const y = this.s.step(dt); this.box.style.transform = Math.abs(y - 1) < 0.001 ? '' : `scale(${y}) rotate(${(1 - y) * 20}deg)`; }
}
fx.define('sakuga-checkbox', SakugaCheckbox);
}


component(window.SakugaFX);
})();
