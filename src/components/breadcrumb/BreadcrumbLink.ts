import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { safeHref } from '../../utils/safe-href';
import { breadcrumbStyles } from './Breadcrumb.styles';

const TAG = 'sb-breadcrumb-link';

export class SbBreadcrumbLink extends LitElement {
  static override styles = breadcrumbStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property() href: string | null = null;

  protected override render() {
    return html`<a part="link" href=${safeHref(this.href)}><slot></slot></a>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBreadcrumbLink);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBreadcrumbLink;
  }
}
