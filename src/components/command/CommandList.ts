import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';

import { commandStyles } from './Command.styles';
import { commandContext } from './context';

const TAG = 'sb-command-list';

/** The listbox of a command. */
export class SbCommandList extends LitElement {
  static override styles = commandStyles;

  readonly #command = new ContextConsumer(this, { context: commandContext, subscribe: true });

  protected override willUpdate() {
    this.setAttribute('role', 'listbox');
    const label = this.#command.value?.label;
    if (label) this.setAttribute('aria-label', label);
    else this.removeAttribute('aria-label');
  }

  protected override render() {
    return html`<div part="list"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommandList);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommandList;
  }
}
