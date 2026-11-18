import { html, LitElement } from 'lit';

import { breadcrumbStyles } from './Breadcrumb.styles';

const TAG = 'sb-breadcrumb-page';

export class SbBreadcrumbPage extends LitElement {
  static override styles = breadcrumbStyles;

  protected override render() {
    return html`<span part="page" role="link" aria-disabled="true" aria-current="page"><slot></slot></span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBreadcrumbPage);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBreadcrumbPage;
  }
}
