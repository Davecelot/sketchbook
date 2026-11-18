import { html, LitElement } from 'lit';

import { tableStyles } from './Table.styles';

const TAG = 'sb-table-body';

/** The body row group. */
export class SbTableBody extends LitElement {
  static override styles = tableStyles;

  protected override willUpdate() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'rowgroup');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTableBody);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTableBody;
  }
}
