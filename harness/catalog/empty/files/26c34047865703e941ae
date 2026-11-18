import { html, LitElement } from 'lit';

import { emptyStyles } from './Empty.styles';

const TAG = 'sb-empty';

export class SbEmpty extends LitElement {
  static override styles = emptyStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbEmpty);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbEmpty;
  }
}
