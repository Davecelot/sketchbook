import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import '../spinner/Spinner';
import { safeHref } from '../../utils/safe-href';
import { buttonStyles } from './Button.styles';

const TAG = 'sb-button';

// Only aria-label is forwarded: ID references (aria-labelledby, aria-describedby) don't resolve across
// shadow roots, so forwarding them would silently do nothing (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

// Input types that take part in implicit submission (HTML: "fields that block implicit submission").
const IMPLICIT_SUBMIT_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'date', 'month', 'week', 'time', 'datetime-local', 'number']);

export type ButtonVariant = 'primary' | 'destructive' | 'tertiary' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'medium' | 'tiny' | 'small' | 'large' | 'icon' | 'icon-tiny' | 'icon-small' | 'icon-large';

/** Displays a button, or a link that looks like a button. */
export class SbButton extends LitElement {
  static formAssociated = true;
  static override styles = buttonStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property({ reflect: true }) variant: ButtonVariant = 'primary';

  @property({ reflect: true }) size: ButtonSize = 'medium';

  @property() type: 'button' | 'submit' | 'reset' = 'button';

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) loading = false;

  @property({ reflect: true }) name: string | null = null;

  @property() value: string | null = null;

  @property() href: string | null = null;

  // A <fieldset disabled> must not overwrite the author's disabled attribute.
  @state() private formDisabled = false;

  @state() private hasIcon = false;

  readonly #internals = this.attachInternals();

  #warnedNoName = false;

  constructor() {
    super();
    // Blocks clicks aimed at the host itself (host.click(), dispatched events) while inactive.
    this.addEventListener('click', (event) => { if (this.isBusy || this.isDisabled) event.stopImmediatePropagation(); }, { capture: true });
  }

  /** Activates the inner control, so host.click() submits like a native button. */
  override click() {
    if (this.isBusy || this.isDisabled) return;
    this.shadowRoot?.querySelector<HTMLElement>('[part="button"]')?.click();
  }

  get form() {
    return this.#internals.form;
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  #watchedForm: HTMLFormElement | null = null;

  formAssociatedCallback(form: HTMLFormElement | null) {
    this.#watchedForm?.removeEventListener('keydown', this.#implicitSubmit);
    this.#watchedForm = form;
    form?.addEventListener('keydown', this.#implicitSubmit);
  }

  // A custom element is never the form's default button, so Enter in a native text field would not submit
  // when the form has two such fields. The first submit sb-button takes it over (and blocks the native
  // single-field submit, so it never runs twice). Our own fields submit on Enter themselves.
  #implicitSubmit = (event: KeyboardEvent) => {
    const field = event.composedPath()[0];
    const form = this.#watchedForm;
    if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented || !form || this.type !== 'submit' || this.href !== null) return;
    if (!(field instanceof HTMLInputElement) || field !== event.target || !IMPLICIT_SUBMIT_TYPES.has(field.type)) return;
    const controls = [...form.elements];
    if (controls.some((el) => (el instanceof HTMLButtonElement && el.type === 'submit') || (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'image')))) return;
    if (controls.find((el) => el instanceof SbButton && el.type === 'submit') !== this) return;
    event.preventDefault();
    if (!this.isBusy && !this.isDisabled) this.#submit(form);
  };

  #submit(form: HTMLFormElement) {
    if (this.name) this.#internals.setFormValue(this.value ?? '');
    form.requestSubmit();
    this.#internals.setFormValue(null);
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  // Disabled wins over loading (contract).
  private get isBusy() {
    return this.loading && !this.isDisabled;
  }

  // Cancels activation while loading or disabled; otherwise submits or resets the owning form.
  // The value is set only for the submit that this button triggers, like a native submitter.
  #handleClick = (event: MouseEvent) => {
    if (this.isBusy || this.isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const form = this.#internals.form;
    if (this.href !== null || !form) return;
    if (this.type === 'submit') {
      this.#submit(form);
    } else if (this.type === 'reset') {
      form.reset();
    }
  };

  #syncIcon = () => {
    const slots = [...(this.shadowRoot?.querySelectorAll<HTMLSlotElement>('slot[name$="-icon"]') ?? [])];
    this.hasIcon = slots.some((slot) => slot.assignedElements().length > 0);
  };

  #warnIfNameless = () => {
    if (this.#warnedNoName || this.textContent?.trim() || this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby')) return;
    this.#warnedNoName = true;
    console.warn(`<${TAG}> has no accessible name. Add text, or aria-label for icon sizes.`);
  };

  protected override firstUpdated() {
    requestAnimationFrame(this.#warnIfNameless);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.toggleAttribute('data-has-icon', this.hasIcon || this.isBusy);
  }

  protected override render() {
    const aria = (name: string) => this.getAttribute(name) ?? nothing;
    const content = html`${this.isBusy
        ? html`<sb-spinner part="spinner" decorative></sb-spinner>`
        : html`<span part="leading-icon"><slot name="leading-icon" @slotchange=${this.#syncIcon}></slot></span>`}<span part="label"
        ><slot></slot></span
      ><span part="trailing-icon"><slot name="trailing-icon" @slotchange=${this.#syncIcon}></slot></span>`;

    if (this.href !== null) {
      // A disabled link keeps its link role (role="link" without href) and says it is disabled.
      return html`<a
        part="button"
        href=${this.isDisabled ? nothing : safeHref(this.href)}
        role=${this.isDisabled ? 'link' : nothing}
        aria-disabled=${this.isDisabled || this.isBusy ? 'true' : nothing}
        aria-busy=${this.isBusy ? 'true' : nothing}
        aria-label=${aria('aria-label')}
        @click=${this.#handleClick}
        >${content}</a
      >`;
    }
    return html`<button
      part="button"
      type="button"
      ?disabled=${this.isDisabled}
      aria-disabled=${this.isBusy ? 'true' : nothing}
      aria-busy=${this.isBusy ? 'true' : nothing}
      aria-label=${aria('aria-label')}
      @click=${this.#handleClick}
    >
      ${content}
    </button>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbButton);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbButton;
  }
}
