import type { FormAssociatedElement } from './form-associated';
import type { TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS requires a mixin's base constructor to take a rest any[] (TS2545).
type MixinArgs = any[];

type Constructor<T> = abstract new (...args: MixinArgs) => T;

// The inner control sits in a shadow root with no form owner, so Enter never submits natively (SB-0009 item 1).
export const submitOnEnter = (event: KeyboardEvent, form: HTMLFormElement | null, disabled: boolean) => {
  if (event.key === 'Enter' && !event.isComposing && !event.defaultPrevented && !disabled) form?.requestSubmit();
};

export declare abstract class NativeControlElement {
  label: string;
  description: string;
  click(): void;
  protected get input(): HTMLInputElement | null | undefined;
  protected get describedBy(): string | typeof nothing;
  protected readonly syncFocusVisible: (event: Event) => void;
  protected readonly handleBlur: () => void;
  protected readonly implicitSubmit: (event: KeyboardEvent) => void;
  protected readonly handleChange: () => void;
  protected renderDescription(): TemplateResult | typeof nothing;
  protected validationAnchor(): HTMLInputElement | null | undefined;
}

export const NativeControl = <T extends Constructor<LitElement & FormAssociatedElement>>(superClass: T) => {
  abstract class NativeControlMixin extends superClass {
    static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    @property({ reflect: true }) label = '';

    @property({ reflect: true }) description = '';

    #warnedNoName = false;

    constructor(...args: MixinArgs) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- the mixin constructor must forward a rest any[] (TS2545).
      super(...args);
      this.addEventListener('click', this.#handleLabelActivation);
    }

    protected override updated(changed: Map<PropertyKey, unknown>) {
      super.updated(changed);
      if (!this.#warnedNoName && !this.label?.trim()) {
        this.#warnedNoName = true;
        console.warn(`<${this.localName}> has no accessible name. Pass label="…".`);
      }
    }

    override click() {
      if (!this.isDisabled) this.input?.click();
    }

    protected get input() {
      return this.shadowRoot?.querySelector('input');
    }

    // A <label for> pointing at the host clicks the host itself, not the input.
    #handleLabelActivation = (event: MouseEvent) => {
      if (event.composedPath()[0] === this) this.click();
    };

    protected validationAnchor() {
      return this.input;
    }

    protected get describedBy() {
      return this.description ? `${this.localName}-description` : nothing;
    }

    protected renderDescription() {
      return this.description
        ? html`<span id="${this.localName}-description" hidden>${this.description}</span>`
        : nothing;
    }

    // :focus-visible doesn't match a shadow host, so keyboard focus is exposed
    // as :state(focus-visible) for composing components (an option's ring).
    // Re-checked on keydown: a mouse-focused input turns focus-visible once the
    // keyboard is used, without a new focus event. `states` is missing before
    // Safari 17.4 / Firefox 126; Chromium 90–124 has it but throws on a
    // non-dashed name. Either way only this state is lost, not the control.
    protected readonly syncFocusVisible = (event: Event) => {
      try {
        if ((event.target as HTMLInputElement).matches(':focus-visible')) this.internals.states?.add('focus-visible');
      } catch {
        /* older engines reject non-dashed state names; only the state is lost */
      }
    };

    protected readonly implicitSubmit = (event: KeyboardEvent) => submitOnEnter(event, this.form, this.isDisabled);

    protected readonly handleBlur = () => {
      try {
        this.internals.states?.delete('focus-visible');
      } catch {
        /* see syncFocusVisible */
      }
    };

    // The native change isn't composed, so it never reaches a listener on the host.
    protected readonly handleChange = () => {
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    };
  }
  return NativeControlMixin as unknown as (abstract new (...args: MixinArgs) => NativeControlElement) & T;
};
