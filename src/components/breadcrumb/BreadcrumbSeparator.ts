import { html, LitElement, svg } from 'lit';

import { breadcrumbStyles } from './Breadcrumb.styles';

const TAG = 'sb-breadcrumb-separator';

// Lucide "chevron-right" (ISC license, see THIRD_PARTY_NOTICES.md).
const chevron = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>`;

export class SbBreadcrumbSeparator extends LitElement {
  static override styles = breadcrumbStyles;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
    this.setAttribute('aria-hidden', 'true');
  }

  protected override render() {
    return html`<slot>${chevron}</slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBreadcrumbSeparator);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBreadcrumbSeparator;
  }
}
