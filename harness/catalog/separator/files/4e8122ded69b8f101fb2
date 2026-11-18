import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { separatorStyles } from './Separator.styles';

const TAG = 'sb-separator';

export type SeparatorOrientation = 'horizontal' | 'vertical';

/** A line that separates content; decorative unless decorative="false". */
export class SbSeparator extends LitElement {
  static override styles = separatorStyles;

  @property({ reflect: true }) orientation: SeparatorOrientation = 'horizontal';

  // An attribute can't default to true, so the string "false" turns decoration off.
  @property({ reflect: true, converter: { fromAttribute: (value) => value !== 'false', toAttribute: (value) => String(value) } })
  decorative = true;

  // Semantics are set before the first render so the role is never wrong, even briefly.
  protected override willUpdate() {
    if (this.decorative) {
      this.setAttribute('role', 'none');
      this.removeAttribute('aria-orientation');
    } else {
      this.setAttribute('role', 'separator');
      if (this.orientation === 'vertical') this.setAttribute('aria-orientation', 'vertical');
      else this.removeAttribute('aria-orientation');
    }
  }

  protected override render() {
    return html`<div part="line"></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSeparator);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSeparator;
  }
}
