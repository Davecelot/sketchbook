import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

import { FormAssociated } from '../../mixins/form-associated';
import { NativeControl } from '../../mixins/native-control';
import { inputStyles } from './Input.styles';

const TAG = 'sb-input';

export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';

/**
 * A single-line text field with its label, description and error in one shadow
 * root, because an external <label for> can't reach an input inside a shadow root.
 */
export class SbInput extends NativeControl(FormAssociated(LitElement)) {
  static override styles = inputStyles;

  @property({ type: Boolean, reflect: true, attribute: 'hide-label' }) hideLabel = false;

  @property({ attribute: 'error-message' }) errorMessage = '';

  // A wrapper (sb-input-group) marks the field invalid with aria-invalid on the host; the inner control carries it.
  static override get observedAttributes() {
    return [...super.observedAttributes, 'aria-invalid'];
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (name === 'aria-invalid') this.requestUpdate();
  }

  @property() type: InputType = 'text';

  @property() value = '';

  @property() placeholder = '';

  @property() autocomplete = '';

  @property({ type: Boolean, reflect: true }) readOnly = false;

  @property({ type: Number }) minlength?: number;

  @property({ type: Number }) maxlength?: number;

  @property() pattern = '';

  // Native validity is shown only after the person leaves the field or tries to submit.
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
    return this.value;
  }

  protected formReset() {
    this.value = this.getAttribute('value') ?? '';
    this.touched = false;
    this.nativeMessage = '';
  }

  protected formStateRestore(state: string | File | FormData | null) {
    this.value = typeof state === 'string' ? state : '';
  }

  #readNativeMessage() {
    this.nativeMessage = this.input?.validationMessage ?? '';
  }

  #handleInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
    this.syncFormState();
    if (this.touched) this.#readNativeMessage();
  };

  // The inner input has no form owner (it sits in a shadow root), so implicit submission is done here.
  #handleKeydown = (event: KeyboardEvent) => {
    this.syncFocusVisible(event);
    this.implicitSubmit(event);
  };

  // A message in `errorMessage` is a custom validity error, so the form blocks submission like the native case.
  protected override syncFormState() {
    super.syncFormState();
    if (this.errorMessage) this.internals.setValidity({ customError: true }, this.errorMessage, this.input ?? undefined);
  }

  #handleBlur = () => {
    this.handleBlur();
    this.touched = true;
    this.#readNativeMessage();
  };

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.touched && changed.has('value')) this.#readNativeMessage();
  }

  private get shownError() {
    return this.errorMessage || (this.touched ? this.nativeMessage : '');
  }

  protected override render() {
    const error = this.shownError;
    const describedBy = [this.description ? 'description' : '', error ? 'error' : ''].filter(Boolean).join(' ');
    return html`<div part="field">
      <label part="label" for="input"
        >${this.label}${this.required ? html`<span part="required-indicator" aria-hidden="true"> *</span>` : nothing}</label
      >
      <input
        id="input"
        part="input"
        type=${this.type}
        name=${ifDefined(this.name || undefined)}
        .value=${live(this.value)}
        placeholder=${ifDefined(this.placeholder || undefined)}
        autocomplete=${ifDefined((this.autocomplete || undefined) as never)}
        minlength=${ifDefined(this.minlength)}
        maxlength=${ifDefined(this.maxlength)}
        pattern=${ifDefined(this.pattern || undefined)}
        ?required=${this.required}
        ?readonly=${this.readOnly}
        ?disabled=${this.isDisabled}
        aria-invalid=${error || this.getAttribute('aria-invalid') === 'true' ? 'true' : nothing}
        aria-describedby=${describedBy || nothing}
        @input=${this.#handleInput}
        @change=${this.handleChange}
        @focus=${this.syncFocusVisible}
        @keydown=${this.#handleKeydown}
        @blur=${this.#handleBlur}
      />
      ${this.description ? html`<p id="description" part="description">${this.description}</p>` : nothing}
      <p id="error" part="error" aria-live="polite">${error}</p>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbInput);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbInput;
  }
}
