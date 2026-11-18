import { html, LitElement } from 'lit';

import { inputGroupStyles } from './InputGroup.styles';

const TAG = 'sb-input-group-text';

export class SbInputGroupText extends LitElement {
  static override styles = inputGroupStyles;

  protected override render() {
    return html`<span part="text"><slot></slot></span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbInputGroupText);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbInputGroupText;
  }
}
