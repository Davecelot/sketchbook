import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

import { FormAssociated } from '../../mixins/form-associated';
import { NativeControl } from '../../mixins/native-control';
import { textareaStyles } from './Textarea.styles';

const TAG = 'sb-textarea';

export class SbTextarea extends NativeControl(FormAssociated(LitElement)) {
  static override styles = textareaStyles;

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

  @property() value = '';

  @property() placeholder = '';

  @property() autocomplete = '';

  @property({ type: Boolean, reflect: true }) readOnly = false;

  @property({ type: Number }) minlength?: number;

  @property({ type: Number }) maxlength?: number;

  @state() private touched = false;

  @state() private nativeMessage = '';

  constructor() {
    super();
    this.addEventListener('invalid', () => {
      this.touched = true;
      this.#readNativeMessage();
    });
  }

  private get textarea() {
    return this.shadowRoot?.querySelector('textarea');
  }

  override click() {
    if (!this.isDisabled) this.textarea?.focus();
  }

  protected override validationAnchor() {
    return this.textarea as unknown as HTMLInputElement | null | undefined;
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
    this.nativeMessage = this.textarea?.validationMessage ?? '';
  }

  #handleInput = (event: Event) => {
    this.value = (event.target as HTMLTextAreaElement).value;
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
    if (this.errorMessage) this.internals.setValidity({ customError: true }, this.errorMessage, this.textarea ?? undefined);
  }

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
      <label part="label" for="textarea"
        >${this.label}${this.required ? html`<span part="required-indicator" aria-hidden="true"> *</span>` : nothing}</label
      >
      <textarea
        id="textarea"
        part="textarea"
        name=${ifDefined(this.name || undefined)}
        .value=${live(this.value)}
        placeholder=${ifDefined(this.placeholder || undefined)}
        autocomplete=${ifDefined((this.autocomplete || undefined) as never)}
        minlength=${ifDefined(this.minlength)}
        maxlength=${ifDefined(this.maxlength)}
        ?required=${this.required}
        ?readonly=${this.readOnly}
        ?disabled=${this.isDisabled}
        aria-invalid=${error || this.getAttribute('aria-invalid') === 'true' ? 'true' : nothing}
        aria-describedby=${describedBy || nothing}
        @input=${this.#handleInput}
        @change=${this.handleChange}
        @focus=${this.syncFocusVisible}
        @keydown=${this.syncFocusVisible}
        @blur=${this.#handleBlur}
      ></textarea>
      ${this.description ? html`<p id="description" part="description">${this.description}</p>` : nothing}
      <p id="error" part="error" aria-live="polite">${error}</p>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTextarea);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTextarea;
  }
}
