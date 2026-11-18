import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { scrollAreaStyles } from './ScrollArea.styles';

const TAG = 'sb-scroll-bar';

/** Names an axis the scroll area scrolls on. The scrollbar itself is native. */
export class SbScrollBar extends LitElement {
  static override styles = scrollAreaStyles;

  @property({ reflect: true }) orientation: 'vertical' | 'horizontal' = 'vertical';
}

if (!customElements.get(TAG)) customElements.define(TAG, SbScrollBar);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbScrollBar;
  }
}
