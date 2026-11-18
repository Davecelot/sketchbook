import { html, LitElement } from 'lit';

import { emptyStyles } from './Empty.styles';

const TAG = 'sb-empty-content';

export class SbEmptyContent extends LitElement {
  static override styles = emptyStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbEmptyContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbEmptyContent;
  }
}
