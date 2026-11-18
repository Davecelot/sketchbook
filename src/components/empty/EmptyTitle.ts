import { html, LitElement } from 'lit';

import { emptyStyles } from './Empty.styles';

const TAG = 'sb-empty-title';

export class SbEmptyTitle extends LitElement {
  static override styles = emptyStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbEmptyTitle);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbEmptyTitle;
  }
}
