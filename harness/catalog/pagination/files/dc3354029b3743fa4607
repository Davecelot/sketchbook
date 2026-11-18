import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { paginationStyles } from './Pagination.styles';

const TAG = 'sb-pagination-ellipsis';

/** A gap standing for skipped pages. */
export class SbPaginationEllipsis extends LitElement {
  static override styles = paginationStyles;

  @property() label = 'More pages';

  protected override willUpdate() {
    this.setAttribute('aria-hidden', 'true');
  }

  protected override render() {
    return html`<span part="icon"
        ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" /></svg></span
      ><span part="text">${this.label}</span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbPaginationEllipsis);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbPaginationEllipsis;
  }
}
