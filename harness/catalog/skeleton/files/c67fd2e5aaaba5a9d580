import { html, LitElement } from 'lit';

import { skeletonStyles } from './Skeleton.styles';

const TAG = 'sb-skeleton';

/** A pulsing placeholder for content that is loading; hidden from assistive technology. */
export class SbSkeleton extends LitElement {
  static override styles = skeletonStyles;

  // Set on connection, before any render, so the placeholder is never exposed.
  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute('aria-hidden', 'true');
  }

  protected override render() {
    return html`<div part="block"></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSkeleton;
  }
}
