import { ContextConsumer } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

import { commandStyles } from './Command.styles';
import { commandContext } from './context';

const TAG = 'sb-command-input';
let reflectionWarned = false;

/** The search field of a command. */
export class SbCommandInput extends LitElement {
  static override styles = commandStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property() placeholder = '';

  @property() value = '';

  readonly #command = new ContextConsumer(this, { context: commandContext, subscribe: true });

  protected override firstUpdated() {
    if (reflectionWarned || 'ariaActiveDescendantElement' in Element.prototype) return;
    reflectionWarned = true;
    console.warn(`<${TAG}> this browser has no ARIA element reflection, so assistive technology cannot follow the active option.`);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('value')) this.#command.value?.search(this.value);
  }

  // Element references resolve from this shadow root to the light DOM above it; ID references would not (SB-0009).
  protected override updated() {
    const input = this.shadowRoot?.querySelector('input');
    const command = this.#command.value;
    if (!input || !command) return;
    input.ariaControlsElements = command.list ? [command.list] : null;
    input.ariaActiveDescendantElement = command.active;
  }

  #onInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
  };

  protected override render() {
    const label = this.#command.value?.label;
    const idle = !this.#command.value?.active;
    /* eslint-disable lit-a11y/role-has-required-aria-attrs -- aria-controls is set as an element reference in updated(); an ID can't reach the list (SB-0009). */
    return html`<div part="input-row" class=${idle ? 'idle' : nothing}>
      <svg part="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        part="input"
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
        aria-label=${label || nothing}
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        placeholder=${this.placeholder || nothing}
        .value=${live(this.value)}
        @input=${this.#onInput}
      />
    </div>`;
    /* eslint-enable lit-a11y/role-has-required-aria-attrs */
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommandInput);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommandInput;
  }
}
