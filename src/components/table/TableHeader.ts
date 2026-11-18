import { html, LitElement } from 'lit';

import { tableStyles } from './Table.styles';

const TAG = 'sb-table-header';

/** The header row group. */
export class SbTableHeader extends LitElement {
  static override styles = tableStyles;

  protected override willUpdate() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'rowgroup');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTableHeader);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTableHeader;
  }
}
