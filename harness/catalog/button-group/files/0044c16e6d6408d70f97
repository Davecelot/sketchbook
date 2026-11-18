import { html, LitElement } from 'lit';

import { buttonGroupStyles } from './ButtonGroup.styles';

const TAG = 'sb-button-group-separator';

export class SbButtonGroupSeparator extends LitElement {
  static override styles = buttonGroupStyles;

  protected override render() {
    return html`<div part="separator" aria-hidden="true"></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbButtonGroupSeparator);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbButtonGroupSeparator;
  }
}
