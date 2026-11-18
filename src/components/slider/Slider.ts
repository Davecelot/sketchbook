import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';

import { FormAssociated } from '../../mixins/form-associated';
import { NativeControl } from '../../mixins/native-control';
import { sliderStyles } from './Slider.styles';

const TAG = 'sb-slider';

const parseValues = (text: string | null) =>
  (text ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));

export class SbSlider extends NativeControl(FormAssociated(LitElement)) {
  static override styles = sliderStyles;

  @property({ type: Boolean, reflect: true, attribute: 'hide-label' }) hideLabel = false;

  @property({ attribute: 'error-message' }) errorMessage = '';

  @property({ converter: { fromAttribute: parseValues } }) value: number[] = [];

  @property({ type: Number }) min = 0;

  @property({ type: Number }) max = 100;

  @property({ type: Number }) step = 1;

  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  private get inputs() {
    return [...(this.shadowRoot?.querySelectorAll<HTMLInputElement>('input') ?? [])];
  }

  protected override willUpdate() {
    const next = this.#normalize(this.value);
    if (next.length !== this.value.length || next.some((n, i) => n !== this.value[i])) this.value = next;
  }

  #normalize(values: number[]) {
    const { min, max } = this;
    const step = this.step > 0 ? this.step : 1;
    const out: number[] = [];
    for (const raw of values.length ? values : [min]) {
      const snapped = min + Math.round((raw - min) / step) * step;
      out.push(Math.min(Math.max(snapped, out.at(-1) ?? min), max));
    }
    return out;
  }

  protected formValue() {
    return String(this.value[0] ?? this.min);
  }

  protected formReset() {
    this.value = this.#normalize(parseValues(this.getAttribute('value')));
  }

  protected formStateRestore(state: string | File | FormData | null) {
    if (typeof state === 'string') this.value = this.#normalize(parseValues(state));
    else if (state instanceof FormData) this.value = this.#normalize(state.getAll(this.name).map(Number));
  }

  protected override syncFormState() {
    super.syncFormState();
    if (this.value.length > 1 && this.name) {
      const data = new FormData();
      for (const n of this.value) data.append(this.name, String(n));
      this.internals.setFormValue(data);
    }
    if (this.errorMessage) this.internals.setValidity({ customError: true }, this.errorMessage, this.inputs[0]);
  }

  #setValue(index: number, raw: number) {
    const next = [...this.value];
    next[index] = Math.min(Math.max(raw, next[index - 1] ?? this.min), next[index + 1] ?? this.max);
    this.value = next;
    this.syncFormState();
    return next[index];
  }

  #handleKeydown = (event: KeyboardEvent) => {
    this.syncFocusVisible(event);
    this.implicitSubmit(event);
  };

  #handleInput = (event: Event, index: number) => {
    const input = event.target as HTMLInputElement;
    const accepted = this.#setValue(index, Number(input.value));
    if (String(accepted) !== input.value) input.value = String(accepted);
  };

  #handlePointerDown = (event: PointerEvent) => {
    if (this.value.length < 2 || this.isDisabled || event.target instanceof HTMLInputElement || event.button !== 0) return;
    const control = event.currentTarget as HTMLElement;
    const rect = control.getBoundingClientRect();
    const vertical = this.orientation === 'vertical';
    const length = vertical ? rect.height : rect.width;
    const thumb = this.inputs[0]?.getBoundingClientRect()[vertical ? 'height' : 'width'] || 0;
    const offset = vertical ? rect.bottom - event.clientY : event.clientX - rect.left;
    const fraction = Math.min(Math.max((offset - thumb / 2) / Math.max(length - thumb, 1), 0), 1);
    const step = this.step > 0 ? this.step : 1;
    const target = this.min + Math.round(((this.max - this.min) * fraction) / step) * step;
    const distances = this.value.map((v) => Math.abs(v - target));
    let index = distances.indexOf(Math.min(...distances));
    const [low = 0, high] = this.value;
    if (low === high) index = target < low ? 0 : 1;
    const accepted = this.#setValue(index, target);
    const input = this.inputs[index];
    if (!input) return;
    input.value = String(accepted);
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    event.preventDefault();
  };

  private get fractions() {
    const span = this.max - this.min || 1;
    const f = this.value.map((v) => (v - this.min) / span);
    return f.length > 1 ? [f[0], f[f.length - 1]] : [0, f[0] ?? 0];
  }

  protected override render() {
    const multi = this.value.length > 1;
    const [from, to] = this.fractions;
    const describedBy = [this.description ? 'description' : '', this.errorMessage ? 'error' : ''].filter(Boolean).join(' ');
    return html`<div part="field">
      <label part="label" for="thumb-0">${this.label}</label>
      <div
        part="control"
        ?data-multi=${multi}
        style=${styleMap({ '--_from': String(from), '--_to': String(to) })}
        @pointerdown=${this.#handlePointerDown}
      >
        <div part="track"><div part="range"></div></div>
        ${this.value.map(
          (v, index) => html`<input
            id=${`thumb-${index}`}
            part="thumb"
            type="range"
            min=${this.min}
            max=${this.max}
            step=${this.step}
            .value=${live(String(v))}
            aria-label=${multi ? `${this.label} ${index === 0 ? 'minimum' : 'maximum'}` : nothing}
            aria-orientation=${this.orientation === 'vertical' ? 'vertical' : nothing}
            aria-invalid=${this.errorMessage ? 'true' : nothing}
            aria-describedby=${describedBy || nothing}
            ?disabled=${this.isDisabled}
            @input=${(event: Event) => this.#handleInput(event, index)}
            @change=${this.handleChange}
            @focus=${this.syncFocusVisible}
            @keydown=${this.#handleKeydown}
            @blur=${this.handleBlur}
          />`,
        )}
      </div>
      ${this.description ? html`<p id="description" part="description">${this.description}</p>` : nothing}
      <p id="error" part="error" aria-live="polite">${this.errorMessage}</p>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSlider);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSlider;
  }
}
