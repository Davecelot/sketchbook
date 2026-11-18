import { html, LitElement } from 'lit';

import { emptyStyles } from './Empty.styles';

const TAG = 'sb-empty-header';

export class SbEmptyHeader extends LitElement {
  static override styles = emptyStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbEmptyHeader);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbEmptyHeader;
  }
}
