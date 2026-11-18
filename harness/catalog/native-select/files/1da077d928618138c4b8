import type { PropertyValues, TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

import { FormAssociated } from '../../mixins/form-associated';
import { NativeControl } from '../../mixins/native-control';
import { nativeSelectStyles } from './NativeSelect.styles';

const TAG = 'sb-native-select';

interface OptionItem {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
}

type Item = ({ kind: 'option' } & OptionItem) | { kind: 'group'; label: string; disabled: boolean; options: OptionItem[] };

const readOption = (el: HTMLOptionElement): OptionItem => ({
  value: el.value,
  label: el.label,
  disabled: el.disabled,
  selected: el.hasAttribute('selected'),
});

export class SbNativeSelect extends NativeControl(FormAssociated(LitElement)) {
  static override styles = nativeSelectStyles;

  @property({ type: Boolean, reflect: true, attribute: 'hide-label' }) hideLabel = false;

  @property({ attribute: 'error-message' }) errorMessage = '';

  @property({ reflect: true }) size: 'medium' | 'small' = 'medium';

  @property() value = '';

  @state() private items: Item[] = [];

  @state() private touched = false;

  @state() private nativeMessage = '';

  #observer = new MutationObserver(() => this.#readItems());

  #resolved = false;

  constructor() {
    super();
    this.addEventListener('invalid', () => {
      this.touched = true;
      this.#readNativeMessage();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    this.#readItems();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  private get select() {
    return this.shadowRoot?.querySelector('select');
  }

  override click() {
    if (!this.isDisabled) this.select?.focus();
  }

  protected override validationAnchor() {
    return this.select as unknown as HTMLInputElement | null | undefined;
  }

  get #options() {
    return this.items.flatMap((item) => (item.kind === 'group' ? item.options : [item]));
  }

  // Mirrors a native select: the selected option, else the first.
  #defaultValue() {
    const options = this.#options;
    const attr = this.getAttribute('value');
    if (attr !== null && options.some((o) => o.value === attr)) return attr;
    return (options.find((o) => o.selected) ?? options[0])?.value ?? '';
  }

  #readItems() {
    this.items = [...this.children].flatMap((child): Item[] => {
      if (child instanceof HTMLOptionElement) return [{ kind: 'option', ...readOption(child) }];
      if (child instanceof HTMLOptGroupElement) {
        const options = [...child.children].filter((c): c is HTMLOptionElement => c instanceof HTMLOptionElement);
        return [{ kind: 'group', label: child.label, disabled: child.disabled, options: options.map(readOption) }];
      }
      return [];
    });
    const options = this.#options;
    if (!options.length) return;
    if (!this.#resolved && !this.hasAttribute('value')) this.value = this.#defaultValue();
    else if (!options.some((o) => o.value === this.value)) this.value = this.#defaultValue();
    this.#resolved = true;
  }

  protected formValue() {
    return this.value;
  }

  protected formReset() {
    this.value = this.#defaultValue();
    this.touched = false;
    this.nativeMessage = '';
  }

  protected formStateRestore(state: string | File | FormData | null) {
    if (typeof state === 'string') this.value = state;
  }

  #readNativeMessage() {
    this.nativeMessage = this.select?.validationMessage ?? '';
  }

  #handleInput = (event: Event) => {
    this.value = (event.target as HTMLSelectElement).value;
    this.syncFormState();
    if (this.touched) this.#readNativeMessage();
  };

  #handleBlur = () => {
    this.handleBlur();
    this.touched = true;
    this.#readNativeMessage();
  };

  protected override syncFormState() {
    super.syncFormState();
    if (this.errorMessage) this.internals.setValidity({ customError: true }, this.errorMessage, this.select ?? undefined);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.touched && changed.has('value')) this.#readNativeMessage();
  }

  private get shownError() {
    return this.errorMessage || (this.touched ? this.nativeMessage : '');
  }

  #renderOption(o: OptionItem): TemplateResult {
    return html`<option value=${o.value} ?disabled=${o.disabled} .selected=${live(o.value === this.value)}>${o.label}</option>`;
  }

  protected override render() {
    const error = this.shownError;
    const describedBy = [this.description ? 'description' : '', error ? 'error' : ''].filter(Boolean).join(' ');
    return html`<div part="field">
      <label part="label" for="select"
        >${this.label}${this.required ? html`<span part="required-indicator" aria-hidden="true"> *</span>` : nothing}</label
      >
      <div part="control">
        <select
          id="select"
          part="select"
          name=${this.name || nothing}
          ?required=${this.required}
          ?disabled=${this.isDisabled}
          aria-invalid=${error ? 'true' : nothing}
          aria-describedby=${describedBy || nothing}
          @input=${this.#handleInput}
          @change=${this.handleChange}
          @focus=${this.syncFocusVisible}
          @keydown=${this.syncFocusVisible}
          @blur=${this.#handleBlur}
        >
          ${this.items.map((item) =>
            item.kind === 'group'
              ? html`<optgroup label=${item.label} ?disabled=${item.disabled}>
                  ${item.options.map((o) => this.#renderOption(o))}
                </optgroup>`
              : this.#renderOption(item),
          )}
        </select>
        <svg part="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </div>
      ${this.description ? html`<p id="description" part="description">${this.description}</p>` : nothing}
      <p id="error" part="error" aria-live="polite">${error}</p>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbNativeSelect);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbNativeSelect;
  }
}
