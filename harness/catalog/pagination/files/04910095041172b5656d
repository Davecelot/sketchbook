import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { paginationStyles } from './Pagination.styles';

const TAG = 'sb-pagination';

/** A navigation landmark for moving between pages. */
export class SbPagination extends LitElement {
  static override styles = paginationStyles;

  @property() label = 'pagination';

  protected override render() {
    return html`<nav part="nav" aria-label=${this.label}><slot></slot></nav>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbPagination);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbPagination;
  }
}
