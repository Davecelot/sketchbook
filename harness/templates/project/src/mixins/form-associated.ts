import type { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS requires a mixin's base constructor to take a rest any[] (TS2545).
type MixinArgs = any[];

type Constructor<T> = new (...args: MixinArgs) => T;

type ValidationAnchor = HTMLElement & { readonly validity: ValidityState; readonly validationMessage: string };

export declare abstract class FormAssociatedElement {
  static readonly formAssociated: true;
  name: string;
  disabled: boolean;
  required: boolean;
  get form(): HTMLFormElement | null;
  get validity(): ValidityState;
  get validationMessage(): string;
  get willValidate(): boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  formDisabledCallback(disabled: boolean): void;
  protected readonly internals: ElementInternals;
  protected get isDisabled(): boolean;
  protected syncFormState(): void;
  protected abstract formValue(): string | null;
  protected abstract formReset(): void;
  protected abstract formStateRestore(state: string | File | FormData | null): void;
  protected abstract validationAnchor(): ValidationAnchor | null | undefined;
}

export const FormAssociated = <T extends Constructor<LitElement>>(superClass: T) => {
  abstract class FormAssociatedMixin extends superClass {
    static readonly formAssociated = true;

    @property({ reflect: true }) name = '';

    @property({ type: Boolean, reflect: true }) disabled = false;

    @property({ type: Boolean, reflect: true }) required = false;

    // Separate from `disabled`: a <fieldset disabled> must not overwrite the
    // author's attribute, or re-enabling the fieldset would leave it disabled.
    @state() private formDisabled = false;

    protected readonly internals = this.attachInternals();

    get form() {
      return this.internals.form;
    }

    get validity() {
      return this.internals.validity;
    }

    get validationMessage() {
      return this.internals.validationMessage;
    }

    get willValidate() {
      return this.internals.willValidate;
    }

    checkValidity() {
      return this.internals.checkValidity();
    }

    reportValidity() {
      return this.internals.reportValidity();
    }

    protected get isDisabled() {
      return this.disabled || this.formDisabled;
    }

    protected abstract formValue(): string | null;
    protected abstract formReset(): void;
    protected abstract formStateRestore(state: string | File | FormData | null): void;
    protected abstract validationAnchor(): ValidationAnchor | null | undefined;

    // The browser also calls this for the host's own `disabled` attribute, so
    // when Lit reflects it, the call lands inside update(): after render() and
    // before the changed properties are cleared, which drops this change.
    formDisabledCallback(disabled: boolean) {
      const midUpdate = this.isUpdatePending;
      this.formDisabled = disabled;
      if (midUpdate) void this.updateComplete.then(() => this.requestUpdate());
    }

    // Rendered now, not on the next microtask: validity mirrors the inner native control, so FormData and
    // validity read right after reset() are only current once it has been updated (updated() then syncs).
    formResetCallback() {
      this.formReset();
      this.performUpdate();
    }

    formStateRestoreCallback(state: string | File | FormData | null) {
      this.formStateRestore(state);
      this.performUpdate();
    }

    protected override updated(changed: Map<PropertyKey, unknown>) {
      super.updated(changed);
      this.syncFormState();
    }

    // The anchor's native validity carries the browser's localized message;
    // an empty message means it's valid or barred from validation.
    protected syncFormState() {
      this.internals.setFormValue(this.formValue());
      const anchor = this.validationAnchor();
      if (anchor?.validationMessage) this.internals.setValidity(anchor.validity, anchor.validationMessage, anchor);
      else this.internals.setValidity({});
    }
  }
  return FormAssociatedMixin as unknown as (abstract new (...args: MixinArgs) => FormAssociatedElement) & T;
};
