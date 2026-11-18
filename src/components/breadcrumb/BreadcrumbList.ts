import { html, LitElement } from 'lit';

import { breadcrumbStyles } from './Breadcrumb.styles';

const TAG = 'sb-breadcrumb-list';

export class SbBreadcrumbList extends LitElement {
  static override styles = breadcrumbStyles;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'list');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBreadcrumbList);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBreadcrumbList;
  }
}
