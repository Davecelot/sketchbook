import { html, LitElement } from 'lit';

import { kbdStyles } from './Kbd.styles';

const TAG = 'sb-kbd-group';

/** Groups keys into one combination. */
export class SbKbdGroup extends LitElement {
  static override styles = kbdStyles;

  protected override render() {
    return html`<kbd part="group"><slot></slot></kbd>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbKbdGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbKbdGroup;
  }
}
