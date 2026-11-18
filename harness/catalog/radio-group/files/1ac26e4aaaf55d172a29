import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { RovingFocusController } from '../../controllers/roving-focus';
import { NameWarningController } from '../../controllers/name-warning';
import { FormAssociated } from '../../mixins/form-associated';
import { submitOnEnter } from '../../mixins/native-control';
import { radioGroupContext } from './context';
import { radioGroupStyles } from './RadioGroup.styles';
import './RadioGroupItem';
import type { SbRadioGroupItem } from './RadioGroupItem';

const TAG = 'sb-radio-group';
const ITEM_TAG = 'sb-radio-group-item';

// Only aria-label is forwarded: ID references don't resolve across shadow roots (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

export class SbRadioGroup extends FormAssociated(LitElement) {
  static override styles = radioGroupStyles;

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property() value: string | null = null;

  @property({ reflect: true }) orientation: 'vertical' | 'horizontal' = 'vertical';

  readonly #provider = new ContextProvider(this, { context: radioGroupContext });

  readonly #roving = new RovingFocusController(this, {
    items: () => this.#items(),
    orientation: () => 'both',
    current: () => this.#items().find((item) => item.value === this.value),
    isDisabled: (item) => this.isDisabled || item.hasAttribute('disabled'),
    onMove: (item) => this.#select((item as SbRadioGroupItem).value ?? ''),
  });

  #defaultValue: string | null = null;

  constructor() {
    super();
    new NameWarningController(this);
    this.#provide();
    this.addEventListener('click', this.#handleLabelActivation);
    this.addEventListener('keydown', (event) => submitOnEnter(event, this.form, this.isDisabled));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#defaultValue = this.getAttribute('value');
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  #items() {
    return [...this.children].filter((el): el is SbRadioGroupItem => el.localName === ITEM_TAG);
  }

  #provide() {
    this.#provider.setValue({ value: this.value, disabled: this.isDisabled, select: this.#select });
  }

  #select = (value: string) => {
    if (this.value === value || this.isDisabled) return;
    this.value = value;
    this.syncFormState();
    this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
  };

  // A <label for> pointing at the host clicks the host itself: send focus to the tab stop.
  #handleLabelActivation = (event: MouseEvent) => {
    if (event.composedPath()[0] !== this) return;
    const items = this.#items().filter((item) => !this.isDisabled && !item.hasAttribute('disabled'));
    (items.find((item) => item.value === this.value) ?? items[0])?.focus();
  };

  #syncItems = () => {
    const items = this.#items();
    items.forEach((item, i) => item.setPosition(i + 1, items.length));
    this.#roving.sync();
    void Promise.all(items.map((item) => item.updateComplete)).then(() => this.syncFormState());
  };

  protected formValue() {
    return this.isDisabled ? null : this.value;
  }

  protected formReset() {
    this.value = this.#defaultValue;
  }

  protected formStateRestore(state: string | File | FormData | null) {
    if (typeof state === 'string') this.value = state;
  }

  protected validationAnchor() {
    const first = this.#items().find((item) => !item.hasAttribute('disabled'));
    return first?.control;
  }

  // The message comes from an unattached required radio so the browser localizes it.
  protected override syncFormState() {
    this.internals.setFormValue(this.formValue());
    const anchor = this.validationAnchor();
    if (this.required && this.value === null && !this.isDisabled && anchor) {
      const probe = Object.assign(document.createElement('input'), { type: 'radio', name: 'probe', required: true });
      this.internals.setValidity({ valueMissing: true }, probe.validationMessage, anchor);
    } else this.internals.setValidity({});
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.size) this.#provide();
  }

  protected override render() {
    return html`<div
      part="group"
      role="radiogroup"
      aria-label=${this.getAttribute('aria-label') ?? nothing}
      aria-required=${this.required ? 'true' : nothing}
    >
      <slot @slotchange=${this.#syncItems}></slot>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbRadioGroup;
  }
}
