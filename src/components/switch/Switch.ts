import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

import { FormAssociated } from '../../mixins/form-associated';
import { NativeControl } from '../../mixins/native-control';
import { switchStyles } from './Switch.styles';

const TAG = 'sb-switch';

export class SbSwitch extends NativeControl(FormAssociated(LitElement)) {
  static override styles = switchStyles;

  @property({ type: Boolean, reflect: true, attribute: 'hide-label' }) hideLabel = false;

  @property({ attribute: 'error-message' }) errorMessage = '';

  @property({ reflect: true }) value = 'on';

  @property({ reflect: true }) size: 'medium' | 'small' = 'medium';

  @property({ type: Boolean }) selected = false;

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
    this.touched = false;
    this.nativeMessage = '';
  }

  protected formStateRestore(state: string | File | FormData | null) {
    this.selected = state !== null;
  }

  #readNativeMessage() {
    this.nativeMessage = this.input?.validationMessage ?? '';
  }

  #handleInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.selected = input.checked;
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
    /* eslint-disable lit-a11y/role-has-required-aria-attrs -- the native checkbox supplies the switch's checked state; ARIA in HTML forbids aria-checked on it. */
    return html`<div part="field">
      <span part="control">
        <input
          id="input"
          part="input"
          type="checkbox"
          .checked=${live(this.selected)}
          role="switch"
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
        <span part="thumb" aria-hidden="true"></span>
      </span>
      <label part="label" for="input"
        >${this.label}${this.required ? html`<span part="required-indicator" aria-hidden="true"> *</span>` : nothing}</label
      >
      ${this.description ? html`<p id="description" part="description">${this.description}</p>` : nothing}
      <p id="error" part="error" aria-live="polite">${error}</p>
    </div>`;
    /* eslint-enable lit-a11y/role-has-required-aria-attrs */
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSwitch);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSwitch;
  }
}
