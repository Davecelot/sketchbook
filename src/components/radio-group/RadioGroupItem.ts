import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

import { radioGroupContext } from './context';
import { radioGroupStyles } from './RadioGroup.styles';

const TAG = 'sb-radio-group-item';

export class SbRadioGroupItem extends LitElement {
  static override styles = radioGroupStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property() value: string | null = null;

  @property({ reflect: true }) label = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private posInSet = 1;

  @state() private setSize = 1;

  readonly #group = new ContextConsumer(this, { context: radioGroupContext, subscribe: true });

  #warnedNoName = false;

  get control() {
    return this.shadowRoot?.querySelector<HTMLInputElement>('[part="control"]');
  }

  setPosition(posInSet: number, setSize: number) {
    this.posInSet = posInSet;
    this.setSize = setSize;
  }

  private get checked() {
    return this.value !== null && this.#group.value?.value === this.value;
  }

  private get isDisabled() {
    return this.disabled || (this.#group.value?.disabled ?? false);
  }

  #handleChange = (event: Event) => {
    if ((event.target as HTMLInputElement).checked && this.value !== null) this.#group.value?.select(this.value);
  };

  protected override updated() {
    if (this.#warnedNoName || this.label.trim()) return;
    this.#warnedNoName = true;
    console.warn(`<${TAG}> has no accessible name. Set label.`);
  }

  protected override render() {
    return html`<label part="root">
      <input
        part="control"
        type="radio"
        name="item"
        .checked=${live(this.checked)}
        ?disabled=${this.isDisabled}
        aria-posinset=${this.posInSet}
        aria-setsize=${this.setSize}
        @change=${this.#handleChange}
      />
      <span part="label">${this.label}</span>
    </label>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbRadioGroupItem);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbRadioGroupItem;
  }
}
