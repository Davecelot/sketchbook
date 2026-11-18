import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

import { FormAssociated } from '../../mixins/form-associated';
import { NativeControl } from '../../mixins/native-control';
import { checkboxStyles } from './Checkbox.styles';

const TAG = 'sb-checkbox';

export class SbCheckbox extends NativeControl(FormAssociated(LitElement)) {
  static override styles = checkboxStyles;

  @property({ type: Boolean, reflect: true, attribute: 'hide-label' }) hideLabel = false;

  @property({ attribute: 'error-message' }) errorMessage = '';

  @property({ reflect: true }) value = 'on';

  @property({ type: Boolean }) selected = false;

  @property({ type: Boolean }) indeterminate = false;

  @state() private touched = false;

  @state() private nativeMessage = '';

  constructor() {
    super();
    this.addEventListener('invalid', () => {
      this.touched = true;
      this.#readNativeMessage();
    });
  }

  protected formValue() {
    return this.selected ? this.value : null;
  }

  protected formReset() {
    this.selected = this.hasAttribute('selected');
    this.indeterminate = this.hasAttribute('indeterminate');
    this.touched = false;
    this.nativeMessage = '';
  }

  protected formStateRestore(state: string | File | FormData | null) {
    this.selected = state !== null;
    this.indeterminate = false;
  }

  #readNativeMessage() {
    this.nativeMessage = this.input?.validationMessage ?? '';
  }

  #handleInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.selected = input.checked;
    this.indeterminate = false;
    this.syncFormState();
    if (this.touched) this.#readNativeMessage();
  };

  #handleKeydown = (event: KeyboardEvent) => {
    this.syncFocusVisible(event);
    this.implicitSubmit(event);
  };

  #handleBlur = () => {
    this.handleBlur();
    this.touched = true;
    this.#readNativeMessage();
  };

  protected override syncFormState() {
    super.syncFormState();
    if (this.errorMessage) this.internals.setValidity({ customError: true }, this.errorMessage, this.input ?? undefined);
  }

  protected override updated(changed: Map<PropertyKey, unknown>) {
    super.updated(changed);
    if (this.touched && changed.has('selected')) this.#readNativeMessage();
  }

  private get shownError() {
    return this.errorMessage || (this.touched ? this.nativeMessage : '');
  }

  protected override render() {
    const error = this.shownError;
    const describedBy = [this.description ? 'description' : '', error ? 'error' : ''].filter(Boolean).join(' ');
    return html`<div part="field">
      <span part="control">
        <input
          id="input"
          part="input"
          type="checkbox"
          .checked=${live(this.selected)}
          .indeterminate=${live(this.indeterminate)}
          ?required=${this.required}
          ?disabled=${this.isDisabled}
          aria-invalid=${error ? 'true' : nothing}
          aria-describedby=${describedBy || nothing}
          @input=${this.#handleInput}
          @change=${this.handleChange}
          @focus=${this.syncFocusVisible}
          @keydown=${this.#handleKeydown}
          @blur=${this.#handleBlur}
        />
        <svg data-icon="check" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5 6.75 11 12 5" /></svg>
        <svg data-icon="indeterminate" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 8h7" /></svg>
      </span>
      <label part="label" for="input"
        >${this.label}${this.required ? html`<span part="required-indicator" aria-hidden="true"> *</span>` : nothing}</label
      >
      ${this.description ? html`<p id="description" part="description">${this.description}</p>` : nothing}
      <p id="error" part="error" aria-live="polite">${error}</p>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCheckbox;
  }
}
