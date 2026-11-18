import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { breadcrumbStyles } from './Breadcrumb.styles';

const TAG = 'sb-breadcrumb';

export class SbBreadcrumb extends LitElement {
  static override styles = breadcrumbStyles;

  @property() label = 'Breadcrumb';

  protected override render() {
    return html`<nav part="nav" aria-label=${this.label}><slot></slot></nav>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBreadcrumb);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBreadcrumb;
  }
}
