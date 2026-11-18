import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import { RovingFocusController } from '../../controllers/roving-focus';
import { NameWarningController } from '../../controllers/name-warning';
import { toggleGroupContext } from './context';
import { toggleGroupStyles } from './ToggleGroup.styles';
import './ToggleGroupItem';
import type { SbToggleGroupItem } from './ToggleGroupItem';

const TAG = 'sb-toggle-group';
const ITEM_TAG = 'sb-toggle-group-item';

// Only aria-label is forwarded: ID references don't resolve across shadow roots (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

export class SbToggleGroup extends LitElement {
  static formAssociated = true;
  static override styles = toggleGroupStyles;

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property({ reflect: true }) selection: 'single' | 'multiple' = 'single';

  @property({ reflect: true }) variant: 'ghost' | 'tertiary' = 'ghost';

  @property({ reflect: true }) size: 'medium' | 'small' | 'large' = 'medium';

  @property({ type: Number, reflect: true }) spacing = 0;

  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ attribute: 'value', converter: { fromAttribute: (v: string | null) => v?.split(/\s+/).filter(Boolean) ?? [] } }) value: string[] = [];

  @property({ type: Boolean, reflect: true }) disabled = false;

  // A <fieldset disabled> must not overwrite the author's disabled attribute.
  @state() private formDisabled = false;

  readonly #provider = new ContextProvider(this, { context: toggleGroupContext });

  readonly #roving = new RovingFocusController(this, {
    items: () => this.#items(),
    orientation: () => this.orientation,
    current: () => this.#items().find((item) => this.value.includes(item.value ?? '')),
    isDisabled: (item) => this.isDisabled || item.hasAttribute('disabled'),
  });

  constructor() {
    super();
    new NameWarningController(this);
    this.attachInternals();
    this.#provide();
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  #items() {
    return [...this.children].filter((el): el is SbToggleGroupItem => el.localName === ITEM_TAG);
  }

  #provide() {
    this.#provider.setValue({
      selection: this.selection,
      variant: this.variant,
      size: this.size,
      spacing: this.spacing,
      orientation: this.orientation,
      disabled: this.isDisabled,
      value: this.value,
      toggle: this.#toggle,
    });
  }

  #toggle = (value: string) => {
    const on = this.value.includes(value);
    if (this.selection === 'multiple') this.value = on ? this.value.filter((v) => v !== value) : [...this.value, value];
    else this.value = on ? [] : [value];
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }));
  };

  #syncPositions = () => {
    const items = this.#items();
    items.forEach((item, i) => {
      item.dataset.position = items.length === 1 ? 'only' : i === 0 ? 'first' : i === items.length - 1 ? 'last' : 'middle';
    });
    this.#roving.sync();
  };

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.size) this.#provide();
  }

  protected override render() {
    return html`<div
      part="group"
      role="group"
      aria-label=${this.getAttribute('aria-label') ?? nothing}
      data-orientation=${this.orientation}
      data-variant=${this.variant}
      ?data-joined=${this.spacing === 0}
      style=${`--_spacing:${this.spacing}`}
    >
      <slot @slotchange=${this.#syncPositions}></slot>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbToggleGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbToggleGroup;
  }
}
