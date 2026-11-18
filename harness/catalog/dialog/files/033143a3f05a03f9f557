import { html, LitElement } from 'lit';

import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog-header';

export class SbDialogHeader extends LitElement {
  static override styles = dialogStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialogHeader);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialogHeader;
  }
}
