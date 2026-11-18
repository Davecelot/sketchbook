import { html, LitElement } from 'lit';

import { breadcrumbStyles } from './Breadcrumb.styles';

const TAG = 'sb-breadcrumb-item';

export class SbBreadcrumbItem extends LitElement {
  static override styles = breadcrumbStyles;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listitem');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBreadcrumbItem);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBreadcrumbItem;
  }
}
