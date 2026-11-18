import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { safeHref } from '../../utils/safe-href';
import { badgeStyles } from './Badge.styles';

const TAG = 'sb-badge';

export type BadgeVariant = 'primary' | 'secondary' | 'destructive' | 'tertiary' | 'ghost' | 'link';

/** A small pill that labels or counts something; a native link when href is set. */
export class SbBadge extends LitElement {
  static override styles = badgeStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property({ reflect: true }) variant: BadgeVariant = 'primary';

  @property() href: string | null = null;

  override click() {
    this.shadowRoot?.querySelector<HTMLElement>('a[part="badge"]')?.click();
  }

  protected override render() {
    return this.href !== null
      ? html`<a part="badge" href=${safeHref(this.href)}><slot></slot></a>`
      : html`<span part="badge"><slot></slot></span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbBadge);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbBadge;
  }
}
