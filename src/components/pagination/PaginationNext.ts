import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import { safeHref } from '../../utils/safe-href';
import { paginationStyles } from './Pagination.styles';

const TAG = 'sb-pagination-next';

/** Link to the next page, with a chevron and text. */
export class SbPaginationNext extends LitElement {
  static override styles = paginationStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property() href: string | null = null;

  // Empty: slotted text names the link; with no text the link is named "Go to next page".
  @property() label = '';

  @state() private hasText = false;

  // The visible text must be inside the accessible name (WCAG 2.5.3), so only an explicit label overrides it.
  #syncText = (event: Event) => {
    this.hasText = (event.target as HTMLSlotElement).assignedNodes().some((node) => !!node.textContent?.trim());
  };

  get #name() {
    return this.label || (this.hasText ? null : 'Go to next page');
  }

  protected override render() {
    return html`<a part="link" href=${safeHref(this.href)} aria-label=${this.#name ?? nothing}><span part="text"><slot @slotchange=${this.#syncText}>Next</slot></span><span part="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg></span></a>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbPaginationNext);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbPaginationNext;
  }
}
