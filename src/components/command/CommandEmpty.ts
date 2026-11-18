import { html, LitElement } from 'lit';

import { commandStyles } from './Command.styles';

const TAG = 'sb-command-empty';

/** Text shown while nothing matches the search. */
export class SbCommandEmpty extends LitElement {
  static override styles = commandStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'none');
    // Text inside a listbox that owns no option breaks the listbox; the status region announces it instead.
    this.setAttribute('aria-hidden', 'true');
  }

  protected override render() {
    return html`<div part="empty"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommandEmpty);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommandEmpty;
  }
}
