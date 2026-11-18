import { html, LitElement, svg } from 'lit';
import { property } from 'lit/decorators.js';

import { breadcrumbStyles } from './Breadcrumb.styles';

const TAG = 'sb-breadcrumb-ellipsis';

// Lucide "ellipsis" (ISC license, see THIRD_PARTY_NOTICES.md).
const dots = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>`;

export class SbBreadcrumbEllipsis extends LitElement {
  static override styles = breadcrumbStyles;

  @property() label = 'More';

  protected override render() {
    return html`<span part="icon" aria-hidden="true">${dots}</span><span part="label">${this.label}</span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBreadcrumbEllipsis);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBreadcrumbEllipsis;
  }
}
