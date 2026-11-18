import { html, LitElement } from 'lit';

import { commandStyles } from './Command.styles';

const TAG = 'sb-command-separator';

/** A line between command groups. */
export class SbCommandSeparator extends LitElement {
  static override styles = commandStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'none');
  }

  protected override render() {
    return html`<div part="separator"></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommandSeparator);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommandSeparator;
  }
}
