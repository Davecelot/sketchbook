import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { safeHref } from '../../utils/safe-href';
import { paginationStyles } from './Pagination.styles';

const TAG = 'sb-pagination-link';

// Only aria-label is forwarded: ID references don't resolve across shadow roots (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

/** A link to one page. */
export class SbPaginationLink extends LitElement {
  static override styles = paginationStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property() href: string | null = null;

  @property({ type: Boolean, reflect: true }) active = false;

  @property({ reflect: true }) size: 'icon' | 'medium' = 'icon';

  #warnedNoHref = false;

  // Without href the inner anchor is not a link: not focusable, no link role. Checked a frame later so an
  // href set right after creation still counts.
  protected override firstUpdated() {
    requestAnimationFrame(() => {
      if (this.#warnedNoHref || this.href) return;
      this.#warnedNoHref = true;
      console.warn(`<${this.localName}> has no href, so it is not a link. Set href.`);
    });
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  protected override render() {
    return html`<a
      part="link"
      href=${safeHref(this.href)}
      aria-current=${this.active ? 'page' : nothing}
      aria-label=${this.getAttribute('aria-label') ?? nothing}
      ><slot></slot
    ></a>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbPaginationLink);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbPaginationLink;
  }
}
