import { html, LitElement } from 'lit';

import { kbdStyles } from './Kbd.styles';

const TAG = 'sb-kbd';

/** Displays a keyboard key. */
export class SbKbd extends LitElement {
  static override styles = kbdStyles;

  protected override render() {
    return html`<kbd part="key"><slot></slot></kbd>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbKbd);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbKbd;
  }
}
