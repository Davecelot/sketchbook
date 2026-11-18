import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { emptyStyles } from './Empty.styles';

const TAG = 'sb-empty-media';

export type EmptyMediaVariant = 'primary' | 'icon';

export class SbEmptyMedia extends LitElement {
  static override styles = emptyStyles;

  @property({ reflect: true }) variant: EmptyMediaVariant = 'primary';

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbEmptyMedia);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbEmptyMedia;
  }
}
