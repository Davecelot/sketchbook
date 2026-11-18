import { html, LitElement } from 'lit';

import { tableStyles } from './Table.styles';

const TAG = 'sb-table-head';

/** A column header cell. */
export class SbTableHead extends LitElement {
  static override styles = tableStyles;

  protected override willUpdate() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'columnheader');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTableHead);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTableHead;
  }
}
