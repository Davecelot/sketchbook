import { html, LitElement } from 'lit';

import { buttonGroupStyles } from './ButtonGroup.styles';

const TAG = 'sb-button-group-text';

export class SbButtonGroupText extends LitElement {
  static override styles = buttonGroupStyles;

  protected override render() {
    return html`<div part="text"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbButtonGroupText);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbButtonGroupText;
  }
}
