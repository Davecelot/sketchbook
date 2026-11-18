import { html, LitElement } from 'lit';

import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog-footer';

export class SbDialogFooter extends LitElement {
  static override styles = dialogStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialogFooter);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialogFooter;
  }
}
